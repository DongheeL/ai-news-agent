// src/lib/notion.js
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const DATABASE_ID = process.env.NOTION_DATABASE_ID

/**
 * 뉴스레터 결과를 Notion DB에 저장
 * @param {import('../types/index.js').NewsletterResult} newsletter
 */
export async function saveToNotion(newsletter) {
  const { date, headline, items, digest } = newsletter

  // 페이지 본문 블록 구성
  const children = [
    // 요약 헤딩
    {
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: '📋 오늘의 요약' } }] },
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: digest } }] },
    },
    {
      object: 'block',
      type: 'divider',
      divider: {},
    },
    // 뉴스 아이템
    {
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: '📰 뉴스 목록' } }] },
    },
    ...items.map(item => ({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          {
            type: 'text',
            text: { content: `[${item.importance.toUpperCase()}] ${item.title}\n${item.summary}\n출처: ${item.source}` },
          },
        ],
        color: item.importance === 'high' ? 'red_background' : 'default',
      },
    })),
  ]

  const page = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    icon: { type: 'emoji', emoji: '🤖' },
    properties: {
      // DB 컬럼명에 맞게 수정 필요
      Name: {
        title: [{ type: 'text', text: { content: headline } }],
      },
      Date: {
        date: { start: date },
      },
      Tags: {
        multi_select: [...new Set(items.flatMap(i => i.tags))].slice(0, 5).map(tag => ({ name: tag })),
      },
      ItemCount: {
        number: items.length,
      },
    },
    children,
  })

  console.log(`  ✅ Notion 저장 완료: ${page.url}`)
  return page.url
}
