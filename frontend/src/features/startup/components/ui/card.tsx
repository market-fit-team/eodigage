import React from "react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "rounded-xl border border-zinc-200/80 bg-white shadow-sm transition-all duration-200",
          {
            "hover:border-zinc-300 hover:shadow-md": hoverable,
          }
        ),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        "flex flex-col gap-1.5 border-b border-zinc-100/80 p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3
      className={twMerge(
        "text-base font-bold tracking-tight text-zinc-900",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ children, className, ...props }) => {
  return (
    <p
      className={twMerge(
        "text-xs leading-relaxed font-normal text-zinc-500",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        "p-6 text-sm leading-relaxed text-zinc-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        "flex items-center justify-end gap-2 border-t border-zinc-100/80 p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
