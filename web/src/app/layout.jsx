// web/src/app/layout.jsx
import './globals.css'

export const metadata = {
  title: 'AI Daily Brief — 이동희',
  description: 'Claude AI Agent가 매일 수집하는 AI/ML 뉴스 브리핑',
  openGraph: {
    title: 'AI Daily Brief',
    description: 'Claude AI Agent가 매일 수집하는 AI/ML 뉴스 브리핑',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
