/**
 * Inline SVG icon set (stroke-based, currentColor).
 * Directional icons are marked `.flip-rtl` by their callers where it matters.
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* ---------------------------------------------------------------- brand -- */
export function FlameIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3c2.6 3.4 4.6 5.4 4.6 8.6A4.6 4.6 0 0 1 12 16.2a4.6 4.6 0 0 1-4.6-4.6C7.4 8.6 9.4 6.6 12 3Z" />
      <path d="M12 20.5a6 6 0 0 0 6-6" opacity=".45" />
      <path d="M6 14.5a6 6 0 0 0 6 6" opacity=".45" />
    </Svg>
  )
}

export function LeafIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20c0-8 5-14 16-15 .8 8.5-3.5 14.5-11 14.5-2 0-3.6-.3-5-1.5Z" />
      <path d="M8.5 20c1.6-4.6 4.6-8.2 9-10.2" />
    </Svg>
  )
}

/* --------------------------------------------------------------- layout -- */
export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 10.6 12 4l8 6.6V19a1.6 1.6 0 0 1-1.6 1.6h-3.2v-5.8H8.8v5.8H5.6A1.6 1.6 0 0 1 4 19v-8.4Z" />
    </Svg>
  )
}

export function DiaryIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14A1.5 1.5 0 0 1 17 20.5H6Z" />
      <path d="M6 3.5A1.5 1.5 0 0 0 4.5 5v14A1.5 1.5 0 0 0 6 20.5" />
      <path d="M8.5 8.5h6M8.5 12h6M8.5 15.5h3.5" />
    </Svg>
  )
}

export function MealIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.5 3v6.5a2.5 2.5 0 0 0 5 0V3" />
      <path d="M10 12.5V21" />
      <path d="M16.5 3c1.6 2 1.6 5 0 7v11" />
    </Svg>
  )
}

export function TrendIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 16.5 9 11l3.5 3.5L20.5 6.5" />
      <path d="M15 6.5h5.5V12" />
    </Svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.2v2M12 18.8v2M20.8 12h-2M5.2 12h-2M18.2 5.8l-1.4 1.4M7.2 16.8l-1.4 1.4M18.2 18.2l-1.4-1.4M7.2 7.2 5.8 5.8" />
    </Svg>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.5 20.5c0-3.6 3.4-5.75 7.5-5.75s7.5 2.15 7.5 5.75" />
    </Svg>
  )
}

export function LogOutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.5 4.5h3A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5h-3" />
      <path d="M10 8 6 12l4 4" className="flip-rtl" />
      <path d="M6 12h8" />
    </Svg>
  )
}

/* ------------------------------------------------------------ ui chrome -- */
export function GlobeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.4 3.4 5.3 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.3-3.4-8.5S9.8 5.9 12 3.5Z" />
    </Svg>
  )
}

export function PaletteIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-.9 2-1.8 0-1.5-1.3-1.8-1.3-3 0-.9.8-1.7 1.8-1.7h1.8a4.2 4.2 0 0 0 4.2-4.2c0-3.5-3.8-6.3-8.5-6.3Z" />
      <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </Svg>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
    </Svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Svg>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" className="flip-rtl" />
    </Svg>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Svg>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 6.5h15" />
      <path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
      <path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
      <path d="M10.5 10.5v6M13.5 10.5v6" opacity=".6" />
    </Svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

/* ---------------------------------------------------------------- forms -- */
export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m5 8 7 5 7-5" />
    </Svg>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Svg>
  )
}

export function EyeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Svg>
  )
}

export function EyeOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 4.5 20 20.5" />
      <path d="M9.6 6.9A9.6 9.6 0 0 1 12 6.5c6 0 9.5 5.5 9.5 5.5a17 17 0 0 1-2.7 3.3" />
      <path d="M6.3 8.6A16.6 16.6 0 0 0 2.5 12S6 17.5 12 17.5c1 0 1.9-.2 2.7-.4" />
      <path d="M10.2 10.3a2.8 2.8 0 0 0 3.7 3.9" />
    </Svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.3v.2" />
    </Svg>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.2" />
    </Svg>
  )
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.3 12.3 2.5 2.5 4.9-5" />
    </Svg>
  )
}

/* ------------------------------------------------------------ nutrition -- */
export function DropletIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5c3 3.6 5.5 6.4 5.5 10a5.5 5.5 0 1 1-11 0c0-3.6 2.5-6.4 5.5-10Z" />
    </Svg>
  )
}

export function TargetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function BoltIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.5 3 6 13.5h5L10.5 21 18 10.5h-5L13.5 3Z" />
    </Svg>
  )
}

export function SunriseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v3M6.3 7.3 8 9M17.7 7.3 16 9M3 15h3M18 15h3" />
      <path d="M7 18a5 5 0 0 1 10 0" />
      <path d="M3.5 21h17" />
    </Svg>
  )
}

export function SunLunchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v2.2M12 18.8V21M4.2 12h2.2M17.6 12h2.2M6.5 6.5l1.6 1.6M15.9 15.9l1.6 1.6M17.5 6.5l-1.6 1.6M8.1 15.9 6.5 17.5" />
    </Svg>
  )
}

export function MoonDinnerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.8A8.2 8.2 0 0 1 9.2 4 8.4 8.4 0 1 0 20 14.8Z" />
    </Svg>
  )
}

export function SnackIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.2v3.9l2.6 1.6" />
      <path d="M9 4.4 9.6 3M15 4.4 14.4 3" />
    </Svg>
  )
}

export function BarcodeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7V5.5A1.5 1.5 0 0 1 5.5 4H7M17 4h1.5A1.5 1.5 0 0 1 20 5.5V7M20 17v1.5a1.5 1.5 0 0 1-1.5 1.5H17M7 20H5.5A1.5 1.5 0 0 1 4 18.5V17" />
      <path d="M8 8.5v7M11 8.5v7M14 8.5v7M17 8.5v7" />
    </Svg>
  )
}

export function ScaleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M8 10.5a5 5 0 0 1 8 0" />
      <path d="M12 10.5v2.5" />
    </Svg>
  )
}

export function BookmarkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 4.5h11a1 1 0 0 1 1 1v14l-6.5-4-6.5 4v-14a1 1 0 0 1 1-1Z" />
    </Svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.2" />
      <path d="M15.6 15.6 20 20" />
    </Svg>
  )
}

export function SparkleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5l1.7 4.4 4.4 1.7-4.4 1.7L12 15.7l-1.7-4.4L5.9 9.6l4.4-1.7L12 3.5Z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
    </Svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5.5" width="17" height="14" rx="2.5" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
    </Svg>
  )
}

export function ChartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 19.5h15" />
      <path d="M7.5 19.5v-6M12 19.5V6.5M16.5 19.5v-9" />
    </Svg>
  )
}
