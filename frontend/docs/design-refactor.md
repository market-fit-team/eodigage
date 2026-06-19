# design-refactor

## `components.json`

`frontend/components.json`은 이미 CSS 변수 기반 shadcn 설정을 사용한다.

```json
{
  "style": "radix-mira",
  "tailwind": {
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "ui": "@/shared/components/ui"
  }
}
```

이 설정에서는 `blue-*`, `zinc-*`, `bg-white`, `border-zinc-*`가 기본 경로가 아니다. `@/shared/components/ui/*`가 이미 `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `border`, `ring` 토큰을 사용한다.

`tailwind.baseColor`와 `tailwind.cssVariables`는 init 시점 설정이다. 이번 리팩터링은 base color를 다시 정하는 작업이 아니라, 이미 생성된 토큰을 화면 코드가 그대로 쓰게 맞추는 작업이다.

## `src/app/globals.css`

`src/app/globals.css`는 Tailwind v4 `@theme inline`으로 토큰을 유틸리티와 JS 둘 다에서 읽을 수 있게 만든다.

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  --secondary: oklch(0.97 0 0);
  --muted: oklch(0.97 0 0);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
}
```

차트와 SVG도 이 토큰을 그대로 쓴다.

```ts
const COLORS = ["var(--chart-1)", "var(--chart-2)"]
```

`#2563eb`, `#1e293b`, `#e4e4e7` 같은 hex는 토큰으로 바꿀 수 있으면 먼저 바꾼다.

## `className`

화면에서 `className`를 남길 이유는 아래 셋이면 충분하다.

- 레이아웃: `flex`, `grid`, `gap`, `max-w-*`, `sticky`, `absolute`, `overflow-*`, `print:*`
- 상태: 현재 경로, 선택 상태, 위험 상태, 성공 상태, disabled 상태
- 데이터 시각화: 지도 polygon, 차트 series, 범례, 인쇄용 식별자

아래 종류는 공용 UI가 이미 책임지면 화면에서 다시 적지 않는다.

```text
surface    -> bg-*, border-*, shadow-*, rounded-*
interaction -> hover:*, focus:*, ring-*, active:*, aria-*, data-*
type scale -> text-xs/relaxed, font-medium, text-muted-foreground
```

판정은 컴포넌트 단위로 본다.

```text
Button + rounded-lg py-3 text-xs        -> 제거
Card + bg-white border-zinc-200 shadow  -> 제거
Input + focus:border-blue-600           -> 제거
Badge 역할 span + rounded-full px-2     -> Badge로 교체
```

반대로 구조와 의미를 나타내는 것은 남길 수 있다.

```text
hero section grid
map 3-panel layout
report printable-sheet
selected district polygon fill/stroke
border-t-4 accent
```

## `@/shared/components/ui/button`

로컬 `Button`은 이미 variant와 size를 갖는다.

```ts
variant.default     -> "bg-primary text-primary-foreground ..."
variant.secondary   -> "bg-secondary text-secondary-foreground ..."
variant.outline     -> "border-border ..."
variant.ghost       -> "hover:bg-muted ..."
variant.destructive -> "bg-destructive/10 text-destructive ..."

size.default -> "h-7 px-2 text-xs/relaxed"
size.lg      -> "h-8 px-2.5 text-xs/relaxed"
```

현재 staged 화면 중 `@/features/startup/components/ui/button`을 쓰는 파일은 아래 다섯 개다.

```text
src/features/home/components/home-screen.tsx
src/features/onboarding/components/onboarding-screen.tsx
src/features/report/components/report-screen.tsx
src/features/mypage/components/mypage-screen.tsx
src/features/district-map/components/district-map-screen.tsx
```

이 다섯 파일은 모두 `@/shared/components/ui/button`으로 옮긴다.

```text
primary   -> default
secondary -> secondary
outline   -> outline
ghost     -> ghost
danger    -> destructive
```

화면에서 버튼에 남겨도 되는 class는 폭, 정렬, 아이콘 애니메이션 정도다.

```text
w-full
justify-between
group-hover:translate-x-1
```

화면에서 빼는 쪽은 아래다.

```text
rounded-lg
py-2.5
py-3
text-xs
shadow-sm
border-blue-600/50
bg-blue-600
text-white
```

버튼 크기는 class가 아니라 `size` prop으로 먼저 해결한다.

## `@/shared/components/ui/card`

로컬 `Card`는 배경, radius, ring, 내부 spacing을 이미 가진다.

```ts
Card        -> "rounded-lg bg-card text-card-foreground ring-1 ring-foreground/10"
CardHeader  -> "px-(--card-spacing)"
CardContent -> "px-(--card-spacing)"
CardFooter  -> "px-(--card-spacing)"
```

현재 staged 화면 중 `@/features/startup/components/ui/card`를 쓰는 파일은 아래 셋이다.

```text
src/features/home/components/home-screen.tsx
src/features/onboarding/components/onboarding-screen.tsx
src/features/mypage/components/mypage-screen.tsx
```

이 세 파일은 모두 `@/shared/components/ui/card`로 옮긴다. `hoverable` prop은 공용 `Card`에 없으므로, hover 효과가 진짜 필요한 곳만 화면 class로 다시 둔다.

Card wrapper에서 먼저 지우는 클래스는 아래다.

```text
bg-white
border-zinc-200
border-zinc-200/80
shadow-sm
shadow-md
rounded-xl
rounded-2xl
text-zinc-*
```

남길 수 있는 것은 구조용 accent다.

```text
border-t-4
overflow-hidden
grid / flex layout
```

Card 내부 padding도 wrapper `p-*`보다 `CardHeader`, `CardContent`, `CardFooter` 조합으로 처리한다.

## `@/shared/components/ui/badge`

로컬 `Badge`는 이미 작은 pill을 위한 기본 모양을 가진다.

```ts
Badge -> "h-5 rounded-full px-2 py-0.5 text-[0.625rem] font-medium"
```

`text-[10px] rounded-full px-2 py-0.5` 조합은 대부분 `Badge`로 바꿀 수 있다.

```text
home-screen article category
app-shell Minimal pill
report-screen 종합 상권 보고서
mypage-screen Enterprise Station
onboarding-screen 결과 pill
```

variant는 아래 기준으로 먼저 고른다.

```text
default     -> 선택/강조 상태
secondary   -> 중립 보조 상태
outline     -> 경계만 필요한 상태
destructive -> 삭제/위험 상태
```

`bg-blue-50 text-blue-700` 같은 임의 accent pill을 계속 늘리지 않는다.

## `@/shared/components/ui/input`

로컬 `Input`은 높이, radius, border, focus ring을 이미 가진다.

```ts
Input -> "h-7 rounded-md border-input bg-input/20 px-2 text-sm ... focus-visible:ring-2"
```

직접 `<input>`를 유지해도 되는 경우는 타입이 `range`, `number`, `checkbox`처럼 공용 primitive가 아직 맞춤 replacement를 주지 못할 때뿐이다.

일반 텍스트 입력에서는 아래를 빼는 쪽이 먼저다.

```text
rounded-lg
border-zinc-200
bg-white
focus:border-blue-600
text-zinc-800
```

## `@/shared/components/ui/select`

로컬 `SelectTrigger`와 `NativeSelect`도 같은 토큰 축을 쓴다.

```ts
SelectTrigger -> "rounded-md border-input bg-input/20 text-xs/relaxed data-[size=default]:h-7"
NativeSelect  -> "h-7 rounded-md border-input bg-input/20 text-xs/relaxed"
```

`select`를 계속 써야 하면 `NativeSelect`를 먼저 보고, overlay가 필요한 경우 `Select`를 쓴다.

화면에서 빼는 쪽은 아래다.

```text
rounded-lg
border-zinc-200
bg-white
focus:border-blue-600
text-zinc-800
```

## `@/shared/components/ui/checkbox`

로컬 `Checkbox`는 `size-4`, `border-input`, `data-checked:bg-primary`를 이미 준다.

```ts
Checkbox -> "size-4 rounded-[4px] border-input ... data-checked:bg-primary"
```

직접 `<input type="checkbox">`와 `text-blue-600 focus:ring-blue-500` 조합은 먼저 교체한다.

## `@/shared/components/ui/progress`

로컬 `Progress`는 이미 `bg-muted -> bg-primary` 진행바를 준다.

```ts
Progress  -> "h-1 rounded-md bg-muted"
Indicator -> "bg-primary"
```

`onboarding-screen.tsx`의 수동 진행바는 이 컴포넌트로 옮긴다. `bg-zinc-200`와 `bg-blue-600`을 직접 유지할 이유가 없다.

## `@/shared/components/ui/slider`

로컬 `Slider`가 이미 있다.

```ts
Track -> "h-1 bg-muted"
Range -> "bg-primary"
Thumb -> "size-3 border-ring bg-white"
```

`mypage-screen.tsx`의 `input[type="range"]`는 `accent-blue-600` 대신 `Slider`로 옮기는 쪽이 우선이다.

## `@/shared/components/ui/tabs`

로컬 `TabsList`와 `TabsTrigger`도 색상, radius, active state를 이미 가진다.

```ts
TabsList    -> "rounded-lg bg-muted"
TabsTrigger -> "rounded-md ... data-active:bg-background data-active:text-foreground"
```

직접 버튼 배열로 탭을 만든 뒤 `border-b-2 border-blue-600 text-blue-600`을 수동으로 얹은 부분은 먼저 정리한다.

## `@/shared/components/ui/table`

로컬 `Table`은 기본 텍스트 크기, 행 border, hover 상태를 이미 준다.

```ts
TableHead -> "h-10 px-2 font-medium text-foreground"
TableRow  -> "border-b transition-colors hover:bg-muted/50"
TableCell -> "p-2 align-middle"
```

`report-screen.tsx`의 수동 `<table>`은 `Table`, `TableHeader`, `TableHead`, `TableBody`, `TableRow`, `TableCell`로 옮긴다. `thead bg-zinc-50`, `tbody divide-zinc-200`, `hover:bg-zinc-50/40`는 직접 남기지 않는다.

## `@/shared/components/ui/chart`

로컬 `chart.tsx`는 축, grid, tooltip, legend 색상을 토큰 기반으로 맞춘다.

```ts
ChartContainer -> "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground ..."
ChartTooltipContent -> "border border-border/50 bg-background text-xs/relaxed"
```

`report-screen.tsx`와 `district-map-screen.tsx`에서 Recharts block이 커질수록 `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegendContent`를 먼저 쓴다.

색상은 `ChartConfig`나 CSS 변수로 맞춘다.

```ts
const chartConfig = {
  sales: {
    label: "매출",
    color: "var(--chart-1)",
  },
  traffic: {
    label: "유동인구",
    color: "var(--chart-2)",
  },
}
```

## 색상 치환

직접 색상은 staged 화면에 아직 많이 남아 있다.

```text
blue-: 109
zinc-: 319
emerald-: 8
red-: 8
bg-white: 27
text-white: 6
```

hex도 71개 남아 있다. 대부분 `district-map-screen.tsx`와 `report-screen.tsx`에 몰려 있다.

먼저 바꾸는 매핑은 아래다.

```text
bg-white -> bg-background | bg-card
text-zinc-900 -> text-foreground
text-zinc-500 -> text-muted-foreground
border-zinc-200 -> border-border
bg-blue-600 text-white -> bg-primary text-primary-foreground
bg-zinc-100 text-zinc-900 -> bg-secondary text-secondary-foreground
text-emerald-600 -> text-primary | text-foreground
bg-red-50 text-red-600 -> destructive variant | text-destructive
```

의미 상태는 색상 이름보다 토큰 이름으로 남긴다.

```text
success-like text -> text-primary
danger-like text  -> text-destructive
inactive surface  -> bg-muted
floating panel    -> bg-card | bg-popover
```

지도 polygon과 차트 tick도 가능하면 토큰으로 올린다.

```ts
const MAP_COLORS = {
  activeFill: "var(--primary)",
  activeLabel: "var(--primary-foreground)",
  idleFill: "var(--muted)",
  idleLabel: "var(--foreground)",
  border: "var(--border)",
}
```

## 텍스트

현재 staged 화면에는 `text-[9|10|11px]`가 47개, `font-extrabold|tracking-wide|tracking-wider|uppercase|font-mono`가 66개 남아 있다.

shadcn typography 문서는 글로벌 타이포그래피를 강제하지 않는다. 대신 예시에서는 `h1`만 `font-extrabold tracking-tight`를 쓰고, `h2`, `h3`, `h4`는 `font-semibold`를 쓴다. 이번 리팩터링도 같은 축으로 맞춘다.

남겨도 되는 텍스트 강조는 아래다.

```text
home-screen hero h1
report-screen printable title h1
mypage-screen page title h1
```

빼는 쪽은 아래다.

```text
card title의 font-extrabold
pill label의 uppercase
일반 보조문구의 tracking-wide
KPI 라벨용 font-mono
text-[10px] 남발
```

기본 치환은 아래다.

```text
text-[10px] -> text-xs
text-[11px] -> text-xs | text-sm
font-extrabold -> font-semibold | font-medium
text-zinc-500 -> text-muted-foreground
```

`font-mono`는 아래처럼 식별자와 수치에만 남긴다.

```text
report number
date code
table numeric column
map SVG label
```

## radius, shadow, spacing

`rounded-*`, `shadow-*`, `border-*`를 전부 없애는 작업이 아니다. 공용 primitive와 역할이 겹치는 것부터 뺀다.

먼저 지우는 쪽은 아래다.

```text
Card wrapper의 rounded-xl / rounded-2xl
Button의 rounded-lg
generic panel의 shadow-sm / shadow-md / shadow-lg
generic panel의 border-zinc-200/80
```

남길 수 있는 것은 아래다.

```text
border-t-4 accent
badge/status dot의 rounded-full
map pin / legend swatch의 rounded-full
printable-sheet의 section divider
```

그림자는 실제로 떠 있는 레이어일 때만 남긴다.

```text
popover
dialog
sheet
map 위에 겹치는 floating legend
```

Card 내부 여백도 공용 슬롯이 먼저다. `p-6`, `p-8`, `pt-0`, `pb-8`은 hero나 print sheet처럼 레이아웃 사유가 분명할 때만 남긴다. `p-4.5`, `h-4.5` 같은 half step은 SVG, 인쇄 정렬, 아이콘 optical alignment가 아니면 줄인다.

## `src/shared/components/layout/app-shell.tsx`

경로 구조와 sticky header는 유지한다. 바꾸는 것은 shell 색상과 장식이다.

```text
bg-zinc-50 -> bg-background | bg-muted/30
bg-white/95 -> bg-background
border-zinc-200/80 -> border-border
Minimal pill -> Badge
active nav bg-blue-50 text-blue-600 -> secondary or token 기반 active state
```

`backdrop-blur-md`는 header가 실제로 content 위에 겹쳐야 할 때만 남긴다.

## `src/features/home/components/home-screen.tsx`

이 파일은 `startup/ui` 사본 제거와 `Badge` 치환이 먼저다.

```text
Button/Card import 교체
hero badge -> Badge
article category pill -> Badge
feature highlight panel -> Card or bg-card token
icon wrapper bg-blue-50 -> bg-muted | bg-primary/10
```

hero `h1`의 `font-extrabold tracking-tight`는 유지 후보다. 카드 내부 `font-bold`, `text-zinc-*`, `rounded-xl`은 줄인다.

## `src/features/onboarding/components/onboarding-screen.tsx`

이 파일은 진행바와 결과 카드가 핵심이다.

```text
manual progress bar -> Progress
result header bg-blue-600 text-white -> bg-primary text-primary-foreground
option card border-zinc-* hover:border-blue-* -> Card/Button/Tabs 축으로 재구성
recommendation chip -> Badge or simple list row
```

결과 헤더와 page-level title은 강한 강조를 둘 수 있다. 본문 카드 안의 `uppercase`, `tracking-wide`, `text-[9px]`는 줄인다.

## `src/features/report/components/report-screen.tsx`

이 파일은 table과 chart부터 정리한다.

```text
manual table -> Table
COLORS hex -> var(--chart-1), var(--chart-2)
Bar/Pie tooltip -> ChartTooltipContent
printable-sheet bg-white border-zinc-* shadow-md -> bg-card border-border ring 축으로 정리
```

인쇄용 시트라서 `border-b-2`, 넉넉한 padding, 식별 번호용 `font-mono`는 유지 가능하다. KPI 카드와 section label의 `uppercase`, `text-[10px]`, `font-bold` 남발은 줄인다.

## `src/features/mypage/components/mypage-screen.tsx`

이 파일은 form control과 반복 카드가 많다.

```text
Button/Card import 교체
checklist checkbox -> Checkbox
select -> Select | NativeSelect
range input -> Slider
status pill -> Badge
profile header bg-blue-600 text-white -> bg-primary text-primary-foreground
```

보고서 카드, 체크리스트 카드, 프로필 카드에 반복되는 `border-zinc-*`, `shadow-sm`, `bg-zinc-50/50`, `text-[10px]`, `font-mono`, `font-extrabold`를 먼저 줄인다.

## `src/features/district-map/components/district-map-screen.tsx`

이 파일이 가장 많이 덮어쓴다. hex와 직접 색상도 여기 가장 많다.

```text
left filter panel
center map canvas
right consultant panel
bottom detail panel
legend
SVG polygon fill/stroke
Recharts axis / series / tooltip
```

여기서는 레이아웃을 먼저 건드리지 않는다. 내부 control부터 옮긴다.

```text
1. Button import 교체
2. input/select/checkbox -> shared primitive 교체
3. tab 버튼 -> Tabs
4. floating panel wrapper -> bg-card / border-border / ring 기준으로 치환
5. legend, SVG, chart 색상 -> var(--chart-*), var(--primary), var(--border)
```

`text-[9px]`, `font-mono`, `tracking-wide`, `uppercase`는 SVG label과 legend처럼 진짜 지도 정보에만 남긴다.

## 교체 순서

```text
1. src/features/startup/components/ui/button.tsx import 제거
2. src/features/startup/components/ui/card.tsx import 제거
3. src/shared/components/layout/app-shell.tsx shell 토큰 치환
4. src/features/home/components/home-screen.tsx Button/Card/Badge 정리
5. src/features/onboarding/components/onboarding-screen.tsx Progress/Card 토큰 치환
6. src/features/report/components/report-screen.tsx Table/Chart 토큰 치환
7. src/features/mypage/components/mypage-screen.tsx form/card/token 치환
8. src/features/district-map/components/district-map-screen.tsx 내부 control부터 교체
9. 모든 import 제거 후 src/features/startup/components/ui/button.tsx 삭제
10. 모든 import 제거 후 src/features/startup/components/ui/card.tsx 삭제
```

## 주요 파일

- `components.json`
- `src/app/globals.css`
- `src/shared/components/layout/app-shell.tsx`
- `src/shared/components/ui/badge.tsx`
- `src/shared/components/ui/button.tsx`
- `src/shared/components/ui/card.tsx`
- `src/shared/components/ui/chart.tsx`
- `src/shared/components/ui/checkbox.tsx`
- `src/shared/components/ui/input.tsx`
- `src/shared/components/ui/native-select.tsx`
- `src/shared/components/ui/progress.tsx`
- `src/shared/components/ui/select.tsx`
- `src/shared/components/ui/slider.tsx`
- `src/shared/components/ui/table.tsx`
- `src/shared/components/ui/tabs.tsx`
- `src/features/startup/components/ui/button.tsx`
- `src/features/startup/components/ui/card.tsx`
- `src/features/home/components/home-screen.tsx`
- `src/features/onboarding/components/onboarding-screen.tsx`
- `src/features/report/components/report-screen.tsx`
- `src/features/mypage/components/mypage-screen.tsx`
- `src/features/district-map/components/district-map-screen.tsx`

## 참고 문서

- https://ui.shadcn.com/docs/components-json
- https://ui.shadcn.com/docs/theming
- https://ui.shadcn.com/docs/tailwind-v4
- https://ui.shadcn.com/docs/components/radix/chart
- https://ui.shadcn.com/docs/components/radix/typography
