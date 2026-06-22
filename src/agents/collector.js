// src/agents/collector.js
import { runAgent } from "../lib/claude.js";

const RSS_FEEDS = [
  // 공식 발표 — 가장 중요한 뉴스 소스
  { url: "https://openai.com/blog/rss.xml", source: "OpenAI" },
  { url: "https://www.anthropic.com/rss.xml", source: "Anthropic" },
  { url: "https://huggingface.co/blog/feed.xml", source: "Hugging Face" },

  // AI 뉴스 미디어
  { url: "https://www.marktechpost.com/feed/", source: "MarkTechPost" },
  { url: "https://venturebeat.com/category/ai/feed/", source: "VentureBeat" },

  // 커뮤니티 (점수 50 이상만 → 노이즈 차단)
  {
    url: "https://hnrss.org/frontpage?points=100",
    source: "HackerNews",
  },
];

/** XML 태그 텍스트 내용 추출 (CDATA 처리 포함) */
function extractTag(xml, tag) {
  const cdata = xml.match(
    new RegExp(
      `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`,
      "i",
    ),
  );
  if (cdata) return cdata[1].trim();
  const plain = xml.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  );
  return plain ? plain[1].trim() : "";
}

/** Atom <link href="..."/> 추출 — rel="alternate" 우선 */
function extractAtomLink(block) {
  const re = /<link([^>]*)\/?>/gi;
  let m;
  while ((m = re.exec(block)) !== null) {
    const attrs = m[1];
    if (/rel=["']alternate["']/i.test(attrs)) {
      const href = attrs.match(/href=["']([^"']+)["']/i);
      if (href) return href[1];
    }
  }
  const fallback = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i);
  return fallback ? fallback[1] : "";
}

/** HTML 태그 제거 및 기본 엔티티 디코딩 */
function stripHtml(str) {
  return str
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** RSS 2.0 / Atom XML 파싱 → 아이템 배열 반환 */
function parseItems(xml, feedName) {
  const isAtom = /<feed\b/i.test(xml);
  const blockTag = isAtom ? "entry" : "item";
  const re = new RegExp(`<${blockTag}[^>]*>([\\s\\S]*?)<\\/${blockTag}>`, "gi");
  const items = [];
  let m;

  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const title = stripHtml(extractTag(block, "title"));
    const link = isAtom
      ? extractAtomLink(block) || extractTag(block, "link")
      : extractTag(block, "link") || extractAtomLink(block);
    const desc = stripHtml(
      extractTag(block, "description") ||
        extractTag(block, "summary") ||
        extractTag(block, "content"),
    ).slice(0, 250);
    const rawDate =
      extractTag(block, "pubDate") ||
      extractTag(block, "published") ||
      extractTag(block, "updated");

    if (!title || !link) continue;
    items.push({
      title,
      link,
      desc,
      pubDate: rawDate ? new Date(rawDate) : new Date(0),
      source: feedName,
    });
  }

  return items;
}

async function fetchFeed({ url, source, keywords }) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 AI-News-Agent/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    let items = parseItems(xml, source);
    if (keywords?.length) {
      const pattern = new RegExp(keywords.join("|"), "i");
      items = items.filter((item) => pattern.test(item.title));
    }
    return items;
  } catch (e) {
    console.warn(`  ⚠️  ${source} 실패:`, e.message);
    return [];
  }
}

const SYSTEM = `당신은 AI/ML 업계 전문 뉴스 에디터입니다.
제공된 RSS 피드 원문을 분석해 중요한 AI/ML 뉴스를 선별하고,
반드시 process_news_items 도구를 호출해 결과를 저장하세요.

포함 기준 — 다음 주제에 해당해야 선별:
- AI / ML / LLM / 생성형 AI
- 개발 도구, 코딩 어시스턴트, API
- AI 관련 기업 전략·제품·연구

제외 기준 — 아래 주제는 무조건 제외:
- 정치, 선거, 외교
- 스포츠, 연예, 문화
- 금융·주식·부동산 (AI 투자 유치 제외)
- 기타 AI/ML/개발과 무관한 일반 뉴스

importance 기준:
- high: 모델 출시/업데이트, 대형 투자/인수, 규제 변화, 업계 지각변동
- medium: 연구 논문, 기업 전략, 제품 업데이트
- low: 일반 활용 사례, 칼럼

중복 뉴스는 제거하고 최소 5개, 최대 15개 선별.
title은 한국어로 번역, summary는 2~3문장 한국어로 작성.`;

const COLLECTOR_TOOLS = [
  {
    name: "process_news_items",
    description: "선별 및 번역된 뉴스 아이템 목록을 저장합니다.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "한국어 번역 제목" },
              summary: { type: "string", description: "2~3문장 한국어 요약" },
              url: { type: "string", description: "원본 기사 링크" },
              source: { type: "string", description: "출처 이름" },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "관련 태그",
              },
              importance: { type: "string", enum: ["high", "medium", "low"] },
            },
            required: [
              "title",
              "summary",
              "url",
              "source",
              "tags",
              "importance",
            ],
          },
        },
      },
      required: ["items"],
    },
  },
];

/**
 * RSS 피드에서 뉴스 수집 후 Claude로 요약/분류
 * @returns {Promise<import('../types/index.js').NewsItem[]>}
 */
export async function collectNews() {
  console.log("📡 [Collector] RSS 피드 수집 중...");

  const all = (await Promise.all(RSS_FEEDS.map(fetchFeed))).flat();
  console.log(`  📥 전체 수집: ${all.length}건`);

  // 24시간 필터, 부족하면 72시간으로 확장
  const now = Date.now();
  let cutoffH = 24;
  let recent = all.filter(
    (i) => now - i.pubDate.getTime() < cutoffH * 3_600_000,
  );

  if (recent.length < 5) {
    cutoffH = 72;
    recent = all.filter((i) => now - i.pubDate.getTime() < cutoffH * 3_600_000);
    console.log(`  ⏰ 24시간 기사 부족 → 72시간으로 확장 (${recent.length}건)`);
  }

  if (recent.length === 0)
    throw new Error("RSS 피드에서 수집된 기사가 없습니다");

  // 최대 30건을 Claude에 전달
  const batch = recent.slice(0, 30);
  const feedText = batch
    .map(
      (item, i) =>
        `[${i + 1}] [${item.source}] ${item.title}\nURL: ${item.link}\n${item.desc}`,
    )
    .join("\n\n");

  const prompt = `다음은 RSS 피드에서 수집한 최신 AI/ML 뉴스 ${batch.length}건입니다. 중요도에 따라 선별하고 한국어로 요약해주세요.\n\n${feedText}`;

  let capturedItems = null;
  await runAgent({
    system: SYSTEM,
    prompt,
    tools: COLLECTOR_TOOLS,
    toolChoice: { type: "any" },
    toolHandlers: {
      process_news_items: (input) => {
        capturedItems = input.items;
        return "저장 완료";
      },
    },
  });

  if (!capturedItems)
    throw new Error("process_news_items 도구가 호출되지 않았습니다");
  console.log(`  ✅ ${capturedItems.length}개 뉴스 선별 완료`);
  return capturedItems;
}
