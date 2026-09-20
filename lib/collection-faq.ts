import type { FaqItem } from "../components/elements/faq-section"

export function buildCollectionFaqItems(
  label: string,
  totalCount: number,
  openCount: number
): FaqItem[] {
  if (totalCount === 0) return []

  return [
    {
      question: `${label}の補助金は何件掲載されていますか?`,
      answer: `${label}が対象の補助金を${totalCount}件掲載しており、うち${openCount}件が受付中です。`,
    },
    {
      question: "今すぐ申請できる補助金はどう探せますか?",
      answer:
        "一覧の受付状態フィルターで「受付中」を選ぶと、現在申請できる補助金だけに絞り込めます。",
    },
    {
      question: "掲載情報はいつ更新されますか?",
      answer:
        "Jグランツ等の公募情報をもとに随時更新しています。締切や要件の詳細は各補助金の詳細ページで最新の内容をご確認ください。",
    },
  ]
}
