// src/index.js — Orchestrator
import { collectNews } from './agents/collector.js'
import { writeNewsletter } from './agents/writer.js'
import { saveToNotion } from './lib/notion.js'
import { sendToSlack } from './lib/slack.js'
import { logger } from './lib/logger.js'

// GitHub Actions 실행 URL (로컬 실행 시 undefined)
const RUN_URL = process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : null

async function notifySlackError({ date, stage, err, elapsed }) {
  if (!process.env.SLACK_WEBHOOK_URL) return

  const stack = err.stack
    ? err.stack.split('\n').slice(0, 4).join('\n')
    : err.message

  const lines = [
    `❌ AI 뉴스 에이전트 실패 (${date})`,
    `단계: *${stage}*`,
    `오류: \`${err.message}\``,
    `경과: ${elapsed}s`,
    '```',
    stack,
    '```',
  ]
  if (RUN_URL) lines.push(`🔍 로그·아티팩트: ${RUN_URL}`)

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: lines.join('\n') }),
  }).catch(() => {})
}

async function main() {
  const startTime = Date.now()
  const date = new Date().toISOString().split('T')[0]
  let stage = 'init'

  logger.info(`AI 뉴스 에이전트 시작`, { date })

  try {
    // ① Collector
    stage = 'collector'
    const items = await collectNews()
    if (items.length === 0) throw new Error('수집된 뉴스가 없습니다')
    logger.info('뉴스 수집 완료', { count: items.length })

    // ② Writer
    stage = 'writer'
    const { headline, digest } = await writeNewsletter(items)
    logger.info('뉴스레터 작성 완료', { headline })

    /** @type {import('./types/index.js').NewsletterResult} */
    const newsletter = { date, headline, items, digest }

    // ③ Notion 저장
    stage = 'notion'
    const notionUrl = await saveToNotion(newsletter)
    logger.info('Notion 저장 완료', { notionUrl })

    // ④ Slack 알림
    stage = 'slack'
    await sendToSlack(newsletter, notionUrl)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    logger.info('완료', { elapsed: `${elapsed}s`, count: items.length })

  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    logger.error('에이전트 실패', { stage, message: err.message, stack: err.stack, elapsed })

    await notifySlackError({ date, stage, err, elapsed })
    process.exit(1)
  }
}

main()
