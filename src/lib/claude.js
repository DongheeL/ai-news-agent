// src/lib/claude.js
import Anthropic from '@anthropic-ai/sdk'

export const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * 에이전트 실행 — tool_use 루프 처리 포함
 * @param {Object} params
 * @param {string} params.system
 * @param {string} params.prompt
 * @param {Anthropic.Tool[]} [params.tools]
 * @param {Record<string, Function>} [params.toolHandlers]
 * @param {string} [params.model]
 * @returns {Promise<string>}
 */
export async function runAgent({ system, prompt, tools = [], toolHandlers = {}, model = 'claude-sonnet-4-6', toolChoice }) {
  const messages = [{ role: 'user', content: prompt }]
  let firstCall = true

  // tool_use 루프
  while (true) {
    const appliedToolChoice = (tools.length > 0 && toolChoice && firstCall) ? toolChoice : undefined
    const response = await client.messages.create({
      model,
      max_tokens: 8192,
      system,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      // 첫 번째 호출에만 tool_choice 적용 — 이후엔 Claude가 자유롭게 end_turn 가능
      tool_choice: appliedToolChoice,
    })
    firstCall = false

    console.log(`  [runAgent] stop_reason=${response.stop_reason} tool_choice=${JSON.stringify(appliedToolChoice)} content_types=${response.content.map(b => b.type).join(',')}`)

    // 응답을 messages에 추가
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      // 최종 텍스트 반환
      const textBlock = response.content.find(b => b.type === 'text')
      return textBlock?.text ?? ''
    } else if (response.stop_reason === 'tool_use') {
      const toolResults = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        const handler = toolHandlers[block.name]
        if (!handler) throw new Error(`No handler for tool: ${block.name}`)

        console.log(`  🔧 Tool: ${block.name}`, JSON.stringify(block.input).slice(0, 120))
        const result = await handler(block.input)

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        })
      }

      messages.push({ role: 'user', content: toolResults })
    } else {
      // max_tokens 등 기타 stop_reason — 지금까지의 텍스트 반환
      const textBlock = response.content.find(b => b.type === 'text')
      return textBlock?.text ?? ''
    }
  }
}
