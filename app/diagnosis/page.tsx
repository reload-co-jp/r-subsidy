import type { Metadata } from "next"
import DiagnosisClient from "./diagnosis-client"
import { SITE_NAME, absoluteUrl } from "../../lib/site"

export const metadata: Metadata = {
  title: `補助金診断 | ${SITE_NAME}`,
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
}

export default function DiagnosisPage() {
  return <DiagnosisClient />
}
