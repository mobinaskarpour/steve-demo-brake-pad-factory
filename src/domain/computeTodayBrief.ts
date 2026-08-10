import type { DemoState } from './types'
import { buildIdTitleMap, scrubVisibleIds } from './displayRecord'

type BriefLine = { label: string; text: string }
type Brief = {
  greeting: string
  dateLabel: string
  paragraphs: string[]
  lines: BriefLine[]
}

type Keys = {
  purchaseIds: string[]
  transactionIds: string[]
}

const DEMO_KEYS: Keys = {
  purchaseIds: ['RE-BUD-184', 'PR-184', 'BM-PO-184', 'BR-MR-184', 'SP-PR-184', 'TR-PO-184', 'LGL-FEE-184'],
  transactionIds: ['RE-COM-442', 'TX-442', 'BM-PAY-442', 'BR-MNT-442', 'SP-MNT-442', 'TR-FRT-442', 'LGL-COST-442'],
}

function patchParagraph(text: string, state: DemoState, en: boolean): string {
  let out = text
  for (const p of state.purchases) {
    if (p.status !== 'approved' && p.status !== 'rejected') continue
    const done = p.status === 'approved'
    if (en) {
      out = out.replace(
        new RegExp(`(\\(?(?:purchase |budget )?request )?${p.id}\\)? is still waiting for your approval`, 'gi'),
        done ? `${p.id} is approved` : `${p.id} was rejected`,
      )
      out = out.replace(
        new RegExp(`still waiting for your approval([^.]*)(${p.id})`, 'gi'),
        (_m, a, id) => (done ? `approved${a}${id}` : `rejected${a}${id}`),
      )
      out = out.replace(
        new RegExp(`(${p.id})([^.]{0,40})still waiting for your approval`, 'gi'),
        done ? `$1$2is approved` : `$1$2was rejected`,
      )
      out = out.replace(
        new RegExp(`(${p.id}\\)) still waiting for your approval`, 'g'),
        done ? `$1 is approved` : `$1 was rejected`,
      )
    } else {
      out = out.replace(
        new RegExp(`(درخواست[^۰-۹A-Z]{0,40}${p.id}\\)) هنوز در انتظار تایید شماست`, 'g'),
        done ? `$1 تایید شده است` : `$1 رد شده است`,
      )
      out = out.replace(
        new RegExp(`(${p.id}) هنوز در انتظار تایید شماست`, 'g'),
        done ? `$1 تایید شده است` : `$1 رد شده است`,
      )
    }
  }
  for (const t of state.transactions) {
    if (t.status !== 'approved' && t.status !== 'rejected') continue
    const done = t.status === 'approved'
    if (en) {
      out = out.replace(
        new RegExp(`(${t.id}) is still in the finance queue`, 'g'),
        done ? `$1 is approved` : `$1 was rejected`,
      )
      out = out.replace(
        new RegExp(`(${t.id})([^.]{0,30})in the finance queue`, 'g'),
        done ? `$1$2approved` : `$1$2rejected`,
      )
    } else {
      out = out.replace(
        new RegExp(`(تراکنش ${t.id}|${t.id}) در صف مالی مانده`, 'g'),
        done ? `$1 تایید شده است` : `$1 رد شده است`,
      )
      out = out.replace(
        new RegExp(`(${t.id}) در صف مالی است`, 'g'),
        done ? `$1 تایید شده است` : `$1 رد شده است`,
      )
    }
  }
  return out
}

/**
 * State-aware Today executive brief shared across demos.
 * Keeps seeded narrative, then rewrites status phrases and the “Still open” line.
 */
export function computeTodayBrief(state: DemoState, locale: 'fa' | 'en', staticEn?: Brief, keys: Keys = DEMO_KEYS): Brief {
  const en = locale === 'en'
  const base = en && staticEn
    ? staticEn
    : {
        greeting: state.brief.greeting,
        dateLabel: state.brief.dateLabel,
        paragraphs: [...state.brief.paragraphs],
        lines: state.brief.lines.map((l) => ({ ...l })),
      }

  const pendingPr = state.purchases.filter((p) => p.status === 'pending')
  const pendingTx = state.transactions.filter((t) => t.status === 'pending')
  const openCorr = state.correspondence.filter((c) => c.status !== 'closed')

  const openBits: string[] = []
  for (const id of keys.purchaseIds) {
    if (pendingPr.some((p) => p.id === id)) openBits.push(en ? `Approve ${id}` : `تایید ${id}`)
  }
  for (const p of pendingPr) {
    if (!keys.purchaseIds.includes(p.id) && openBits.length < 3) openBits.push(en ? `Approve ${p.id}` : `تایید ${p.id}`)
  }
  for (const id of keys.transactionIds) {
    if (pendingTx.some((t) => t.id === id)) openBits.push(en ? `clear ${id}` : `پرداخت ${id}`)
  }
  if (openCorr[0] && openBits.length < 3) {
    openBits.push(en ? `answer ${openCorr[0].id || 'open correspondence'}` : `پاسخ ${openCorr[0].id || 'مکاتبه باز'}`)
  }

  const paragraphs = base.paragraphs.map((p) => patchParagraph(p, state, en))

  // Refresh “before noon” paragraph if all tracked decisions closed
  if (!pendingPr.length && !pendingTx.length && paragraphs.length >= 3) {
    paragraphs[2] = en
      ? 'Primary purchase and payment decisions are cleared. Keep remaining operational blockers under watch so today’s commitments stay on schedule.'
      : 'تصمیم‌های اصلی خرید و پرداخت بسته شده‌اند. بلاکرهای عملیاتی باقی‌مانده را زیر نظر نگه دارید تا تعهدهای امروز روی برنامه بماند.'
  }

  const labels = en
    ? { since: 'Since your last review', open: 'Still open', focus: "Today's focus", prep: 'Prepare now' }
    : { since: 'از آخرین بازبینی', open: 'هنوز باز', focus: 'تمرکز امروز', prep: 'الان آماده شوید' }

  const sinceLine = base.lines.find((l) => /از آخرین|Since your last/i.test(l.label)) || base.lines[0]
  const focusLine = base.lines.find((l) => /تمرکز|Today's focus/i.test(l.label)) || base.lines[2]
  const prepLine = base.lines.find((l) => /آماده|Prepare/i.test(l.label)) || base.lines[3]

  let sinceText = patchParagraph(sinceLine?.text || '', state, en)
  const approvedPrimary = state.purchases.find((p) => keys.purchaseIds.includes(p.id) && p.status === 'approved')
  if (approvedPrimary) {
    sinceText = en
      ? `${approvedPrimary.id} was approved; remaining operational blockers are still in play.`
      : `${approvedPrimary.id} تایید شد؛ بلاکرهای عملیاتی باقی‌مانده هنوز روی میز است.`
  }

  const stillOpen = openBits.length
    ? openBits.join(en ? ', ' : '، ') + '.'
    : en
      ? 'No primary purchase or payment approvals remain open.'
      : 'تایید اصلی خرید یا پرداختی باز نمانده است.'

  const idMap = buildIdTitleMap(state, locale)
  const scrub = (text: string) => scrubVisibleIds(text, idMap)

  return {
    greeting: base.greeting,
    dateLabel: base.dateLabel,
    paragraphs: paragraphs.map(scrub),
    lines: [
      { label: labels.since, text: scrub(sinceText) },
      { label: labels.open, text: scrub(stillOpen) },
      { label: labels.focus, text: scrub(focusLine?.text || base.lines[2]?.text || '') },
      { label: labels.prep, text: scrub(prepLine?.text || base.lines[3]?.text || '') },
    ],
  }
}
