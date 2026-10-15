import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "../../components/elements/breadcrumb"
import { OPERATOR_NAME, SITE_NAME, absoluteUrl } from "../../lib/site"

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${SITE_NAME}におけるアクセス解析（Google アナリティクス）、Cookie、補助金診断の入力情報の取り扱いについて説明します。`,
  alternates: {
    canonical: absoluteUrl("/privacy/"),
  },
}

// ponytail: サイトの実装で確認できる事実のみ記載。会社としての正式なポリシーがあれば差し替える
export default function PrivacyPage() {
  return (
    <div className="page-content" style={{ maxWidth: "860px" }}>
      <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: "プライバシーポリシー" }]} />
      <h1 className="page-title">プライバシーポリシー</h1>
      <p style={{ marginBottom: "2rem" }}>
        {OPERATOR_NAME}（以下「運営者」）は、{SITE_NAME}（以下「本サイト」）における利用者情報を以下のとおり取り扱います。
      </p>
      <div style={{ display: "grid", gap: "1.75rem" }}>
        <section>
          <h2 style={{ fontSize: "1.15rem", marginBottom: ".5rem" }}>1. アクセス解析ツールについて</h2>
          <p>
            本サイトでは、利用状況の把握とサイト改善のため、Google LLC の提供する Google
            アナリティクスを利用しています。Google アナリティクスは Cookie
            を使用して、個人を特定しない形で閲覧ページ・利用環境などの情報を収集します。収集・処理の方法は
            <a href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank" rel="noopener noreferrer">
              Google のサービスを使用するサイトやアプリから収集した情報の Google による使用
            </a>
            をご覧ください。Cookie はブラウザの設定で無効にできます。
          </p>
        </section>
        <section>
          <h2 style={{ fontSize: "1.15rem", marginBottom: ".5rem" }}>2. 補助金診断の入力情報について</h2>
          <p>
            補助金診断で入力した事業形態・所在地・業種・従業員数などは、診断結果の表示と再訪時の入力補助のため、利用者のブラウザ内（localStorage）にのみ保存されます。本サイトのサーバーへ送信・保存されることはありません。ブラウザのサイトデータを削除すると消去されます。
          </p>
        </section>
        <section>
          <h2 style={{ fontSize: "1.15rem", marginBottom: ".5rem" }}>3. 外部サイトへのリンク</h2>
          <p>本サイトから移動した外部サイト（公的機関の公式ページなど）における情報の取り扱いは、各サイトの方針に従います。</p>
        </section>
        <section>
          <h2 style={{ fontSize: "1.15rem", marginBottom: ".5rem" }}>4. お問い合わせ・改定</h2>
          <p>
            本ポリシーに関するお問い合わせは<Link href="/about/#contact">運営者情報</Link>
            の連絡先までお願いします。本ポリシーは必要に応じて改定し、本ページで公表します。
          </p>
        </section>
      </div>
    </div>
  )
}
