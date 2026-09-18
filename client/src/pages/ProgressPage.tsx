import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { TrendIcon } from '@/components/ui/Icons'

export function ProgressPage() {
  return (
    <PlaceholderPage
      titleKey="pages.progress.title"
      subtitleKey="pages.progress.subtitle"
      icon={<TrendIcon size={30} />}
      upcoming={['dashboard.week.title', 'dashboard.streak.title', 'dashboard.quick.weighIn']}
    />
  )
}
