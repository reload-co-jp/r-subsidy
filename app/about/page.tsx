import type { Metadata } from "next"
import Link from "next/link"
import { SITE_NAME, absoluteUrl } from "../../lib/site"

export const metadata: Metadata = {
  title: "運営者情報・掲載データについて",
  description:
    "RSubsidy 補助金サーチの運営会社、補助金データの取得元・更新方法・受付状態の判定方法、利用上の注意をまとめたページです。",
  alternates: {
    canonical: absoluteUrl("/about/"),
  },
}

const companyItems = [
  { label: "運営会社", value: "株式会社リロード / Reload, Inc." },
  { label: "代表者", value: "山本翔平" },
  { label: "設立", value: "2014年8月22日" },
  { label: "事業内容", value: "インターネット関連事業" },
  {
    label: "所在地",
    value: "〒101-0046 東京都千代田区神田佐久間町 3-37-1 山茂登ビル 3F",
  },
]

export default function AboutPage() {
  return (
    <div className="page-content">
      <section style={{ marginBottom: "2.5rem" }}>
        <h1 className="page-title">このサイトについて</h1>
        <div
          style={{
            color: "var(--text-base)",
            fontSize: ".95rem",
            lineHeight: 1.9,
          }}
        >
          <p style={{ marginBottom: ".8rem" }}>
            {SITE_NAME}
            は、中小企業・個人事業主が使える補助金を探しやすくするための補助金ポータルサイトです。
          </p>
          <p>
            Jグランツ掲載の制度をもとに、都道府県・受付状態・目的から検索、比較、診断できる情報を提供しています。
          </p>
        </div>
      </section>

      <section className="card" style={{ marginBottom: "2.5rem" }}>
        <h2 className="sub-title">運営会社</h2>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(7rem, 10rem) 1fr",
            gap: ".8rem 1rem",
            color: "var(--text-base)",
            fontSize: ".9rem",
            lineHeight: 1.7,
          }}
        >
          {companyItems.map((item) => (
            <div
              key={item.label}
              style={{
                display: "contents",
              }}
            >
              <dt style={{ color: "var(--text-muted)" }}>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
          <div style={{ display: "contents" }}>
            <dt style={{ color: "var(--text-muted)" }}>公式サイト</dt>
            <dd>
              <a
                href="https://reload.co.jp"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--green-dark)",
                  textUnderlineOffset: ".15em",
                }}
              >
                https://reload.co.jp
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section id="data" style={{ marginBottom: "2.5rem" }}>
        <h2 className="sub-title section-title">掲載データについて</h2>
        <dl
          className="card"
          style={{ display: "grid", gap: "1rem", fontSize: ".92rem" }}
        >
          <div>
            <dt style={{ fontWeight: 700 }}>取得元</dt>
            <dd>
              デジタル庁が運営する
              <a
                href="https://www.jgrants-portal.go.jp/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Jグランツ
              </a>
              の公開APIを中心に、国・自治体など公的機関が公開している補助金・助成金情報を取得しています。各制度ページに出典と公式ページへのリンクを掲載しています。
            </dd>
          </div>
          <div>
            <dt style={{ fontWeight: 700 }}>更新方法</dt>
            <dd>
              運営者が取得処理を実行してデータを更新し、サイトを再生成しています。各ページの「当サイトの最終確認日」は、最後にデータを取得した日付です。
            </dd>
          </div>
          <div>
            <dt style={{ fontWeight: 700 }}>受付状態の判定</dt>
            <dd>
              取得時点の受付開始日・終了日をもとに「受付中」「公募予定」「受付終了」を判定し、期間が不明な制度は「要確認」と表示しています。予算到達による早期終了や期間変更は反映されない場合があります。
            </dd>
          </div>
          <div>
            <dt style={{ fontWeight: 700 }}>公式情報とサイト独自の解説</dt>
            <dd>
              制度名・期間・金額・補助率・詳細本文は公的機関の公開情報に基づきます。ページ冒頭の要約、よくある質問、行政書士コメント、ガイド記事は当サイト独自の解説です。公開情報に記載がない項目は推測で補わず「未確認」と表示しています。
            </dd>
          </div>
        </dl>
      </section>

      <section id="disclaimer" style={{ marginBottom: "2.5rem" }}>
        <h2 className="sub-title section-title">利用上の注意</h2>
        <ul
          className="card"
          style={{
            display: "grid",
            gap: ".5rem",
            fontSize: ".92rem",
            paddingLeft: "2.25rem",
          }}
        >
          <li>
            掲載情報の正確性・最新性・完全性を保証するものではありません。申請前に必ず各制度の公募要領・公式窓口で最新情報をご確認ください。
          </li>
          <li>
            補助金診断の結果は掲載データに基づく目安であり、採択・受給を保証するものではありません。
          </li>
          <li>
            当サイトの情報を利用したことにより生じた損害について、運営者は責任を負いかねます。
          </li>
          <li>
            個人情報・Cookieの取り扱いは
            <Link href="/privacy/">プライバシーポリシー</Link>をご覧ください。
          </li>
        </ul>
      </section>

      <section id="contact" style={{ marginBottom: "2.5rem" }}>
        <h2 className="sub-title section-title">お問い合わせ</h2>
        <p className="card" style={{ fontSize: ".92rem" }}>
          掲載内容の誤りのご指摘、その他のお問い合わせは、運営会社
          <a
            href="https://reload.co.jp"
            target="_blank"
            rel="noopener noreferrer"
          >
            株式会社リロードの公式サイト
          </a>
          よりご連絡ください。個別の補助金の申請要件・審査に関するご質問は、各制度の申請窓口へお問い合わせください。
        </p>
      </section>

      <section style={{ textAlign: "center" }}>
        <Link
          href="/subsidies"
          style={{
            display: "inline-block",
            backgroundColor: "var(--green-dark)",
            color: "#fff",
            textDecoration: "none",
            fontSize: ".95rem",
            fontWeight: "bold",
            padding: ".75rem 1.75rem",
            borderRadius: "8px",
          }}
        >
          補助金一覧を見る →
        </Link>
      </section>
    </div>
  )
}
