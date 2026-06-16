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
export async function runAgent({ system, prompt, tools = [], toolHandlers = {}, model = 'claude-sonnet-4-6' }) {
  const messages = [{ role: 'user', content: prompt }]

  // tool_use 루프
  while (true) {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system,
      messages,
      tools: tools.length > 0 ? tools : undefined,
    })

    // 응답을 messages에 추가
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      // 최종 텍스트 반환
      const textBlock = response.content.find(b => b.type === 'text')
      return textBlock?.text ?? ''
    }

    if (response.stop_reason === 'tool_use') {
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
    }
  }
}
