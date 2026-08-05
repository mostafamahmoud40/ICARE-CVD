import type { ComponentType, SVGProps } from "react"

export type DynamicIconComponent = ComponentType<
  SVGProps<SVGSVGElement> & { className?: string }
>

type DynamicLucideIconProps = SVGProps<SVGSVGElement> & {
  icon: DynamicIconComponent
}

/** Renders an icon passed as a prop (avoids dynamic component creation during render). */
export function DynamicLucideIcon({ icon: Icon, ...props }: DynamicLucideIconProps) {
  return <Icon {...props} />
}
