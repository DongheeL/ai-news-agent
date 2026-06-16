// src/agents/writer.js
import { runAgent } from '../lib/claude.js'

const SYSTEM = `당신은 AI 업계 전문 뉴스레터 작성 에이전트입니다.
수집된 뉴스 데이터를 받아 뉴스레터 형태로 가공합니다.

아래 JSON 형식으로만 응답하세요 (마크다운 코드블록 없이):
{
  "headline": "오늘을 한 줄로 요약하는 헤드라인 (30자 이내)",
  "digest": "오늘 AI 씬에서 일어난 일을 2~3문장으로 정리. 독자가 5초만에 오늘의 흐름을 파악할 수 있게."
}

tone: 전문적이되 딱딱하지 않게, 개발자 독자 기준.`

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

  const raw = await runAgent({ system: SYSTEM, prompt })

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    const result = JSON.parse(jsonMatch[0])
    console.log(`  ✅ 헤드라인: "${result.headline}"`)
    return result
  } catch (e) {
    console.error('  ❌ Writer 파싱 실패:', e.message)
    // 폴백
    return {
      headline: `AI 뉴스 브리핑 — ${items.length}건`,
      digest: `오늘 ${items.length}건의 AI 뉴스가 수집되었습니다. 주요 태그: ${[...new Set(items.flatMap(i => i.tags))].slice(0, 4).join(', ')}`,
    }
  }
}
