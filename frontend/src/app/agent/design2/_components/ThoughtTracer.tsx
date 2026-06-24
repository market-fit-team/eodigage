// src/app/agent/design2/_components/ThoughtTracer.tsx
"use client"

import * as React from "react"
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/shared/lib/utils"
import { ThoughtStep } from "../_fixtures/chatMockData2"

interface ThoughtTracerProps {
  steps: ThoughtStep[]
}

// AI의 생각 과정을 단계별로 시각화해 주는 컴포넌트
export function ThoughtTracer({ steps }: ThoughtTracerProps) {
  const [isOpen, setIsOpen] = React.useState(true)

  const completedCount = steps.filter((s) => s.status === "completed").length
  const totalCount = steps.length
  const isAllCompleted = completedCount === totalCount

  return (
    <div className="w-full rounded-xl border border-primary/10 bg-primary/5 p-3.5 backdrop-blur-sm transition-all duration-300">
      {/* 헤더 영역 */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex cursor-pointer items-center justify-between text-xs select-none"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain className="size-3.5" />
            {!isAllCompleted && (
              <span className="absolute -top-0.5 -right-0.5 flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span>Antigravity AI의 생각 흐름</span>
              <Sparkles className="size-3 animate-pulse text-primary/70" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isAllCompleted
                ? "모든 분석 단계 완료"
                : `분석 진행 중 (${completedCount}/${totalCount} 단계 완료)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
            {completedCount}/{totalCount} Done
          </span>
          {isOpen ? (
            <ChevronUp className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* 단계별 리스트 (AnimatePresence 적용) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3.5 space-y-2 border-t border-primary/10 pt-3">
              {steps.map((step, idx) => {
                const isCompleted = step.status === "completed"
                const isRunning = step.status === "running"

                return (
                  <motion.div
                    initial={{ x: -8, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={step.id}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg p-2 text-[11px] transition-all",
                      isRunning && "border border-primary/10 bg-primary/5",
                      isCompleted && "opacity-85 hover:opacity-100"
                    )}
                  >
                    {/* 상태 아이콘 */}
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="size-3.5 text-primary" />
                      ) : isRunning ? (
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                      ) : (
                        <div className="size-3.5 rounded-full border border-muted-foreground/30 bg-muted/20" />
                      )}
                    </div>

                    {/* 내용 설명 */}
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "font-medium text-foreground/90",
                            isCompleted && "text-muted-foreground line-through"
                          )}
                        >
                          {step.label}
                        </span>
                        {step.duration && (
                          <span className="font-mono text-[9px] text-muted-foreground/60">
                            {step.duration}
                          </span>
                        )}
                      </div>
                      {step.details && (
                        <p className="text-[10px] leading-relaxed font-light text-muted-foreground">
                          {step.details}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
