"use client"

import { Brain, FileCode2, Sparkles, TerminalSquare } from "lucide-react"

const promptSuggestions = [
  {
    icon: <FileCode2 className="size-3.5" />,
    label: "문서 분석",
    description: "라이브러리 문서를 바탕으로 핵심 내용을 정리",
  },
  {
    icon: <Brain className="size-3.5" />,
    label: "전략 검토",
    description: "현재 대화 맥락에서 다음 실행안을 제안",
  },
  {
    icon: <TerminalSquare className="size-3.5" />,
    label: "도구 실행",
    description: "필요한 도구를 검토하고 승인 흐름으로 진행",
  },
  {
    icon: <Sparkles className="size-3.5" />,
    label: "리포트 작성",
    description: "아티팩트로 남길 수 있는 보고서 초안을 생성",
  },
]

type ChatWelcomeScreenProps = {
  onSelectSuggestion: (text: string) => void
}

export function ChatWelcomeScreen({
  onSelectSuggestion,
}: ChatWelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-foreground/5 blur-xl" />
          <div className="relative flex size-14 items-center justify-center rounded-2xl border border-border/30 bg-background shadow-sm">
            <Sparkles className="size-6 text-foreground" />
          </div>
        </div>
      </div>
      <h2 className="text-sm font-semibold tracking-tight text-foreground">
        무엇을 도와드릴까요?
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        라이브러리와 대화 맥락을 바탕으로 작업을 도와드립니다
      </p>
      <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-2">
        {promptSuggestions.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelectSuggestion(item.description)}
            className="group flex cursor-pointer flex-col items-start gap-1.5 rounded-xl border border-border/20 bg-background p-3.5 text-left transition-all hover:border-border/40 hover:bg-muted/20"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground transition-colors group-hover:bg-muted/60 group-hover:text-foreground">
              {item.icon}
            </span>
            <span className="text-xs font-medium text-foreground">
              {item.label}
            </span>
            <span className="text-xs leading-snug text-muted-foreground">
              {item.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
