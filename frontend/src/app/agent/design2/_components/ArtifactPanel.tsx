// src/app/agent/design2/_components/ArtifactPanel.tsx
"use client"

import * as React from "react"
import {
  Check,
  ChevronRight,
  Code2,
  Eye,
  FileText,
  Info,
  Play,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  X,
} from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs"
import { cn } from "@/shared/lib/utils"
import { ArtifactData } from "../_fixtures/chatMockData2"

// ----------------------------------------------------
// 가상 프리뷰 컴포넌트 1: ModernAnalyticsDashboard
// ----------------------------------------------------
interface DashboardProps {
  customTitle?: string
}

function ModernAnalyticsDashboard({ customTitle }: DashboardProps) {
  const [data, setData] = React.useState<number[]>([12, 28, 19, 32, 25, 48, 38])
  const safeTitle = customTitle || "엔터프라이즈 모니터링 통계"

  const handleAddData = () => {
    const newValue = Math.floor(Math.random() * 40) + 10
    setData((prev) => [...prev, newValue])
  }

  return (
    <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card/60 p-6 shadow-xl backdrop-blur-xl transition-all duration-300">
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
            <Sparkles className="size-4 animate-pulse text-primary" />
            {safeTitle}
          </h3>
          <p className="text-[10px] text-muted-foreground">
            실시간 트래픽 및 보안 분석 리포트
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-500">
          <TrendingUp className="size-3" />
          <span>+24.8% 상승</span>
        </div>
      </div>

      <div className="flex h-36 items-end gap-3.5 border-b border-border/40 px-2 pt-4 pb-2">
        {data.map((value, index) => (
          <div
            key={index}
            className="group relative flex flex-1 flex-col items-center"
          >
            <div className="absolute -top-7 z-10 scale-0 rounded bg-foreground px-1.5 py-0.5 font-mono text-[9px] text-background transition-all group-hover:scale-100">
              {value}%
            </div>

            <div
              style={{ height: `${(value / 60) * 100}%` }}
              className="w-full rounded-t bg-gradient-to-t from-primary/40 to-primary transition-all duration-500 hover:from-primary hover:to-primary/80"
            />
            <span className="mt-2 font-mono text-[8px] text-muted-foreground">
              D-{6 - index}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          보안 취약점 0건 감지 (안전함)
        </span>
        <button
          onClick={handleAddData}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-foreground px-2.5 py-1 text-[10px] font-medium text-background shadow-sm transition-all hover:bg-foreground/90 active:scale-95"
        >
          <Plus className="size-3" />
          <span>지표 추가</span>
        </button>
      </div>
    </div>
  )
}

// ----------------------------------------------------
// 가상 프리뷰 컴포넌트 2: GlassmorphismLogin
// ----------------------------------------------------
function GlassmorphismLogin() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`로그인 시도: ${email}`)
  }

  return (
    <div className="relative mx-auto my-4 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-neutral-900/90 p-8 shadow-2xl">
      {/* 배경 장식 발광 효과 */}
      <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />
      <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-2xl" />

      <div className="relative z-10 mb-6 text-center">
        <h2 className="text-sm font-semibold tracking-tight text-white">
          Antigravity AI Portal
        </h2>
        <p className="text-[9px] text-white/50">
          가상 개발 에이전트 시스템 로그인
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-4 pl-4 text-xs font-light text-white transition-all outline-none placeholder:text-white/30 focus:border-white/20 focus:bg-white/10"
          />
        </div>

        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-4 pl-4 text-xs font-light text-white transition-all outline-none placeholder:text-white/30 focus:border-white/20 focus:bg-white/10"
          />
        </div>

        <button
          type="submit"
          className="group relative flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl bg-white py-2 text-xs font-semibold text-neutral-900 transition-all hover:bg-neutral-100 active:scale-[0.98]"
        >
          <span>로그인</span>
          <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>
    </div>
  )
}

// ----------------------------------------------------
// 메인 Artifact 패널
// ----------------------------------------------------
interface ArtifactPanelProps {
  data: ArtifactData | null
  onAccept: () => void
  onReject: () => void
  onActionClick: (action: string) => void
}

export function ArtifactPanel({
  data,
  onAccept,
  onReject,
  onActionClick,
}: ArtifactPanelProps) {
  const [activeTab, setActiveTab] = React.useState("code")
  const [diffMode, setDiffMode] = React.useState<"split" | "unified">("unified")

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center border-l border-border/40 bg-muted/10 p-6 text-center">
        <div className="mb-4 rounded-2xl bg-muted/20 p-4">
          <FileText className="size-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-sm font-semibold text-foreground/80">
          선택된 아티팩트 없음
        </h3>
        <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">
          대화창 내의 아티팩트 링크를 클릭하거나 AI에게 새로운 코드를 요청해
          보세요.
        </p>
      </div>
    )
  }

  // 간단한 Unified Diff 행 생성 로직
  const originalLines = data.originalCode.split("\n")
  const modifiedLines = data.modifiedCode.split("\n")

  return (
    <div className="flex h-full flex-col border-l border-border/40 bg-background">
      {/* 아티팩트 헤더 */}
      <header className="flex items-center justify-between border-b border-border/30 bg-muted/5 px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Code2 className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground/90">
                {data.title}
              </span>
              <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                v{data.version}
              </Badge>
            </div>
            <p className="text-[9px] text-muted-foreground">
              언어: {data.language.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI 퀵 액션 드롭다운 단축 버튼들 */}
          <div className="hidden items-center gap-1 sm:flex">
            <Button
              variant="outline"
              size="xs"
              onClick={() => onActionClick("주석 추가")}
              className="h-6 cursor-pointer px-2 text-[9px]"
            >
              <Sparkles className="mr-1 size-2.5" />
              주석 추가
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => onActionClick("리팩토링")}
              className="h-6 cursor-pointer px-2 text-[9px]"
            >
              <RefreshCw className="animate-spin-hover mr-1 size-2.5" />
              리팩토링
            </Button>
          </div>
        </div>
      </header>

      {/* 상태 및 수락/반려 배너 */}
      {data.accepted === null ? (
        <div className="flex items-center justify-between border-b border-primary/10 bg-primary/5 px-6 py-2.5 text-xs">
          <span className="flex items-center gap-1.5 font-light text-foreground/80">
            <Info className="size-3.5 text-primary" />
            AI가 추천 코드를 생성했습니다. 프로젝트에 반영할까요?
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={onReject}
              className="h-6 cursor-pointer border-destructive/20 text-[10px] text-destructive hover:bg-destructive/10"
            >
              <X className="mr-1 size-3" />
              반려
            </Button>
            <Button
              variant="default"
              size="xs"
              onClick={onAccept}
              className="h-6 cursor-pointer bg-foreground text-[10px] text-background hover:bg-foreground/90"
            >
              <Check className="mr-1 size-3" />
              수락
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-2 border-b px-6 py-2 text-[10px] font-medium transition-all duration-300",
            data.accepted
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
              : "border-red-500/20 bg-red-500/10 text-red-600"
          )}
        >
          {data.accepted ? (
            <>
              <Check className="size-3.5" />
              <span>
                변경 사항이 수락되어 프로젝트 소스코드에 병합되었습니다.
              </span>
            </>
          ) : (
            <>
              <X className="size-3.5" />
              <span>변경 제안이 반려되었습니다. 이전 코드가 유지됩니다.</span>
            </>
          )}
        </div>
      )}

      {/* 탭 인터페이스 */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="border-b border-border/30 bg-muted/5 px-6">
          <TabsList className="flex h-9 gap-4 bg-transparent p-0">
            <TabsTrigger
              value="code"
              className="h-full cursor-pointer rounded-none border-b-2 border-transparent px-1 text-[11px] text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground"
            >
              <Code2 className="mr-1 size-3.5" />
              Code
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="h-full cursor-pointer rounded-none border-b-2 border-transparent px-1 text-[11px] text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground"
            >
              <Eye className="mr-1 size-3.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="console"
              className="h-full cursor-pointer rounded-none border-b-2 border-transparent px-1 text-[11px] text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground"
            >
              <Terminal className="mr-1 size-3.5" />
              Console
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="h-full cursor-pointer rounded-none border-b-2 border-transparent px-1 text-[11px] text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground"
            >
              <ShieldAlert className="mr-1 size-3.5" />
              Security
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 탭 콘텐츠 영역 */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {/* Code Tab: Git Diff UI */}
          <TabsContent
            value="code"
            className="m-0 h-full overflow-y-auto bg-muted/10 p-4 font-mono text-[11px]"
          >
            <div className="mb-3 flex justify-end gap-1.5">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setDiffMode("unified")}
                className={cn(
                  "h-5 cursor-pointer px-1.5 text-[9px]",
                  diffMode === "unified" && "bg-muted"
                )}
              >
                Unified Diff
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setDiffMode("split")}
                className={cn(
                  "h-5 cursor-pointer px-1.5 text-[9px]",
                  diffMode === "split" && "bg-muted"
                )}
              >
                Split Diff
              </Button>
            </div>

            {diffMode === "unified" ? (
              <div className="overflow-hidden rounded-xl border border-border/40 bg-card">
                <div className="border-b border-border/20 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
                  Unified Diff View
                </div>
                <div className="divide-y divide-border/10">
                  {/* 단순화된 Diff 출력 */}
                  {data.id === "art-dash" ? (
                    <>
                      <div className="px-4 py-1.5 text-muted-foreground/50">
                        @@ -1,22 +1,78 @@
                      </div>
                      <div className="flex gap-2 bg-red-500/5 px-4 py-1.5 text-red-600">
                        <span className="w-6 shrink-0 text-right">-</span>
                        <span>
                          import React, {"{ useState }"} from 'react';
                        </span>
                      </div>
                      <div className="flex gap-2 bg-emerald-500/5 px-4 py-1.5 text-emerald-600">
                        <span className="w-6 shrink-0 text-right">+</span>
                        <span>"use client"</span>
                      </div>
                      <div className="flex gap-2 bg-emerald-500/5 px-4 py-1.5 text-emerald-600">
                        <span className="w-6 shrink-0 text-right">+</span>
                        <span>import * as React from "react"</span>
                      </div>
                      <div className="flex gap-2 bg-emerald-500/5 px-4 py-1.5 text-emerald-600">
                        <span className="w-6 shrink-0 text-right">+</span>
                        <span>
                          import {"{ TrendingUp, Plus, ShieldAlert, Sparkles }"}{" "}
                          from "lucide-react"
                        </span>
                      </div>
                      <div className="flex gap-2 px-4 py-1.5">
                        <span className="w-6 shrink-0 text-right"> </span>
                        <span>
                          export function ModernAnalyticsDashboard(
                          {"{ customTitle }"}: DashboardProps) &#123;
                        </span>
                      </div>
                      <div className="flex gap-2 bg-red-500/5 px-4 py-1.5 text-red-600">
                        <span className="w-6 shrink-0 text-right">-</span>
                        <span>
                          {" "}
                          const rawHtmlInput = props.customTitle || "통계
                          리포트";
                        </span>
                      </div>
                      <div className="flex gap-2 bg-red-500/5 px-4 py-1.5 text-red-600">
                        <span className="w-6 shrink-0 text-right">-</span>
                        <span> return ( ... dangerouslySetInnerHTML ... )</span>
                      </div>
                      <div className="flex gap-2 bg-emerald-500/5 px-4 py-1.5 text-emerald-600">
                        <span className="w-6 shrink-0 text-right">+</span>
                        <span>
                          {" "}
                          const safeTitle = {"customTitle"} || "엔터프라이즈
                          모니터링 통계"
                        </span>
                      </div>
                      <div className="flex gap-2 bg-emerald-500/5 px-4 py-1.5 text-emerald-600">
                        <span className="w-6 shrink-0 text-right">+</span>
                        <span>
                          {" "}
                          return ( &lt;h3&gt;&#123;safeTitle&#125;&lt;/h3&gt; )
                          // XSS 차단
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2 bg-red-500/5 px-4 py-1.5 text-red-600">
                        <span className="w-6 shrink-0 text-right">-</span>
                        <span>export default function LoginForm() &#123;</span>
                      </div>
                      <div className="flex gap-2 bg-emerald-500/5 px-4 py-1.5 text-emerald-600">
                        <span className="w-6 shrink-0 text-right">+</span>
                        <span>export function GlassmorphismLogin() &#123;</span>
                      </div>
                    </>
                  )}
                  <div className="px-4 py-2 text-[10px] text-muted-foreground/60 italic">
                    ... 나머지 코드({modifiedLines.length} 라인) 동일 ...
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* 오리지널 코드 */}
                <div className="flex h-[400px] flex-col overflow-hidden rounded-xl border border-border/40 bg-card">
                  <div className="border-b border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[9px] font-semibold text-red-600">
                    Original
                  </div>
                  <pre className="flex-1 overflow-auto p-3 text-[9px] leading-relaxed opacity-70 select-none">
                    {data.originalCode}
                  </pre>
                </div>
                {/* 변경된 코드 */}
                <div className="flex h-[400px] flex-col overflow-hidden rounded-xl border border-border/40 bg-card">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[9px] font-semibold text-emerald-600">
                    <span>AI Suggested</span>
                    <Badge
                      variant="outline"
                      className="h-4 border-emerald-500/30 bg-emerald-500/10 font-mono text-[8px] text-emerald-500"
                    >
                      + OKLCH
                    </Badge>
                  </div>
                  <pre className="flex-1 overflow-auto p-3 text-[9px] leading-relaxed">
                    {data.modifiedCode}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent
            value="preview"
            className="m-0 flex h-full items-center justify-center overflow-y-auto bg-muted/10 p-6"
          >
            {data.id === "art-dash" ? (
              <ModernAnalyticsDashboard customTitle="나의 리팩토링 차트" />
            ) : (
              <GlassmorphismLogin />
            )}
          </TabsContent>

          {/* Console Tab */}
          <TabsContent
            value="console"
            className="m-0 h-full overflow-y-auto bg-neutral-950 p-6 font-mono text-xs text-neutral-200"
          >
            <div className="mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2 text-neutral-400">
              <Play className="size-3 text-emerald-500" />
              <span>로컬 컴파일 테스트 콘솔 피드백</span>
            </div>
            <div className="space-y-1.5 leading-relaxed">
              {data.consoleLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-neutral-500">[{idx + 1}]</span>
                  <span
                    className={cn(
                      log.includes("passed") || log.includes("successful")
                        ? "text-emerald-400"
                        : "text-neutral-300"
                    )}
                  >
                    {log.replace(/^\[.*?\]\s*/, "")}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 pt-3 font-semibold text-emerald-400">
                <Check className="size-3.5" />
                <span>Ready to deploy. Build status: OK</span>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent
            value="security"
            className="m-0 h-full overflow-y-auto bg-muted/10 p-6"
          >
            <div className="mx-auto max-w-md space-y-6">
              {/* 원형 점수 보드 */}
              <div className="flex items-center gap-5 rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
                <div className="relative flex size-20 items-center justify-center rounded-full border-4 border-emerald-500/20 bg-emerald-500/5">
                  <div className="animate-spin-slow absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent" />
                  <span className="font-mono text-lg font-bold text-emerald-600">
                    {data.securityScore}
                  </span>
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-xs font-semibold text-foreground">
                    SecureCoder 보안 평가점수
                  </h4>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    자동 분석 및 의존성 위험 검사를 마쳤습니다. 보안 점수는{" "}
                    {data.securityScore}점으로 매우 우수한 안전지대 수준입니다.
                  </p>
                </div>
              </div>

              {/* 검사 세부 이슈 목록 */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground/80">
                  보안 취약점 조치 내역
                </h4>

                {data.securityIssues.length === 0 ? (
                  <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-center">
                    <ShieldCheck className="mx-auto mb-2 size-6 text-emerald-500" />
                    <p className="text-xs font-medium text-emerald-700">
                      발견된 보안 취약점이 없습니다.
                    </p>
                    <p className="mt-0.5 text-[10px] text-emerald-600/70">
                      안전하게 빌드 및 배포할 수 있는 상태입니다.
                    </p>
                  </div>
                ) : (
                  data.securityIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="space-y-2 rounded-xl border border-border bg-card p-4 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                          </span>
                          <span className="font-semibold text-foreground">
                            {issue.title}
                          </span>
                        </div>
                        <Badge className="border-transparent bg-emerald-500/10 text-[9px] text-emerald-500 hover:bg-emerald-500/20">
                          조치완료
                        </Badge>
                      </div>
                      <p className="text-[10px] leading-relaxed font-light text-muted-foreground">
                        {issue.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
