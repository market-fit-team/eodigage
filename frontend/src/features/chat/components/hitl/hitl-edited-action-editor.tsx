"use client"

import type { UseFormRegisterReturn } from "react-hook-form"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"

type HitlEditedActionEditorProps = {
  nameRegistration: UseFormRegisterReturn
  argsTextRegistration: UseFormRegisterReturn
}

export function HitlEditedActionEditor({
  nameRegistration,
  argsTextRegistration,
}: HitlEditedActionEditorProps) {
  return (
    <div className="space-y-2">
      <Input {...nameRegistration} className="font-mono text-xs" />
      <Textarea
        {...argsTextRegistration}
        className="min-h-32 resize-y font-mono text-xs"
      />
    </div>
  )
}
