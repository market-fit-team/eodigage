// src/app/agent/design1/_components/ChatWelcome.tsx
"use client"

import * as React from "react"
import { Sparkles, Layout, Code2, Cpu } from "lucide-react"

interface ChatWelcomeProps {
  onSelectPrompt: (promptText: string) => void
}

// 웰컴 화면 및 추천 질문 컴포넌트
export function ChatWelcome({ onSelectPrompt }: ChatWelcomeProps) {
  const promptSuggestions = [
    {
      icon: <Layout className="size-4 text-muted-foreground/80" />,
      title: "미니멀리즘 디자인",
      desc: "본질에 집중하는 UI 가이드 및 원칙 설명하기",
      prompt: "미니멀리즘 디자인의 핵심이 뭐야?",
    },
    {
      icon: <Code2 className="size-4 text-muted-foreground/80" />,
      title: "Next.js 16 특징",
      desc: "Turbopack 및 React 19 호환성에 대해 묻기",
      prompt: "Next.js 16.2.6 버전 특징이 있나?",
    },
    {
      icon: <Cpu className="size-4 text-muted-foreground/80" />,
      title: "AI 에이전트 UI",
      desc: "최신 Canvas, Composer 등 인터페이스 사례 알아보기",
      prompt: "최근 AI 에이전트는 어떤 UI를 주로 써?",
    },
    {
      icon: <Sparkles className="size-4 text-muted-foreground/80" />,
      title: "UI 컴포넌트 활용 팁",
      desc: "shared/components/ui를 재활용하는 세련된 방법",
      prompt: "이 프로젝트의 UI 컴포넌트를 활용해 미니멀하게 코딩하는 팁 알려줘.",
    },
  ]

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
      {/* 로고 영역 */}
      <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-muted/40 border border-border/20">
        <Sparkles className="size-6 text-foreground/70" />
      </div>

      {/* 헤더 타이틀 */}
      <h2 className="text-xl font-semibold tracking-tight text-foreground/90">
        무엇을 도와드릴까요?
      </h2>
      <p className="mt-2 text-xs text-muted-foreground max-w-sm">
        이곳은 작동하는 가상의 미니멀리즘 채팅 에이전트 공간입니다. 아래 추천 제안을 선택해 대화를 시작해 보세요.
      </p>

      {/* 카드 그리드 */}
      <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {promptSuggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex flex-col items-start rounded-xl border border-border/40 bg-muted/5 p-4 text-left transition-all hover:bg-muted/40 hover:border-border/80 focus:outline-none"
          >
            <div className="mb-2 flex size-7 items-center justify-center rounded-lg bg-background border border-border/20">
              {item.icon}
            </div>
            <span className="text-xs font-semibold text-foreground/80">{item.title}</span>
            <span className="mt-1 text-[11px] leading-normal text-muted-foreground/80">{item.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
