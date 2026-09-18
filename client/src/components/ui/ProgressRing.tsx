import type { ReactNode } from 'react'

interface ProgressRingProps {
  value: number
  max: number
  /** Diameter-independent; the SVG scales with its container. */
  stroke?: number
  children?: ReactNode
  label?: string
}

/**
 * Animated donut used for the daily calorie goal.
 * Uses stroke-dasharray on a rotated circle — direction-agnostic, so it renders
 * identically in LTR and RTL.
 */
export function ProgressRing({ value, max, stroke = 14, children, label }: ProgressRingProps) {
  const size = 200
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  const dashoffset = circumference * (1 - ratio)

  return (
    <div className="ring" role="img" aria-label={label}>
      <svg className="ring__svg" viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
        />
      </svg>
      <div className="ring__center">{children}</div>
    </div>
  )
}
