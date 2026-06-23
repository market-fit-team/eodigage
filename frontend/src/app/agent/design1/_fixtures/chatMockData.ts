// src/app/agent/design1/_fixtures/chatMockData.ts

export interface MessageFile {
  name: string
  size: string
  type: string
}

export interface ChatMessage {
  id: string
  sender: "user" | "bot"
  content: string
  timestamp: string
  isLiked?: boolean
  isDisliked?: boolean
  file?: MessageFile
}

export interface ChatRoom {
  id: string
  title: string
  updatedAt: string
  lastMessage?: string
}

// 초기 가상 대화방 목록 데이터
export const initialRooms: ChatRoom[] = [
  {
    id: "room-1",
    title: "미니멀리즘 디자인 가이드",
    updatedAt: "오전 10:30",
    lastMessage: "여백을 활용하는 미니멀리즘 디자인의 핵심은 본질에 집중하는 것입니다.",
  },
  {
    id: "room-2",
    title: "Next.js 16 개발 관련 질문",
    updatedAt: "어제",
    lastMessage: "Next.js 16.2.6 버전의 변경사항에 대해 더 궁금한 점이 있으신가요?",
  },
  {
    id: "room-3",
    title: "AI 에이전트 인터페이스",
    updatedAt: "6월 21일",
    lastMessage: "채팅 컴포저와 아티팩트 기능이 최근 UI의 대표적 사례입니다.",
  },
]

// 초기 대화방별 대화 내역 데이터
export const initialMessages: Record<string, ChatMessage[]> = {
  "room-1": [
    {
      id: "msg-1-1",
      sender: "user",
      content: "미니멀리즘 디자인의 핵심이 뭐야?",
      timestamp: "오전 10:28",
    },
    {
      id: "msg-1-2",
      sender: "bot",
      content: "미니멀리즘 디자인은 불필요한 장식과 요소를 덜어내고, 콘텐츠의 본질과 기능에 사용자가 집중할 수 있도록 돕는 디자인 철학입니다.\n\n핵심 요소는 다음과 같습니다:\n1. **넓은 여백 (Negative Space):** 시각적 피로를 줄이고 가독성을 극대화합니다.\n2. **제한된 컬러 팔레트:** 무채색 또는 단색 위주의 톤을 사용하여 차분하고 고급스러운 무드를 형성합니다.\n3. **강력한 타이포그래피:** 폰트의 크기와 굵기 대비만으로 정보의 우선순위를 명확히 전달합니다.\n4. **시각적 일관성:** 불필요한 보더라인을 줄이고, 그림자와 패딩만으로 레이어를 분리합니다.",
      timestamp: "오전 10:30",
    },
  ],
  "room-2": [
    {
      id: "msg-2-1",
      sender: "user",
      content: "Next.js 16.2.6 버전 특징이 있나?",
      timestamp: "어제 오전 11:15",
    },
    {
      id: "msg-2-2",
      sender: "bot",
      content: "Next.js 16 버전은 Turbopack의 기본화, React 19 Server Actions의 개선, 그리고 더욱 유연해진 라우트 제어 방식을 특징으로 합니다. 특히 빌드 성능과 핫 모듈 리플레이스먼트(HMR) 속도가 비약적으로 상승했습니다.",
      timestamp: "어제 오전 11:16",
    },
  ],
  "room-3": [
    {
      id: "msg-3-1",
      sender: "user",
      content: "최근 AI 에이전트는 어떤 UI를 주로 써?",
      timestamp: "6월 21일 오후 2:40",
    },
    {
      id: "msg-3-2",
      sender: "bot",
      content: "최근 AI 에이전트는 단순 대화창을 넘어 다음과 같은 특화 UI를 사용합니다:\n\n- **Canvas/Artifacts:** 대화창 옆에 분리된 편집기 및 프리뷰 영역을 두고, 코드나 문서를 실시간 렌더링하고 편집합니다.\n- **Composer (컴포저):** 여러 개의 코드 파일을 한 번에 열어 AI가 구조를 파악하고 자동 수정을 제안하는 전용 멀티에디터 창입니다.\n- **Agent & YOLO Mode:** 터미널 명령어나 패키지 설치 등을 AI가 자율적으로 실행하고 바로 결과를 피드백하는 터미널 통합 제어판을 씁니다.",
      timestamp: "6월 21일 오후 2:42",
    },
  ],
}

// 봇이 임의로 답할 수 있는 응답 템플릿 풀
const botResponses = [
  "좋은 질문입니다! 미니멀리즘 디자인 철학에 따르면 '적을수록 더 많은 것(Less is More)'을 표현할 수 있습니다. UI 요소의 간격을 대담하게 넓히는 것만으로도 화면의 고급스러움이 살아납니다.",
  "제공해주신 컨텍스트를 바탕으로 생각해 보면, Next.js와 Tailwind CSS 조합은 미니멀 UI를 신속하게 구현하기에 최적입니다. 불필요한 보더 대신 투명도(`opacity`)와 배경색 조합을 이용해 정보를 유려하게 구분해 보세요.",
  "흥미로운 주제네요. AI 에이전트의 발전으로 이제 사용자는 코드를 직접 치지 않고 설계 의도와 방향만 수정하는 협업 인터페이스로 전환되고 있습니다. 바로 지금 사용하고 계신 이 채팅 화면처럼요!",
  "해당 내용을 파일로 정리해 드릴까요? 미니멀한 UI 디자인 가이드를 텍스트로 보거나 가벼운 마크다운 양식으로 다운로드할 수도 있습니다.",
  "채팅의 UX를 높이기 위해서는 사용자가 입력 중인지, 챗봇이 생각 중인지가 명확히 인지되어야 합니다. 그래서 미세한 애니메이션(Spinner나 Pulse)을 적재적소에 사용하는 것이 필수적입니다.",
]

// 가상 AI 봇의 답변을 임의로 반환하는 헬퍼 함수
export const getRandomBotResponse = (): string => {
  const index = Math.floor(Math.random() * botResponses.length)
  return botResponses[index]
}
