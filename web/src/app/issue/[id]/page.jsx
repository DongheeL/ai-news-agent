// web/src/app/issue/[id]/page.jsx
import { getNewsletters, getNewsletterBlocks } from '../../../lib/notion'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export async function generateStaticParams() {
  const newsletters = await getNewsletters(30)
  return newsletters.map(n => ({ id: n.id }))
}

function renderBlock(block) {
  switch (block.type) {
    case 'heading_2':
      return (
        <h2 key={block.id} className="text-base font-bold text-white mt-8 mb-4 pb-2 border-b border-gray-800">
          {block.heading_2.rich_text.map(t => t.plain_text).join('')}
        </h2>
      )
    case 'paragraph':
      return (
        <p key={block.id} className="text-gray-300 text-sm leading-relaxed mb-4">
          {block.paragraph.rich_text.map(t => t.plain_text).join('')}
        </p>
      )
    case 'bulleted_list_item': {
      const text = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('')
      const isHigh = block.bulleted_list_item.color === 'red_background'
      const lines = text.split('\n')
      const title = lines[0]
      const rest = lines.slice(1)
      return (
        <div key={block.id} className={`rounded-lg p-5 mb-5 border-l-[3px] ${isHigh ? 'bg-red-950/20 border border-red-900/40 border-l-red-500' : 'bg-gray-900 border border-gray-700 border-l-blue-700'}`}>
          <p className="text-sm font-semibold text-white mb-2">{title}</p>
          {rest.map((line, i) => (
            <p key={i} className="text-xs text-gray-400 leading-relaxed mt-1">{line}</p>
          ))}
        </div>
      )
    }
    case 'divider':
      return <hr key={block.id} className="border-gray-700 my-6" />
    default:
      return null
  }
}

export default async function IssuePage({ params }) {
  const { id } = await params
  const [newsletters, blocks] = await Promise.all([
    getNewsletters(30),
    getNewsletterBlocks(id),
  ])

  const current = newsletters.find(n => n.id === id)
  if (!current) notFound()

  const currentIdx = newsletters.findIndex(n => n.id === id)
  const prev = newsletters[currentIdx + 1] ?? null
  const next = newsletters[currentIdx - 1] ?? null

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">
            ← 목록
          </Link>
          <span className="text-gray-700">|</span>
          <span className="text-xs text-gray-500">{current.date}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 이슈 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🤖</span>
            <span className="text-sm text-blue-400 font-mono">
              #{newsletters.length - currentIdx} · {current.date}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white leading-relaxed mb-4">
            {current.headline}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs bg-blue-900/40 text-blue-400 border border-blue-800/50 px-2.5 py-1 rounded-full">
              {current.itemCount}건 수집
            </span>
            {current.tags.map(tag => (
              <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 본문 */}
        <div className="prose-sm">
          {blocks.map(block => renderBlock(block))}
        </div>

        {/* 이전/다음 네비게이션 */}
        <div className="grid grid-cols-2 gap-3 mt-12 pt-6 border-t border-gray-800">
          {prev ? (
            <Link href={`/issue/${prev.id}`} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-all group">
              <div className="text-xs text-gray-500 mb-1">← 이전호</div>
              <div className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-2">{prev.headline}</div>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/issue/${next.id}`} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-all group text-right">
              <div className="text-xs text-gray-500 mb-1">다음호 →</div>
              <div className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-2">{next.headline}</div>
            </Link>
          ) : <div />}
        </div>
      </div>
    </main>
  )
}
