// src/agents/writer.js
import { runAgent } from '../lib/claude.js'

const SYSTEM = `당신은 AI 업계 전문 뉴스레터 작성 에이전트입니다.
수집된 뉴스 데이터를 받아 publish_newsletter 도구를 호출해 뉴스레터를 저장하세요.

tone: 전문적이되 딱딱하지 않게, 개발자 독자 기준.
headline: 30자 이내.
digest: 독자가 5초만에 오늘의 흐름을 파악할 수 있게 2~3문장.`

const WRITER_TOOLS = [
  {
    name: 'publish_newsletter',
    description: '작성된 뉴스레터 헤드라인과 요약을 저장합니다.',
    input_schema: {
      type: 'object',
      properties: {
        headline: { type: 'string', description: '오늘을 한 줄로 요약하는 헤드라인 (30자 이내)' },
        digest:   { type: 'string', description: '오늘 AI 씬에서 일어난 일을 2~3문장으로 정리' },
      },
      required: ['headline', 'digest'],
    },
  },
]

/**
 * 뉴스레터 작성 서브에이전트
 * @param {import('../types/index.js').NewsItem[]} items
 * @returns {Promise<{ headline: string, digest: string }>}
 */
export async function writeNewsletter(items) {
  console.log('✍️  [Writer] 뉴스레터 작성 중...')

  const highItems = items.filter(i => i.importance === 'high')
  const prompt = `다음 뉴스 ${items.length}건을 바탕으로 오늘의 AI 뉴스레터 헤드라인과 요약을 작성해주세요.

주요 뉴스 (high importance):
${highItems.map(i => `- ${i.title}: ${i.summary}`).join('\n')}

전체 뉴스 태그: ${[...new Set(items.flatMap(i => i.tags))].join(', ')}`

  let capturedResult = null
  await runAgent({
    system: SYSTEM,
    prompt,
    tools: WRITER_TOOLS,
    toolChoice: { type: 'any' },
    toolHandlers: {
      publish_newsletter: (input) => {
        capturedResult = input
        return '저장 완료'
      },
    },
  })

  if (!capturedResult) {
    console.error('  ❌ publish_newsletter 도구가 호출되지 않았습니다. 폴백 사용.')
    return {
      headline: `AI 뉴스 브리핑 — ${items.length}건`,
      digest: `오늘 ${items.length}건의 AI 뉴스가 수집되었습니다. 주요 태그: ${[...new Set(items.flatMap(i => i.tags))].slice(0, 4).join(', ')}`,
    }
  }
  console.log(`  ✅ 헤드라인: "${capturedResult.headline}"`)
  return capturedResult
}
