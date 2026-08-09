import { askSteveFallback, askSteveKnowledge } from '../data/demo'

export function askSteve(question: string): string {
  const q = question.trim()
  if (!q) return 'لطفاً سوال خود را بنویسید تا بر اساس وضعیت امروز کارخانه آریاترمز'

  const hit = askSteveKnowledge.find((item) =>
    item.patterns.some((p) => q.includes(p)),
  )

  if (hit) return hit.answer
  return askSteveFallback
}
