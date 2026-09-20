import type { Metadata } from "next"
import DiagnosisClient from "./diagnosis-client"
import { SITE_NAME, absoluteUrl } from "../../lib/site"
import FaqSection, { buildFaqStructuredData } from "../../components/elements/faq-section"

const faqItems = [
  {
    question: "補助金診断は無料で使えますか?",
    answer: "無料で利用できます。所在地・業種・従業員数・用途を選ぶだけで診断結果を確認できます。",
  },
  {
    question: "診断結果はどうやって計算されますか?",
    answer:
      "地域・業種・従業員数・用途・受付状況の一致度をスコア化し、「強くおすすめ」「条件一致」「要確認」の3段階で表示します。",
  },
  {
    question: "診断結果を後で見返すことはできますか?",
    answer:
      "診断結果自体は保存されませんが、条件に近い都道府県別・業種別の補助金一覧ページはブックマークして後から確認できます。",
  },
]

export const metadata: Metadata = {
  title: "補助金診断",
  description:
    "所在地・業種・従業員数・用途から、中小企業・個人事業主向けの補助金を診断できるページです。国と東京都の制度をまとめて比較できます。",
  alternates: {
    canonical: absoluteUrl("/diagnosis/"),
  },
  openGraph: {
    title: `補助金診断 | ${SITE_NAME}`,
    description:
      "所在地・業種・従業員数・用途から、中小企業・個人事業主向けの補助金を診断できます。",
    url: absoluteUrl("/diagnosis/"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `補助金診断 | ${SITE_NAME}`,
    description:
      "所在地・業種・従業員数・用途から、中小企業・個人事業主向けの補助金を診断できます。",
  },
}

export default function DiagnosisPage() {
  const webAppStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `補助金診断 | ${SITE_NAME}`,
    url: absoluteUrl("/diagnosis/"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
    description:
      "所在地・業種・従業員数・用途から、中小企業・個人事業主向けの補助金を診断できます。",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqStructuredData(faqItems)) }}
      />
      <DiagnosisClient />
      <div className="page-content">
        <FaqSection items={faqItems} />
      </div>
    </>
  )
}
