# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 절대 규칙

1. `.env` 파일 절대 수정 금지 — 환경변수는 읽기만
2. 계획 없이 코드 수정 시작 금지 — 반드시 planner 먼저 실행
3. `node_modules/` 건드리지 않음
4. ESM 전용 프로젝트 — `require()` / `module.exports` 사용 금지, `import/export`만
5. API 키·시크릿을 코드에 하드코딩 금지 — 항상 `process.env.*` 참조

## 워크플로우

```
새 작업 요청 → /agent:planner → 사용자 승인 → /agent:coder → /agent:reviewer → commit
```

## 프로젝트 구조

```
src/
  index.js          # 오케스트레이터 (진입점)
  agents/
    collector.js    # RSS 수집 → Claude 요약/분류
    writer.js       # 뉴스레터 헤드라인·요약 생성
  lib/
    claude.js       # runAgent() — tool-use 루프
    notion.js       # Notion DB 저장
    slack.js        # Slack Webhook 알림
.github/workflows/
  daily-news.yml    # 매일 09:00 KST 자동 실행
```

## 환경변수 (`.env` 또는 GitHub Secrets)

| 변수 | 용도 |
|------|------|
| `ANTHROPIC_API_KEY` | Claude API |
| `NOTION_API_KEY` | Notion 저장 |
| `NOTION_DATABASE_ID` | 대상 DB |
| `SLACK_WEBHOOK_URL` | Slack 알림 |
| `UPSTASH_REDIS_REST_URL` | 중복 제거 (선택) |
| `UPSTASH_REDIS_REST_TOKEN` | 중복 제거 (선택) |

## 실행

```bash
npm run agent      # 로컬 실행 (.env 자동 로드)
npm run dev        # watch 모드
```
