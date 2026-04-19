import "./reset.css"
import Link from "next/link"
import type { Metadata } from "next"

const SITE_URL = "https://r-subsidy.reload.co.jp"

export const metadata: Metadata = {
  title: "補助金ポータル | 中小企業・個人事業主向け",
  description: "中小企業・個人事業主向けに、自社属性から補助金を検索・マッチングできる静的ポータルサイト",
  metadataBase: new URL(SITE_URL),
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <body>
        <header
          style={{
            backgroundColor: "#1a1a2e",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            padding: "0 1.5rem",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2rem",
              height: "56px",
            }}
          >
            <Link
              href="/"
              style={{
                color: "#7ec8e3",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: "1rem",
                letterSpacing: "0.02em",
              }}
            >
              補助金ポータル
            </Link>
            <Link href="/subsidies" style={navLinkStyle}>
              補助金一覧
            </Link>
            <Link href="/diagnosis" style={{ ...navLinkStyle, marginLeft: "auto" }}>
              診断スタート →
            </Link>
          </nav>
        </header>
        <main
          style={{
            background: "#16213e",
            minHeight: "calc(100dvh - 56px - 48px)",
            padding: "2rem 1.5rem",
          }}
        >
          {children}
        </main>
        <footer
          style={{
            backgroundColor: "#1a1a2e",
            borderTop: "1px solid #2a2a4a",
            fontSize: ".75rem",
            padding: "1rem 1.5rem",
            color: "#888",
            textAlign: "center",
          }}
        >
          <p>&copy; 補助金ポータル — JグランツAPI連携</p>
        </footer>
      </body>
    </html>
  )
}

const navLinkStyle: React.CSSProperties = {
  color: "#ccc",
  textDecoration: "none",
  fontSize: ".875rem",
}

export default RootLayout
