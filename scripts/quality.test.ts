import assert from 'node:assert/strict'
import { sanitizeSubsidies } from '../lib/quality'
import { getDeadlineGroups } from '../lib/seo'
import type { NormalizedSubsidy } from '../lib/types'
import { extractPeriod, parseJapaneseDates, statusFromPeriod, titleKey } from './scrape-utils'
import { isIndexableSubsidy } from '../lib/format'

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

// 追加取得元（J-Net21・厚労省・公社）の日付解析と重複判定キー
assert.deepEqual(parseJapaneseDates('令和8年10月19日（月）～11月20日（金）'), ['2026-10-19', '2026-11-20'])
assert.deepEqual(parseJapaneseDates('2026年12月25日まで'), ['2026-12-25'])
assert.deepEqual(parseJapaneseDates('10月1日〜'), []) // 年が特定できない日付は使わない
assert.deepEqual(extractPeriod('交付します。申請期限：令和9年1月29日（金）'), { startDate: null, endDate: '2027-01-29' })
assert.equal(extractPeriod('市内の事業者を支援します。'), null)
assert.equal(statusFromPeriod(null, '2026-01-01', '2026-02-01'), 'closed')
assert.equal(statusFromPeriod('2026-03-01', null, '2026-02-01'), 'upcoming')
assert.equal(titleKey('令和８年度第２回中小企業デジタル導入促進補助事業'), titleKey('中小企業デジタル導入促進補助事業'))
assert.equal(isIndexableSubsidy({ status: 'unknown', source: 'jnet21', overview: '短い' }), false)
assert.equal(isIndexableSubsidy({ status: 'open', source: 'jgrants', overview: '' }), true)
console.log('scrape ok')
