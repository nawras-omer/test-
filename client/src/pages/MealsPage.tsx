import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { MealIcon } from '@/components/ui/Icons'

export function MealsPage() {
  return (
    <PlaceholderPage
      titleKey="pages.meals.title"
      subtitleKey="pages.meals.subtitle"
      icon={<MealIcon size={30} />}
      upcoming={['roadmap.recipes', 'roadmap.barcode', 'roadmap.photos']}
    />
  )
}
