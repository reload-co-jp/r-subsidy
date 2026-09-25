import assert from 'node:assert/strict'
import { sanitizeSubsidies } from '../lib/quality'
import { getDeadlineGroups } from '../lib/seo'
import type { NormalizedSubsidy } from '../lib/types'

const base = { slug: 'a', title: '補助金A', status: 'open', startDate: '2026-01-01', endDate: '2026-12-31', updatedAt: '2026-01-01' }
const make = (o: Partial<NormalizedSubsidy>) => ({ ...base, ...o }) as NormalizedSubsidy

const { subsidies, issues } = sanitizeSubsidies(
  [
    make({}),
    make({ slug: 'dup', updatedAt: '2025-01-01' }),
    make({ slug: 'ph', title: '※使用しない　X' }),
    make({ slug: 'test', title: 'テスト☆彡_20260522' }),
    make({ slug: 'empty', title: ' ' }),
    make({ slug: 'rev', title: 'B', startDate: '2026-05-01', endDate: '2026-04-01' }),
    make({ slug: 'past', title: 'C', endDate: '2026-09-01' }),
    make({ slug: 'up', title: 'D', status: 'upcoming', startDate: '2026-09-01' }),
    make({ slug: 'far', title: 'E', endDate: '2124-03-31' }),
  ],
  '2026-09-26'
)

const bySlug = Object.fromEntries(subsidies.map((s) => [s.slug, s]))
assert.deepEqual(Object.keys(bySlug).sort(), ['a', 'far', 'past', 'up'])
assert.equal(bySlug.past.status, 'closed')
assert.equal(bySlug.up.status, 'open')
assert.equal(bySlug.far.endDate, null)
assert.ok(issues.some((i) => i.slug === 'dup'))
console.log('quality ok')

// 締切グループ（2026-09-26は土曜）
const item = (slug: string, endDate: string) => make({ slug, endDate }) as never
const g = getDeadlineGroups([item('w', '2026-09-27'), item('m', '2026-09-30'), item('s', '2026-10-20'), item('x', '2026-12-01'), item('p', '2026-09-25')], '2026-09-26')
assert.deepEqual(g.thisWeek.map((s) => s.slug), ['w'])
assert.deepEqual(g.thisMonth.map((s) => s.slug), ['w', 'm'])
assert.deepEqual(g.soon.map((s) => s.slug), ['w', 'm', 's'])
console.log('deadline ok')
