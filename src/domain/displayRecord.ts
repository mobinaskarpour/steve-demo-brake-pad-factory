import type { DemoState } from './types'

/**
 * Artificial demo scenario IDs must never appear in user-facing UI.
 * Keep them as internal keys for routing/state only.
 */

export type DisplayKind =
  | 'purchase'
  | 'transaction'
  | 'correspondence'
  | 'inventory'
  | 'alert'
  | 'work'
  | 'thread'
  | 'employee'
  | 'unit'
  | 'agent'
  | 'goal'
  | 'settlement'
  | 'productionOrder'
  | 'productionBatch'
  | 'generic'

export type LocFn = (fa: string | null | undefined, collection: string, id: string, field: string) => string

/** Patterns for artificial demo scenario IDs (not real-world invoice/SKU plates). */
export const ARTIFICIAL_ID_RE = /\b[A-Za-z]{2,12}(?:-[A-Za-z0-9]{1,12})*-\d+\b/gi

type TitlePair = { fa: string; en: string }

/** Explicit overrides when seed title still embeds an ID, references a non-record ID, or is missing. */
const OVERRIDES: Record<string, TitlePair> = {
  'goal-1': { fa: "رساندن تولید ماهانه به ۳۲۰ هزار جفت لنت", en: "رساندن تولید ماهانه به ۳۲۰ هزار جفت لنت" },
  'goal-2': { fa: "کاهش نرخ توقف خط پرس به زیر ۴٪", en: "کاهش نرخ توقف خط پرس به زیر ۴٪" },
  'goal-3': { fa: "کاهش نرخ مردودی بچ به زیر ۲٪", en: "کاهش نرخ مردودی بچ به زیر ۲٪" },
  'goal-4': { fa: "تحویل به‌موقع سفارش‌ها بالای ۹۵٪", en: "تحویل به‌موقع سفارش‌ها بالای ۹۵٪" },
  'goal-5': { fa: "پایداری تامین مواد اصلی و حذف خرید اضطراری", en: "پایداری تامین مواد اصلی و حذف خرید اضطراری" },
  'BR-MNT-442': { fa: 'هزینه نگهداری اضطراری پرس هیدرولیک ۲', en: 'Emergency hydraulic press-2 maintenance expense' },
  'BR-FRT-451': { fa: 'هزینه حمل اضطراری مواد اولیه', en: 'Emergency raw-material freight expense' },
  'BR-REV-460': { fa: 'فروش محقق‌شده سری لنت دیسکی وانتی — تجمیع', en: 'Realized pickup disc-pad batch sales' },
  'BR-CORR-412': { fa: 'مکاتبه مشتری درباره اقدام اصلاحی بچ مردود', en: 'Customer correspondence on failed-batch corrective action' },
  'BR-MR-184': { fa: 'خرید اضطراری ماده اصطکاکی — رزین فنولیک', en: 'Emergency friction-material purchase — phenolic resin' },
  'BR-MR-191': { fa: 'خرید رنگ پودری اپوکسی خط پرداخت', en: 'Epoxy powder-coat purchase for finishing line' },
  'PR-196': { fa: 'خرید قالب یدکی پرس ۲', en: 'Spare die purchase for press 2' },
  'TX-468': { fa: 'هزینه ضایعات بچ مردود', en: 'Rejected-batch scrap expense' },
  'APR-102': { fa: 'تأیید داخلی هزینه نگهداری', en: 'Internal maintenance-cost approval' },
  'BATCH-2417': { fa: 'بچ قرنطینه‌شده (مردود آزمون اصطکاک)', en: 'Quarantined batch (friction-test failure)' },
  'BATCH-2408': { fa: 'بچ ترخیص‌شده پرس ۱', en: 'Cleared batch — press 1' },
  'BATCH-2412': { fa: 'بچ در حال تولید', en: 'Batch in production' },
  'BATCH-2414': { fa: 'بچ شارژ میکسر', en: 'Mixer-charge batch' },
  'BATCH-2415': { fa: 'بچ ترخیص‌شده امروز', en: 'Batch cleared today' },
  'BATCH-2416': { fa: 'بچ ترخیص‌شده کنترل کیفیت', en: 'QC-cleared batch' },
  'BATCH-2418': { fa: 'بچ جایگزین پیشنهادی', en: 'Proposed substitute batch' },
  'BATCH-2419': { fa: 'بچ در انتظار کنترل کیفیت', en: 'Batch awaiting QC' },
  'PROD-1141': { fa: 'دستور تولید لنت دیسکی وانتی سنگین', en: 'Heavy-pickup disc-pad production order' },
  'PROD-1142': { fa: 'دستور تولید لنت دیسکی سبک تجاری', en: 'Light-commercial disc-pad production order' },
  'PROD-1143': { fa: 'دستور تولید لنت دیسکی سواری اقتصادی', en: 'Economy passenger disc-pad production order' },
  'PROD-1145': { fa: 'دستور تولید لنت دیسکی وانتی', en: 'Pickup disc-pad production order' },
  'PROD-1146': { fa: 'دستور تولید لنت دیسکی سواری', en: 'Passenger disc-pad production order' },
  'PROD-1147': { fa: 'دستور تولید لنت دیسکی شاسی‌بلند', en: 'SUV disc-pad production order' },
  'PROD-1148': { fa: 'دستور تولید معلق سفارش قطعه‌گستر پارس', en: 'Pending production order for Parts-Gostar Pars order' },
  'SO-3061': { fa: 'سفارش فروش تسویه‌شده', en: 'Settled sales order' },
  'SO-3081': { fa: 'سفارش فروش بدون دستور تولید', en: 'Sales order awaiting production order' },
  'SO-3092': { fa: 'سفارش فروش در ریسک تاخیر تحویل', en: 'At-risk delivery sales order' },
  'FG-8835': { fa: 'لنت دیسکی وانتی سنگین', en: 'Heavy pickup disc pad' },
  'FG-8836': { fa: 'لنت دیسکی سبک تجاری', en: 'Light commercial disc pad' },
  'FG-8838': { fa: 'لنت دیسکی سواری اقتصادی', en: 'Economy passenger disc pad' },
  'FG-8840': { fa: 'لنت دیسکی وانتی', en: 'Pickup disc pad' },
  'FG-8842': { fa: 'لنت دیسکی سواری', en: 'Passenger disc pad' },
  'FG-8845': { fa: 'لنت دیسکی شاسی‌بلند', en: 'SUV disc pad' },
  'QC-0238': { fa: 'برگه ترخیص کیفیت', en: 'QC release record' },
  'QC-0241': { fa: 'برگه قرنطینه کیفیت', en: 'QC quarantine record' },
  'QC-541': { fa: 'سابقه آزمون کیفیت', en: 'QC test record' },
  'QC-549': { fa: 'سابقه آزمون کیفیت', en: 'QC test record' },
  'SH-1201': { fa: 'محموله ارسالی بازار یدکی', en: 'Aftermarket shipment' },
  'SH-1204': { fa: 'محموله ارسالی', en: 'Outbound shipment' },
  'SH-1207': { fa: 'محموله در حال بارگیری', en: 'Shipment being loaded' },
  'NVH-118': { fa: 'گزارش آزمایشگاه صدا و لرزش (NVH)', en: 'NVH lab report' },
  'AR-9': { fa: 'الیاف آرامید', en: 'Aramid fiber' },
  'BP-24': { fa: 'ورق پشتی فولادی', en: 'Steel backplate' },
  'SP-1068': { fa: 'رزین فنولیک', en: 'Phenolic resin' },
  'thr-br-mr-184': { fa: 'گفتگوی تأیید خرید اضطراری رزین فنولیک', en: 'Emergency phenolic-resin purchase approval thread' },
  'work-wh-1': { fa: 'تأمین اضطراری رزین فنولیک', en: 'Emergency phenolic-resin supply' },
  'work-wh-2': { fa: 'تأمین رنگ پودری اپوکسی', en: 'Epoxy powder-coat supply' },
  'work-fin-1': { fa: 'تأیید هزینه نگهداری پرس', en: 'Press-maintenance cost approval' },
  'work-fin-2': { fa: 'تأیید هزینه حمل اضطراری', en: 'Emergency-freight cost approval' },
  'work-corr-1': { fa: 'پاسخ به نامه مشتری', en: 'Reply to customer letter' },
  'work-maint-1': { fa: 'تعویض قالب پرس ۲', en: 'Press-2 die replacement' },
  'work-qc-1': { fa: 'رسیدگی به مردودی کنترل کیفیت', en: 'QC rejection follow-up' },
  'work-re-1': { fa: 'بسته‌بندی و بارگیری محموله', en: 'Shipment packing and loading' },
  'work-ship-1': { fa: 'بارگیری محموله بازار یدکی', en: 'Aftermarket shipment loading' },
}

function pairFromOverride(id: string): TitlePair | null {
  return OVERRIDES[id] || null
}

function cleanTitle(raw: string, id: string): string {
  return raw
    .replace(new RegExp(`\\b${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), '')
    .replace(/\s*[·•\-–—]\s*$/g, '')
    .replace(/^\s*[·•\-–—]\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Resolve a user-facing business title for an internal record id.
 * NEVER returns the artificial id itself.
 */
export function displayRecord(
  state: DemoState,
  kind: DisplayKind,
  id: string,
  locale: 'fa' | 'en',
  loc?: LocFn,
): string {
  const ov = pairFromOverride(id)
  if (ov) return locale === 'en' ? ov.en : ov.fa

  const pick = (fa: string | undefined, collection: string, field: string) => {
    if (!fa) return ''
    if (loc) return loc(fa, collection, id, field)
    return fa
  }

  let title = ''
  switch (kind) {
    case 'purchase': {
      const r = state.purchases.find((p) => p.id === id)
      title = pick(r?.title, 'purchases', 'title')
      break
    }
    case 'transaction': {
      const r = state.transactions.find((p) => p.id === id)
      title = pick(r?.title, 'transactions', 'title')
      break
    }
    case 'correspondence': {
      const r = state.correspondence.find((p) => p.id === id)
      title = pick(r?.title, 'correspondence', 'title')
      break
    }
    case 'inventory': {
      const r = state.inventory.find((p) => p.id === id)
      title = pick(r?.sku, 'inventory', 'sku')
      break
    }
    case 'alert': {
      const r = state.alerts.find((p) => p.id === id)
      title = pick(r?.title, 'alerts', 'title')
      break
    }
    case 'work': {
      const r = state.workItems.find((p) => p.id === id)
      title = pick(r?.title, 'workItems', 'title')
      break
    }
    case 'thread': {
      const r = state.threads.find((p) => p.id === id)
      title = pick(r?.title, 'threads', 'title')
      break
    }
    case 'employee': {
      const r = state.employees.find((p) => p.id === id)
      title = pick(r?.name, 'employees', 'name')
      break
    }
    case 'unit': {
      const r = state.units.find((p) => p.id === id)
      title = pick(r?.name, 'units', 'name')
      break
    }
    case 'agent': {
      const r = state.agents.find((p) => p.id === id)
      title = pick(r?.name, 'agents', 'name')
      break
    }
    case 'goal': {
      const r = state.goals.find((p) => p.id === id)
      title = pick(r?.title, 'goals', 'title')
      break
    }
    case 'settlement': {
      const r = state.settlements.find((v) => v.id === id)
      if (r) title = r.task
      break
    }
    case 'productionOrder': {
      const r = state.productionOrders.find((v) => v.id === id)
      if (r) title = r.itemSku
      break
    }
    case 'productionBatch': {
      const r = state.productionBatches.find((v) => v.id === id)
      if (r) title = r.note
      break
    }
    default:
      break
  }

  title = cleanTitle(title, id)
  if (title && !ARTIFICIAL_ID_RE.test(title)) return title

  // Last resort: never expose the id — use a generic business phrase
  if (import.meta.env?.DEV) {
    console.warn(`[displayRecord] missing display title for ${kind}:${id}`)
  }
  return locale === 'en' ? 'Business record' : 'رکورد کسب‌وکار'
}

/** Build a replacement map of artificial IDs → display titles from live state + overrides. */
export function buildStaticIdTitleMap(locale: 'fa' | 'en'): Map<string, string> {
  const map = new Map<string, string>()
  for (const [id, pair] of Object.entries(OVERRIDES)) {
    map.set(id, locale === 'en' ? pair.en : pair.fa)
  }
  return map
}

export function buildIdTitleMap(state: DemoState, locale: 'fa' | 'en', loc?: LocFn): Map<string, string> {
  const map = buildStaticIdTitleMap(locale)
  const add = (kind: DisplayKind, id: string) => {
    if (map.has(id)) return
    map.set(id, displayRecord(state, kind, id, locale, loc))
  }
  state.purchases.forEach((p) => add('purchase', p.id))
  state.transactions.forEach((p) => add('transaction', p.id))
  state.correspondence.forEach((p) => add('correspondence', p.id))
  state.inventory.forEach((p) => add('inventory', p.id))
  state.alerts.forEach((p) => add('alert', p.id))
  state.workItems.forEach((p) => add('work', p.id))
  state.threads.forEach((p) => add('thread', p.id))
  state.goals.forEach((p) => add('goal', p.id))
  state.employees.forEach((p) => add('employee', p.id))
  state.units.forEach((p) => add('unit', p.id))
  state.agents.forEach((p) => add('agent', p.id))
  state.settlements.forEach((p) => add('settlement', p.id))
  state.productionOrders.forEach((p) => add('productionOrder', p.id))
  state.productionBatches.forEach((p) => add('productionBatch', p.id))
  return map
}

/**
 * Scrub artificial scenario IDs from any user-facing string.
 * Prefer explicit map entries; unknown artificial IDs are removed (never shown).
 */
export function scrubVisibleIds(text: string, idMap: Map<string, string>): string {
  if (!text) return text
  return text.replace(ARTIFICIAL_ID_RE, (match) => {
    const key = match.toUpperCase()
    // preserve case-insensitive lookup
    for (const [id, title] of idMap) {
      if (id.toUpperCase() === key) return title
    }
    // Unknown artificial id — strip rather than leak
    return ''
  })
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([،,.])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\s*[·•]\s*[·•]/g, ' · ')
    .trim()
}

export function scrubWithState(
  text: string,
  state: DemoState,
  locale: 'fa' | 'en',
  loc?: LocFn,
): string {
  return scrubVisibleIds(text, buildIdTitleMap(state, locale, loc))
}
