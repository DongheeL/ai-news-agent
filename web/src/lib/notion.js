// web/src/lib/notion.js
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const DATABASE_ID = process.env.NOTION_DATABASE_ID

/**
 * Notion DB에서 뉴스레터 목록 조회
 * @param {number} [limit=20]
 */
export async function getNewsletters(limit = 20) {
  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    sorts: [{ property: 'Date', direction: 'descending' }],
    page_size: limit,
  })

  return res.results.map(page => {
    const props = page.properties
    return {
      id: page.id,
      url: page.url,
      headline: props.Name?.title?.[0]?.plain_text ?? '제목 없음',
      date: props.Date?.date?.start ?? '',
      tags: props.Tags?.multi_select?.map(t => t.name) ?? [],
      itemCount: props.ItemCount?.number ?? 0,
    }
  })
}

/**
 * 특정 페이지 본문 블록 조회
 * @param {string} pageId
 */
export async function getNewsletterBlocks(pageId) {
  const res = await notion.blocks.children.list({ block_id: pageId })
  return res.results
}
