import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

export function Avatar({ className, ...props }: any) {
  return <AvatarPrimitive.Root className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full" {...props} />
}
export function AvatarImage({ className, ...props }: any) {
  return <AvatarPrimitive.Image className="aspect-square h-full w-full" {...props} />
}
export function AvatarFallback({ className, ...props }: any) {
  return <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted" {...props} />
}
