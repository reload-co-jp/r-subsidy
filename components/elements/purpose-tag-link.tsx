"use client"

import { useRouter } from "next/navigation"

export default function PurposeTagLink({ purpose }: { purpose: string }) {
  const router = useRouter()
  return (
    <span
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        router.push(`/subsidies/purpose/${encodeURIComponent(purpose)}/`)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation()
          router.push(`/subsidies/purpose/${encodeURIComponent(purpose)}/`)
        }
      }}
      style={{
        backgroundColor: "var(--bg-tag)",
        color: "#38b48b",
        borderRadius: "4px",
        padding: ".1rem .4rem",
        fontSize: ".75rem",
        textDecoration: "none",
        display: "inline-block",
        cursor: "pointer",
      }}
    >
      {purpose}
    </span>
  )
}
