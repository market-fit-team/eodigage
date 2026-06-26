# web-tools

## `backend/services/agent-service/src/agent/services/chat/tools/web_tool/web_tool.py`

`web_search`와 `web_fetch`는 LangChain `@tool` 함수다.  
둘 다 `default_allowed=True`로 등록되어 승인 없이 바로 실행할 수 있다.

```py
@tool
async def web_search(
    query: str,
    limit: int = 5,
    page: int = 1,
    language: str = "ko-KR",
) -> dict[str, Any]:
    ...

@tool
async def web_fetch(
    url: str,
    format: Literal["text", "html"] = "text",
) -> dict[str, Any]:
    ...
```

`web_search`는 SearXNG JSON 응답을 바로 프론트에서 다루기 쉬운 shape로 줄인다.

```json
{
  "query": "OpenAI API Responses",
  "page": 1,
  "results_count": 184000,
  "results": [
    {
      "rank": 1,
      "title": "OpenAI | Research & Deployment",
      "url": "https://openai.com/",
      "snippet": "An OpenAI model has disproved...",
      "engine": "bing",
      "engines": ["bing"],
      "published_date": null
    }
  ]
}
```

`web_fetch`는 HTML이면 읽을 수 있는 텍스트로 정규화하고, `format=html`이면 원문 HTML을 남긴다.

```json
{
  "requested_url": "https://openai.com/",
  "final_url": "https://openai.com/",
  "status_code": 200,
  "content_type": "text/html",
  "title": "OpenAI | Research & Deployment",
  "content": "OpenAI | Research & Deployment\n\nOpenAI\n\nWhat can I help with?...",
  "truncated": false
}
```

`web_fetch`는 아래 순서로 공개 웹만 허용한다.

```text
urlparse
-> http/https만 허용
-> username/password 포함 URL 거부
-> hostname DNS resolve
-> localhost / private IP / reserved IP 거부
-> redirect Location을 새 URL로 다시 검증
-> 최대 1MB / 최대 5회 redirect / 최대 20,000자
```

`header`, `nav`, `footer`, `aside`, `script`, `style` 같은 블록은 HTML 본문 추출에서 뺀다.

## `backend/services/agent-service/src/agent/core/config.py`

SearXNG 주소와 API key는 `Settings`에서 읽는다.  
`.env.example`에도 같은 키를 둔다.

```py
class Settings(BaseSettings):
    searxng_search_url: str = "https://metasearch.jongchoi.com/search"
    searxng_api_key: str | None = None
```

```env
SEARXNG_SEARCH_URL=https://metasearch.jongchoi.com/search
SEARXNG_API_KEY=
```

설정이 비어 있으면 `_require_searxng_settings()`가 `ChatToolError`를 던진다.

## `backend/services/agent-service/src/agent/services/chat/toolkits/chat_toolkit.py`

`WEB_TOOL_SPECS`를 기존 registry에 합쳐서 `/api/v1/llm/tools`와 model bind 둘 다 같은 목록을 본다.

```py
CHAT_TOOL_SPECS = validate_tool_specs(
    (
        *CALCULATOR_TOOL_SPECS,
        *MEMORY_TOOL_SPECS,
        *ARTIFACT_TOOL_SPECS,
        *DOCUMENT_TOOL_SPECS,
        *ONBOARDING_TOOL_SPECS,
        *WEB_TOOL_SPECS,
    )
)
```

모델이 실제로 읽는 설명은 `tool.description`이고, 프론트 정책 UI가 읽는 설명은 `ToolSpec.description`이다.  
웹 도구는 둘 다 같은 제약을 드러내게 맞춘다.

## `frontend/src/features/chat/lib/tool-results/chat-web-tool-result.ts`

프론트는 ToolMessage JSON을 바로 믿지 않는다.  
`web_search`와 `web_fetch` 결과는 Zod로 한 번 더 파싱한다.

```ts
export const chatWebSearchToolResultSchema = z.object({
  query: z.string().min(1),
  page: z.number().int().positive(),
  results_count: z.number().int().nonnegative().nullable(),
  results: z.array(
    z.object({
      rank: z.number().int().positive(),
      title: z.string().min(1),
      url: z.string().min(1),
      snippet: z.string(),
      engine: z.string().nullable(),
      engines: z.array(z.string()),
      published_date: z.string().nullable(),
    })
  ),
})
```

```ts
export const parseChatWebSearchToolResult = (value: unknown) => {
  const result = chatWebSearchToolResultSchema.safeParse(
    parseToolPayload(value)
  )
  return result.success ? result.data : null
}
```

문자열 JSON이 아니거나 필수 키가 빠지면 `null`을 돌리고, 채팅 타임라인은 전용 카드 대신 일반 도구 결과 블록만 보여준다.

## `frontend/src/features/chat/lib/workspace/group-chat-turns.ts`

assistant turn 조립 단계에서 `web_search`와 `web_fetch`를 전용 카드로 분류한다.

```ts
export type ChatTurnToolCard =
  | { kind: "artifact"; artifact: ArtifactResponse }
  | { kind: "library-document"; document: DocumentResponse }
  | { kind: "web-search"; result: ChatWebSearchToolResult }
  | { kind: "web-fetch"; result: ChatWebFetchToolResult }
```

```ts
if (toolCallName === "web_search") {
  const result = parseChatWebSearchToolResult(parsed)
  if (result) {
    return [{ kind: "web-search", result }]
  }
}
```

ToolMessage 본문이 JSON 문자열이면 `resultSummary`도 들여쓴 JSON으로 다시 만든다.  
기존 사고 패널과 복사 텍스트에서도 같은 결과를 재사용한다.

## `frontend/src/features/chat/components/workspace/chat-view.tsx`

채팅 타임라인에는 두 개의 진입점이 있다.

```text
도구 호출 결과 블록의 "열기"
-> web_search / web_fetch면 전용 우측 패널
-> 그 외 tool이면 thinking 패널

웹 결과 미리보기 카드의 "패널 보기"
-> web-search / web-fetch 우측 패널
```

`web_search`는 상위 2개 결과만 요약 카드로 보여준다.

```ts
<WebSearchTimelineCard
  result={card.result}
  onOpen={() => onOpenWebSearch(card.result)}
/>
```

`web_fetch`는 제목, 최종 URL, status, content_type, 본문 미리보기를 요약 카드로 보여준다.

```ts
<WebFetchTimelineCard
  result={card.result}
  onOpen={() => onOpenWebFetch(card.result)}
/>
```

## `frontend/src/features/chat/components/workspace/right-sidebar.tsx`

우측 패널 state에 웹 결과 전용 kind를 추가했다.

```ts
export type ChatRightPanel =
  | { kind: "web-search"; result: ChatWebSearchToolResult }
  | { kind: "web-fetch"; result: ChatWebFetchToolResult }
  | ...
```

`WebSearchViewer`는 결과 목록을 카드로 그리고 외부 링크 버튼을 둔다.

```ts
<Button asChild variant="outline" size="sm">
  <a href={searchResult.url} target="_blank" rel="noreferrer">
    <ExternalLink className="size-3" />
    열기
  </a>
</Button>
```

`WebFetchViewer`는 URL 메타데이터와 정규화된 본문을 같이 보여준다.

```ts
<dl>
  <dt>요청 URL</dt>
  <dd>{result.requested_url}</dd>
  <dt>최종 URL</dt>
  <dd>{result.final_url}</dd>
</dl>

<RawTextBlock value={result.content} />
```

## 테스트

백엔드는 `web_search`와 `web_fetch`를 실제 함수로 호출해 응답 shape를 확인했다.  
`web_search("OpenAI API Responses")`는 결과 목록을 반환했고, `web_fetch("https://openai.com/")`는 200 응답과 정규화된 텍스트를 반환했다.

프론트는 아래 테스트가 웹 카드와 패널을 확인한다.

```text
src/features/chat/lib/tool-results/__tests__/chat-web-tool-result.test.ts
src/features/chat/lib/workspace/__tests__/group-chat-turns.test.ts
src/features/chat/components/workspace/__tests__/chat-view.test.tsx
src/features/chat/components/workspace/__tests__/right-sidebar.test.tsx
```

## 주요 파일

- `backend/services/agent-service/src/agent/core/config.py`
- `backend/services/agent-service/src/agent/services/chat/toolkits/chat_toolkit.py`
- `backend/services/agent-service/src/agent/services/chat/tools/web_tool/web_tool.py`
- `backend/services/agent-service/tests/unit_tests/test_web_tool.py`
- `frontend/src/features/chat/lib/tool-results/chat-web-tool-result.ts`
- `frontend/src/features/chat/lib/workspace/group-chat-turns.ts`
- `frontend/src/features/chat/components/workspace/chat-view.tsx`
- `frontend/src/features/chat/components/workspace/right-sidebar.tsx`
- `frontend/src/features/chat/types/workspace.ts`

## 참고 문서

- LangChain Tools: `https://docs.langchain.com/oss/python/langchain/tools`
- Next.js App Router: `https://nextjs.org/docs/app`
- Zod: `https://zod.dev/`
