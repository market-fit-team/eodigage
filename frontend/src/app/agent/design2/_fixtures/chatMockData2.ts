// src/app/agent/design2/_fixtures/chatMockData2.ts

export interface MessageFile {
  name: string;
  size: string;
  type: string;
}

export interface ThoughtStep {
  id: string;
  label: string;
  status: "idle" | "running" | "completed" | "error";
  duration?: string;
  details?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  content: string;
  timestamp: string;
  isLiked?: boolean;
  isDisliked?: boolean;
  file?: MessageFile;
  artifactId?: string; // 이 메시지와 연결된 아티팩트 ID
  thoughtSteps?: ThoughtStep[]; // AI의 생각 과정 단계를 표시하는 필드
}

export interface ChatRoom {
  id: string;
  title: string;
  updatedAt: string;
  lastMessage?: string;
}

export interface SecurityIssue {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  status: "detected" | "resolved" | "safe";
}

export interface ArtifactData {
  id: string;
  title: string;
  version: number;
  language: string;
  originalCode: string;
  modifiedCode: string;
  accepted: boolean | null; // null: 미정, true: 수락, false: 반려
  consoleLogs: string[];
  securityScore: number; // 0 ~ 100
  securityIssues: SecurityIssue[];
}

// 1. 대화방 목록 데이터
export const mockRooms: ChatRoom[] = [
  {
    id: "room-dash",
    title: "성능 대시보드 최적화 및 보안 강화",
    updatedAt: "오전 11:45",
    lastMessage: "대시보드 코드에 모던 UI 스타일을 적용하고 보안 취약점을 해결했습니다. 확인해 보세요.",
  },
  {
    id: "room-landing",
    title: "글래스모피즘 로그인 랜딩 페이지",
    updatedAt: "어제",
    lastMessage: "배경 그라데이션과 블러 효과가 반영된 로그인 컴포넌트입니다.",
  },
];

// 2. 가상 아티팩트 데이터
export const mockArtifacts: Record<string, ArtifactData> = {
  "art-dash": {
    id: "art-dash",
    title: "ModernAnalyticsDashboard.tsx",
    version: 2,
    language: "tsx",
    originalCode: `// 기존 대시보드 컴포넌트 (비효율적인 구조 및 오래된 스타일)
import React, { useState } from 'react';

export default function Dashboard(props) {
  const [data, setData] = useState([10, 20, 15, 30, 25, 45]);
  
  // 취약성 위험: 사용자 입력을 검증 없이 내부 HTML에 직접 렌더링
  const rawHtmlInput = props.customTitle || "통계 리포트";

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h2 dangerouslySetInnerHTML={{ __html: rawHtmlInput }} />
      <div style={{ display: 'flex', gap: '10px' }}>
        {data.map((val, idx) => (
          <div key={idx} style={{ 
            height: \`\${val * 3}px\`, 
            width: '30px', 
            backgroundColor: 'blue' 
          }} />
        ))}
      </div>
      <button onClick={() => setData([...data, Math.floor(Math.random() * 50)])}>
        데이터 추가
      </button>
    </div>
  );
}`,
    modifiedCode: `// 리팩토링된 대시보드 컴포넌트 (Tailwind v4 OKLCH 테마 및 안전한 렌더링 적용)
"use client"

import * as React from "react"
import { TrendingUp, Plus, ShieldAlert, Sparkles } from "lucide-react"

interface DashboardProps {
  customTitle?: string
}

export function ModernAnalyticsDashboard({ customTitle }: DashboardProps) {
  const [data, setData] = React.useState<number[]>([12, 28, 19, 32, 25, 48, 38])
  
  // 안전한 텍스트 렌더링을 적용하여 XSS 취약점 제거
  const safeTitle = customTitle || "엔터프라이즈 모니터링 통계"

  const handleAddData = () => {
    const newValue = Math.floor(Math.random() * 40) + 10
    setData((prev) => [...prev, newValue])
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300">
      {/* 장식용 그라데이션 글로우 */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary animate-pulse" />
            {safeTitle}
          </h3>
          <p className="text-[10px] text-muted-foreground">실시간 트래픽 및 보안 분석 리포트</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-500">
          <TrendingUp className="size-3" />
          <span>+24.8% 상승</span>
        </div>
      </div>

      {/* 실시간 커스텀 차트 */}
      <div className="flex h-36 items-end gap-3.5 px-2 pb-2 pt-4 border-b border-border/40">
        {data.map((value, index) => (
          <div key={index} className="group relative flex flex-1 flex-col items-center">
            {/* 툴팁 */}
            <div className="absolute -top-7 scale-0 rounded bg-foreground px-1.5 py-0.5 text-[9px] text-background transition-all group-hover:scale-100 z-10 font-mono">
              {value}%
            </div>
            
            {/* 데이터 바 */}
            <div 
              style={{ height: \`\${(value / 60) * 100}px\` }} 
              className="w-full rounded-t bg-gradient-to-t from-primary/40 to-primary transition-all duration-500 hover:from-primary hover:to-primary/80" 
            />
            
            {/* 인덱스 */}
            <span className="mt-2 text-[8px] text-muted-foreground font-mono">D-{6 - index}</span>
          </div>
        ))}
      </div>

      {/* 제어 패널 */}
      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <ShieldAlert className="size-3.5 text-emerald-500" />
          보안 취약점 0건 감지 (안전함)
        </span>
        <button
          onClick={handleAddData}
          className="inline-flex items-center gap-1 rounded-lg bg-foreground px-2.5 py-1 text-[10px] font-medium text-background hover:bg-foreground/90 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="size-3" />
          <span>지표 추가</span>
        </button>
      </div>
    </div>
  )
}`,
    accepted: null,
    consoleLogs: [
      "[11:45:01] Starting linter validation...",
      "[11:45:02] Analyzing component for React 19 compilation criteria...",
      "[11:45:03] Linter check passed successfully with 0 warnings.",
      "[11:45:04] Security audit triggered.",
      "[11:45:05] Audit finished: DOMPurify and native escaping validated.",
      "[11:45:05] TypeScript typecheck: Successful compilation.",
    ],
    securityScore: 98,
    securityIssues: [
      {
        id: "sec-1",
        severity: "high",
        title: "위험한 HTML 삽입 차단",
        description: "기존의 dangerouslySetInnerHTML 구조가 사용자의 customTitle 값을 여과 없이 렌더링하고 있었습니다. 이를 일반 React text binding으로 수정하여 DOM 기반 XSS 위협을 제거했습니다.",
        status: "resolved",
      },
    ],
  },
  "art-landing": {
    id: "art-landing",
    title: "GlassmorphismLogin.tsx",
    version: 1,
    language: "tsx",
    originalCode: `// 기존 로그인 폼 (기본 HTML 테두리와 어두운 레이아웃)
export default function LoginForm() {
  return (
    <form style={{ background: '#333', color: '#fff', padding: '30px' }}>
      <label>이메일</label>
      <input type="email" />
      <button>로그인</button>
    </form>
  );
}`,
    modifiedCode: `// 글래스모피즘이 적용된 고급 로그인 폼 컴포넌트
"use client"

import * as React from "react"
import { Lock, Mail, ArrowRight } from "lucide-react"

export function GlassmorphismLogin() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(\`로그인 시도: \${email}\`)
  }

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 shadow-2xl">
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold tracking-tight text-white">Antigravity AI Portal</h2>
        <p className="text-[10px] text-white/50">가상 개발 에이전트 시스템 로그인</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이메일 입력 */}
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/35 outline-none focus:border-white/20 focus:bg-white/10 transition-all font-light"
          />
        </div>

        {/* 비밀번호 입력 */}
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/35 outline-none focus:border-white/20 focus:bg-white/10 transition-all font-light"
          />
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          className="group relative flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-neutral-900 transition-all hover:bg-neutral-100 active:scale-[0.98] cursor-pointer"
        >
          <span>로그인</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>
    </div>
  )
}`,
    accepted: null,
    consoleLogs: [
      "[10:12:00] Building login components...",
      "[10:12:02] Security Check: Input sanitisers verified.",
      "[10:12:02] Compilation successful.",
    ],
    securityScore: 100,
    securityIssues: [],
  },
};

// 3. 생각 흐름 데이터 (Thought Steps)
export const initialThoughtSteps: ThoughtStep[] = [
  {
    id: "step-1",
    label: "기존 컴포넌트 코드 구문 분석 (AST)",
    status: "completed",
    duration: "0.2초",
    details: "dangerouslySetInnerHTML를 사용하는 지점을 포함하여 컴포넌트 구조의 스타일 상태 및 데이터 수명주기를 검사함.",
  },
  {
    id: "step-2",
    label: "보안 취약점 및 린트 감사",
    status: "completed",
    duration: "0.5초",
    details: "DOM XSS 취약점 감지됨: props.customTitle이 안전 검증 없이 렌더링됨. React 표준 바인딩이나 DOMPurify 필수 사용 대상.",
  },
  {
    id: "step-3",
    label: "Tailwind CSS v4 디자인 시스템 맵핑",
    status: "completed",
    duration: "0.3초",
    details: "디렉토리의 globals.css의 CSS 변수, 테마 설정값을 바탕으로 oklch 색상 및 글래스모피즘(Card, border, ring) 클래스를 선별.",
  },
  {
    id: "step-4",
    label: "리팩토링 코드 대안 설계 및 비교 검증",
    status: "completed",
    duration: "0.4초",
    details: "기존 JSX 코드를 TSX로 변환하며 React 19 호환 훅 스타일 적용, 데이터 추가 함수 내의 무작위 생성 한계 보완.",
  },
  {
    id: "step-5",
    label: "정적 타입 컴파일 및 린트 최종 검사",
    status: "completed",
    duration: "0.3초",
    details: "TypeScript 컴파일러 진단 완료. 경고 0건, 에러 0건.",
  },
];

// 4. 대화 내역 데이터
export const mockMessages: Record<string, ChatMessage[]> = {
  "room-dash": [
    {
      id: "msg-d-1",
      sender: "user",
      content: "이전 개발자분이 짜둔 대시보드 파일이 있는데, 스타일도 투박하고 보안 위험도 있어 보여. 리팩토링해서 안전하고 현대적인 UI로 변경해줘.",
      timestamp: "오전 11:41",
    },
    {
      id: "msg-d-2",
      sender: "bot",
      content: "요청하신 대시보드 컴포넌트 코드의 분석을 완료했습니다. \n\n기존 코드에서 XSS 취약점(사용자 제목 파라미터 무단 출력)을 감지하였고, 인라인 스타일로 구현된 레거시 차트 영역을 세련된 Tailwind CSS v4 기반의 글래스모피즘 대시보드로 다시 설계했습니다. \n\n우측 아티팩트 창에 반영된 소스코드를 확인해 보세요. 변경된 내용이 마음에 드시면 **'수락(Accept)'** 버튼을 눌러 프로젝트에 반영하실 수 있습니다.",
      timestamp: "오전 11:45",
      artifactId: "art-dash",
      thoughtSteps: initialThoughtSteps,
    },
  ],
  "room-landing": [
    {
      id: "msg-l-1",
      sender: "user",
      content: "글래스모피즘을 입힌 로그인 화면을 만들어줘. 배경이 어두울 때 뒤의 그라데이션이 비쳐 보이게 하고 싶어.",
      timestamp: "어제 오후 5:30",
    },
    {
      id: "msg-l-2",
      sender: "bot",
      content: "어두운 배경이나 그라데이션 레이어 위에 배치했을 때 아름답게 조화되는 **Glassmorphism 로그인 폼** 아티팩트를 제작했습니다.\n\n적용된 기술:\n- `backdrop-blur-md` 와 `bg-white/5` 조합\n- 얇은 화이트 보더라인 테두리로 프리미엄 느낌 강조\n- Lucide 아이콘 적용 및 미세한 스케일 모션\n\n우측 **Preview 탭**에서 로그인 폼을 즉시 조작해 보실 수 있습니다.",
      timestamp: "어제 오후 5:32",
      artifactId: "art-landing",
      thoughtSteps: [
        { id: "sl-1", label: "글래스모피즘 핵심 속성 설정", status: "completed", duration: "0.1초" },
        { id: "sl-2", label: "아이콘 인라인 배치 구조 검증", status: "completed", duration: "0.2초" },
      ],
    },
  ],
};

// 프롬프트 가이드 목록
export const promptSuggestions = [
  "대시보드의 차트 색상을 바이올렛 톤으로 변경해줘",
  "로그인 컴포넌트에 '비밀번호 찾기' 링크 추가해줘",
  "생성한 코드의 보안 린트를 정밀 검사해줘",
  "반응형 모바일 레이아웃에 최적화되게 다듬어줘",
];

// 가상 봇 응답 생성기 헬퍼 (사용자가 무언가 물어봤을 때 가상의 답변 제공)
export const getBotResponse = (prompt: string): { content: string; steps: ThoughtStep[] } => {
  const steps: ThoughtStep[] = [
    { id: "gs-1", label: "컨텍스트 분석", status: "completed", duration: "0.1s" },
    { id: "gs-2", label: "대안 설계 생성", status: "completed", duration: "0.3s" },
    { id: "gs-3", label: "코드 안정성 검증", status: "completed", duration: "0.2s" },
  ];

  if (prompt.includes("보안") || prompt.includes("취약점")) {
    return {
      content: "생성된 코드의 입력 유효성 및 보안 필터 레이어를 다시 스캔했습니다. DOM XSS가 해결된 상태이며, 안전한 React Text Node 바인딩 처리가 완벽히 적용되었습니다.",
      steps,
    };
  }
  
  if (prompt.includes("차트") || prompt.includes("색상")) {
    return {
      content: "차트의 색상 팔레트를 바이올렛 톤(OKLCH 기준 어울리는 보라색 스펙트럼)으로 미세 조정했습니다. 아티팩트의 코드가 업데이트되었으니 확인해 보세요.",
      steps,
    };
  }

  return {
    content: "전달해주신 피드백을 기반으로 컴포넌트를 리팩토링했습니다. 코드의 유연성과 안정성을 동시에 확보하도록 개선되었으며, 가상 컴포넌트 프리뷰 탭에서 바로 실행 확인이 가능합니다.",
    steps,
  };
};
