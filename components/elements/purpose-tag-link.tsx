"use client"

import { useRouter } from "next/navigation"

export default function PurposeTagLink({ purpose }: { purpose: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        router.push(`/subsidies?purpose=${encodeURIComponent(purpose)}`)
      }}
      style={{
        backgroundColor: "var(--bg-tag)",
        color: "#38b48b",
        borderRadius: "4px",
        padding: ".1rem .4rem",
        fontSize: ".75rem",
        border: "none",
        cursor: "pointer",
      }}
    >
      {purpose}
    </button>
  )
}
