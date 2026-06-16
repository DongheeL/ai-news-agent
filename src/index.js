// src/index.js — Orchestrator
import { collectNews } from './agents/collector.js'
import { writeNewsletter } from './agents/writer.js'
import { saveToNotion } from './lib/notion.js'
import { sendToSlack } from './lib/slack.js'

async function main() {
  const startTime = Date.now()
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  console.log(`\n🚀 AI 뉴스 에이전트 시작 | ${date}\n${'─'.repeat(50)}`)

  try {
    // ① Collector Subagent
    const items = await collectNews()
    if (items.length === 0) throw new Error('수집된 뉴스가 없습니다')

    // ② Writer Subagent
    const { headline, digest } = await writeNewsletter(items)

    /** @type {import('./types/index.js').NewsletterResult} */
    const newsletter = { date, headline, items, digest }

    // ③ Publisher — Notion 저장
    const notionUrl = await saveToNotion(newsletter)

    // ④ Publisher — Slack 알림
    await sendToSlack(newsletter, notionUrl)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n✅ 완료 | ${elapsed}s | 뉴스 ${items.length}건\n${'─'.repeat(50)}`)

  } catch (err) {
    console.error('\n❌ 에이전트 오류:', err.message)

    // Slack 에러 알림
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `❌ AI 뉴스 에이전트 실패 (${date})\n\`${err.message}\``,
        }),
      }).catch(() => {})
    }

    process.exit(1)
  }
}

main()
