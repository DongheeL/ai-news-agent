// web/src/app/page.jsx
import { getNewsletters } from '../lib/notion'
import Link from 'next/link'

export const revalidate = 3600 // 1시간마다 ISR 재생성

export default async function HomePage() {
  const newsletters = await getNewsletters(30)

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* 헤더 */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">AI Daily Brief</h1>
              <p className="text-xs text-gray-500 mt-0.5">Claude Agent가 매일 수집하는 AI 뉴스</p>
            </div>
          </div>
          <a
            href="https://github.com/DongheeL/ai-news-agent"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </header>

      {/* 뉴스레터 목록 */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 통계 */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: '총 발행', value: `${newsletters.length}호` },
            { label: '총 뉴스', value: `${newsletters.reduce((s, n) => s + n.itemCount, 0)}건` },
            { label: '수집 주기', value: '매일 9시' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 목록 */}
        <div className="space-y-4">
          {newsletters.map((n, i) => (
            <Link
              key={n.id}
              href={`/issue/${n.id}`}
              className="block bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-gray-500 hover:bg-gray-800/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500 font-mono">#{newsletters.length - i}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{n.date}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-blue-500">{n.itemCount}건</span>
                  </div>
                  <h2 className="text-white font-medium text-sm leading-relaxed group-hover:text-blue-300 transition-colors truncate">
                    {n.headline}
                  </h2>
                  {n.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {n.tags.slice(0, 5).map(tag => (
                        <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-gray-600 group-hover:text-gray-400 transition-colors mt-1 shrink-0">→</span>
              </div>
            </Link>
          ))}
        </div>

        {newsletters.length === 0 && (
          <div className="text-center text-gray-600 py-20">
            <div className="text-4xl mb-4">📭</div>
            <p>아직 발행된 뉴스레터가 없습니다.</p>
            <p className="text-sm mt-2">GitHub Actions가 내일 오전 9시에 첫 호를 발행합니다.</p>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-xs text-gray-600">
          Powered by Claude API · Notion · GitHub Actions
          <br />
          <a href="https://donghee.dev" className="hover:text-gray-400 transition-colors mt-1 inline-block">
            이동희 포트폴리오로 돌아가기 →
          </a>
        </div>
      </footer>
    </main>
  )
}
