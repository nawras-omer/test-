import { useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n'

/**
 * Placeholder affordance for the foundation build: buttons that will later open
 * a real flow acknowledge the click instead of feeling broken.
 */
export function useComingSoon() {
  const { push } = useToast()
  const { t } = useI18n()

  return useCallback(() => push(t('common.comingSoon'), 'default'), [push, t])
}
