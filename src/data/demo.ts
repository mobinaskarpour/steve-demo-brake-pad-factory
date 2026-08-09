/** Compatibility shims for leftover imports during migration to domain store */
export type { Priority, StatusTone } from '../domain/types'

export const askSteveKnowledge: { patterns: string[]; answer: string }[] = []
export const askSteveFallback = 'از پنل استیو سوال بپرسید؛ پاسخ‌ها به داده‌های زنده دمو متصل هستند.'

export function getWorkById(_id: string) {
  return undefined
}
export function getAgentById(_id: string) {
  return undefined
}
