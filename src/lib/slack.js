// src/lib/slack.js

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

/**
 * Slack으로 뉴스레터 알림 전송
 * @param {import('../types/index.js').NewsletterResult} newsletter
 * @param {string} notionUrl
 */
export async function sendToSlack(newsletter, notionUrl) {
  const { date, headline, items, digest } = newsletter

  const highItems = items.filter(i => i.importance === 'high')

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🤖 AI 뉴스 브리핑 | ${date}`, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*${headline}*\n${digest}` },
    },
    { type: 'divider' },
    ...(highItems.length > 0
      ? [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🔥 *주요 뉴스 (${highItems.length}건)*\n${highItems
                .map(i => `• <${i.url}|${i.title}>\n  ${i.summary}`)
                .join('\n')}`,
            },
          },
          { type: 'divider' },
        ]
      : []),
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📰 전체 ${items.length}건 수집 | 태그: ${[...new Set(items.flatMap(i => i.tags))].slice(0, 6).map(t => `\`${t}\``).join(' ')}`,
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: 'Notion에서 보기 →', emoji: true },
        url: notionUrl,
        style: 'primary',
      },
    },
  ]

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  })

  if (!res.ok) throw new Error(`Slack 전송 실패: ${res.status}`)
  console.log('  ✅ Slack 전송 완료')
}
