import { FC } from "react"
import Link from "next/link"

type Item = { label: string; href?: string }

export const Breadcrumb: FC<{ items: Item[] }> = ({ items }) => (
  <nav
    aria-label="パンくずリスト"
    style={{
      display: "flex",
      gap: ".4rem",
      alignItems: "center",
      flexWrap: "wrap",
      fontSize: ".8rem",
      color: "var(--text-muted)",
      marginBottom: "1.25rem",
    }}
  >
    {items.map((item, i) => (
      <span key={i} style={{ display: "flex", gap: ".4rem", alignItems: "center" }}>
        {i > 0 && <span>›</span>}
        {item.href ? (
          <Link href={item.href} style={{ color: "#38b48b", textDecoration: "none" }}>
            {item.label}
          </Link>
        ) : (
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "280px",
              color: "var(--text-base)",
            }}
            title={item.label}
          >
            {item.label}
          </span>
        )}
      </span>
    ))}
  </nav>
)
