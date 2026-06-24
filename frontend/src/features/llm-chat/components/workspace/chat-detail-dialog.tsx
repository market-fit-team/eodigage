"use client"

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"

type ChatDetailDialogProps = {
  title: string
  description: string
  children: React.ReactNode
}

export function ChatDetailDialog({
  title,
  description,
  children,
}: ChatDetailDialogProps) {
  const router = useRouter()

  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="border-b border-border/60 px-4 py-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="p-4">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
