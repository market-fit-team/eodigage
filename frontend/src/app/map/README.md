# map
## 원칙
1. 레이아웃 관련된 상태들은 위로 끌어올리고 zustand로 상태관리를 하도록 하였습니다. 
2. 채팅 관련 기능은 features/agent 폴더 안에서 구현해두고 이 위젯을 사이드바로 끌고 왔습니다. 따라서 agent-map 의존성이 있습니다.


# AI 노트
## `src/app/map/page.tsx`

`src/app/map/page.tsx`는 map route entry만 둔다. 화면 상태 provider를 감싸고 `MapView`를 렌더링한다.

```tsx
export default function MapPage() {
  return (
    <MapStoreProvider>
      <ChatStoreProvider>
        <Suspense fallback={...}>
          <MapView />
        </Suspense>
      </ChatStoreProvider>
    </MapStoreProvider>
  )
}
```

`MapStoreProvider`는 지도 레이아웃, 필터, 선택 상권, persona 상태를 가진다. `ChatStoreProvider`는 agent 대화 상태만 가진다.

## `src/features/map/components/map-view.tsx`

`MapView`는 Gemini 와이어프레임의 화면 배치를 보존한다. 왼쪽 필터, 중앙 지도, 하단 결과, 오른쪽 agent 패널을 한 파일에서 배치한다.

```text
MapView
  -> FilterWidget      left sidebar
  -> CanvasWidget      center map
  -> ResultWidget      bottom dock
  -> MapChatWidget     right sidebar
```

사이드바 container 파일은 만들지 않는다. 왼쪽과 오른쪽 패널의 위치, 토글 버튼, 결과 패널 offset은 `MapView`에서 바로 읽힌다.

```tsx
const isFilterOpen = useMapStore((state) => state.isFilterOpen)
const isChatOpen = useMapStore((state) => state.isChatOpen)
```

위젯은 자기 내용만 렌더링한다. `FilterWidget`은 필터 form을 그리고, `CanvasWidget`은 SVG map을 그리고, `ResultWidget`은 선택 상권 결과를 그린다.

## `src/features/map/components`

`features/map/components`는 map page 안에서만 쓰는 위젯을 폴더 단위로 둔다. barrel export는 쓰지 않는다.

```text
src/features/map/components
├── map-view.tsx
├── canvas-widget/canvas-widget.tsx
├── filter-widget/filter-widget.tsx
└── result-widget/result-widget.tsx
```

`canvas-widget/canvas-widget.tsx`는 `selectedTradeAreaId`만 갱신한다.

```tsx
onClick={() => {
  setSelectedTradeAreaId(district.id)
}}
```

`result-widget/result-widget.tsx`의 리포트 버튼은 선택 상권 id만 query로 넘긴다. 대화 내용을 `localStorage`로 전달하지 않는다.

```tsx
router.push(`/report?district=${selectedTradeArea.id}`)
```

## `src/features/map/store`

`src/features/map/store/map-store.tsx`는 Zustand vanilla store를 React context로 주입한다. 이 패턴은 route subtree에 store instance를 묶는다.

```text
src/features/map/store
├── map-store.tsx
└── slices
    ├── filter-slice.ts
    ├── layout-slice.ts
    ├── persona-slice.ts
    └── selection-slice.ts
```

각 slice는 map UI 상태만 가진다.

```ts
export type MapState = FilterSlice & LayoutSlice & PersonaSlice & SelectionSlice
```

`layout-slice.ts`는 사이드바 열림 상태를 가진다.

```ts
isFilterOpen: true
isChatOpen: false
```

`filter-slice.ts`는 적용된 필터를 가진다.

```ts
selectedCategory: "all"
budgetRange: "all"
targetDemographic: "all"
recommendationsOnly: false
```

`selection-slice.ts`는 지도와 결과 패널이 같이 쓰는 선택 상태를 가진다.

```ts
selectedTradeAreaId: districtsData[0]?.id ?? null
activeResultTab: "traffic"
```

## `src/features/agent`

`features/agent`는 AI agent 채팅 영역이다. map layout state를 import하지 않는다.

```text
src/features/agent
├── components/map-chat-widget/map-chat-widget.tsx
├── lib/build-map-chat-reply.ts
├── store/chat-store.tsx
├── store/slices/conversation-slice.ts
└── types/chat.ts
```

`map-chat-widget.tsx`는 선택 상권을 props로 받는다.

```tsx
<MapChatWidget selectedTradeArea={selectedTradeArea} onClose={closeChat} />
```

`conversation-slice.ts`는 일반 대화 상태만 가진다.

```ts
messages: ChatMessage[]
isResponding: boolean
```

`build-map-chat-reply.ts`는 현재 wireframe용 mock 응답이다. 실제 agent API가 붙으면 이 파일을 교체한다.

## Gemini 와이어프레임 리팩터링

Gemini 와이어프레임은 `src/features/district-map/components/district-map-screen.tsx` 한 파일에 layout, filter, SVG map, result panel, chat UI, mock reply가 모두 들어가 있었다.

리팩터링 기준:

```text
district-map-screen.tsx
-> src/app/map/page.tsx
-> src/features/map/components/map-view.tsx
-> src/features/map/components/*-widget/*-widget.tsx
-> src/features/map/store/slices/*.ts
-> src/features/agent/components/map-chat-widget/map-chat-widget.tsx
```

화면 배치는 `MapView`에 남긴다. 위젯 폴더는 각 UI 영역의 내용을 맡는다. agent 대화 상태는 `features/agent/store/chat-store.tsx`로 이동했다.

`src/features/report/components/report-screen.tsx`는 더 이상 `g15_temp_chat`을 읽지 않는다. 리포트 화면은 `district` query만 기준으로 렌더링한다.

```text
/report?district=gangnam
```

## 주요 파일

- `src/app/map/page.tsx`
- `src/features/map/components/map-view.tsx`
- `src/features/map/components/canvas-widget/canvas-widget.tsx`
- `src/features/map/components/filter-widget/filter-widget.tsx`
- `src/features/map/components/result-widget/result-widget.tsx`
- `src/features/map/store/map-store.tsx`
- `src/features/map/store/slices/layout-slice.ts`
- `src/features/map/store/slices/filter-slice.ts`
- `src/features/map/store/slices/persona-slice.ts`
- `src/features/map/store/slices/selection-slice.ts`
- `src/features/agent/components/map-chat-widget/map-chat-widget.tsx`
- `src/features/agent/store/chat-store.tsx`
- `src/features/agent/store/slices/conversation-slice.ts`
- `src/features/agent/lib/build-map-chat-reply.ts`

## 참고 문서

- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://zustand.docs.pmnd.rs/learn/guides/initialize-state-with-props
