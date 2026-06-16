# 🤖 AI News Agent

Claude API 기반 멀티에이전트 시스템. 매일 AI/ML 뉴스를 자동 수집해 Notion에 저장하고 Slack으로 알림을 보냅니다.

**데모:** https://ai-news.vercel.app _(배포 후 업데이트)_

## 아키텍처

```
GitHub Actions (매일 09:00 KST)
    │
    ├── Collector Agent  → Claude API + web_search → 뉴스 8~15건 수집
    ├── Writer Agent     → Claude API → 헤드라인/요약 작성
    └── Publisher
            ├── Notion API → DB 저장 (퍼블릭 웹 앱 소스)
            └── Slack Webhook → 팀 알림
```

## 세팅 가이드

### 1. Anthropic API 키
1. [console.anthropic.com](https://console.anthropic.com) 접속
2. API Keys → Create Key
3. `ANTHROPIC_API_KEY`로 저장

### 2. Notion 설정
1. [notion.so/my-integrations](https://www.notion.so/my-integrations) → New integration
2. Name: `AI News Agent`, Content Capabilities: Read/Insert content
3. API 키 복사 → `NOTION_API_KEY`
4. Notion에서 새 DB 생성, 아래 컬럼 추가:
   - `Name` (Title, 기본값)
   - `Date` (Date)
   - `Tags` (Multi-select)
   - `ItemCount` (Number)
5. DB 우측 상단 `...` → Connections → integration 연결
6. DB URL에서 ID 추출: `notion.so/{workspace}/{DATABASE_ID}?v=...` → `NOTION_DATABASE_ID`

### 3. Slack Webhook
1. [api.slack.com/apps](https://api.slack.com/apps) → Create New App → From scratch
2. Incoming Webhooks → Activate → Add New Webhook to Workspace
3. 채널 선택 → URL 복사 → `SLACK_WEBHOOK_URL`

### 4. GitHub Secrets 등록
레포 → Settings → Secrets and variables → Actions → New repository secret:
- `ANTHROPIC_API_KEY`
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`
- `SLACK_WEBHOOK_URL`

### 5. 웹 앱 배포 (Vercel)
```bash
cd web
npx vercel
# Environment Variables에 NOTION_API_KEY, NOTION_DATABASE_ID 등록
```

## 로컬 실행

```bash
# 에이전트 실행
cp .env.example .env  # 키 입력
npm install
npm run agent

# 웹 앱 실행
cd web
cp ../.env.example .env.local
npm install
npm run dev  # localhost:3000
```

## 기술 스택
- **Agent**: Node.js + Claude API (claude-sonnet-4-6) + web_search tool
- **저장소**: Notion API
- **알림**: Slack Incoming Webhooks
- **스케줄링**: GitHub Actions (cron)
- **웹**: Next.js 15 (App Router, ISR) + Tailwind CSS v4 + Vercel
