// src/agents/collector.js
import { runAgent } from '../lib/claude.js'

/** @type {import('@anthropic-ai/sdk').Tool[]} */
const WEB_SEARCH_TOOL = [
  {
    type: 'web_search_20250305',
    name: 'web_search',
  },
]

const SYSTEM = `당신은 AI/ML 업계 전문 뉴스 수집 에이전트입니다.
오늘의 AI 뉴스를 수집하고 아래 JSON 형식으로만 응답하세요.

응답 형식 (JSON만, 마크다운 코드블록 없이):
{
  "items": [
    {
      "title": "뉴스 제목",
      "summary": "2~3문장 한국어 요약",
      "url": "https://...",
      "source": "출처 이름",
      "tags": ["LLM", "OpenAI"],
      "importance": "high" | "medium" | "low"
    }
  ]
}

importance 기준:
- high: 모델 출시/업데이트, 대형 투자/인수, 규제 변화, 업계 지각변동
- medium: 연구 논문, 기업 전략, 제품 업데이트
- low: 일반 활용 사례, 칼럼

최소 8개, 최대 15개 수집. 반드시 JSON만 반환.`

/**
 * 뉴스 수집 서브에이전트
 * @returns {Promise<import('../types/index.js').NewsItem[]>}
 */
export async function collectNews() {
  console.log('📡 [Collector] 뉴스 수집 시작...')

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const raw = await runAgent({
    system: SYSTEM,
    prompt: `오늘(${today}) 기준 최신 AI/ML 뉴스를 수집해주세요.
검색 키워드: "AI news today", "LLM 2025", "OpenAI OR Anthropic OR Google DeepMind OR Meta AI"
한국 AI 동향도 포함해주세요: "한국 AI", "네이버 AI", "카카오 AI"`,
    tools: WEB_SEARCH_TOOL,
  })

  try {
    // JSON 추출 (Claude가 가끔 앞뒤에 텍스트를 붙이는 경우 대비)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found in response')
    const parsed = JSON.parse(jsonMatch[0])
    const items = parsed.items ?? []
    console.log(`  ✅ ${items.length}개 뉴스 수집 완료`)
    return items
  } catch (e) {
    console.error('  ❌ JSON 파싱 실패:', e.message)
    console.error('  Raw:', raw.slice(0, 300))
    throw e
  }
}
