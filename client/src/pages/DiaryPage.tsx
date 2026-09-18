import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { DiaryIcon } from '@/components/ui/Icons'

export function DiaryPage() {
  return (
    <PlaceholderPage
      titleKey="pages.diary.title"
      subtitleKey="pages.diary.subtitle"
      icon={<DiaryIcon size={30} />}
      upcoming={['roadmap.diary', 'roadmap.reports', 'roadmap.reminders']}
    />
  )
}
