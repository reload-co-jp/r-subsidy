import Link from "next/link"

export default function PurposeTagLink({ purpose }: { purpose: string }) {
  return (
    <Link
      href={`/subsidies/purpose/${encodeURIComponent(purpose)}/`}
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: "var(--bg-tag)",
        color: "#38b48b",
        borderRadius: "4px",
        padding: ".1rem .4rem",
        fontSize: ".75rem",
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      {purpose}
    </Link>
  )
}
