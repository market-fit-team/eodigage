import React from "react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}) => {
  return (
    <button
      className={twMerge(
        clsx(
          "inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-colors duration-150 focus:ring-2 focus:ring-blue-500/25 focus:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          // Variant styles
          {
            "border border-blue-600/50 bg-blue-600 text-white shadow-sm hover:bg-blue-700":
              variant === "primary",
            "border border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-200":
              variant === "secondary",
            "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900":
              variant === "outline",
            "bg-transparent text-zinc-600 hover:bg-zinc-100/60 hover:text-zinc-900":
              variant === "ghost",
            "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100":
              variant === "danger",
          },
          // Size styles
          {
            "px-3.5 py-2 text-xs": size === "sm",
            "px-4.5 py-2.5 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          }
        ),
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
