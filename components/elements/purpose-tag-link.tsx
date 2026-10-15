"use client"

import { useRouter } from "next/navigation"
import { purposeLabel } from "../../lib/format"

// カード（<a>）内に入るため <a> を入れ子にできず、span + role=link で遷移する
export default function PurposeTagLink({ purpose }: { purpose: string }) {
  const router = useRouter()
  const go = (e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/subsidies/purpose/${encodeURIComponent(purpose)}/`)
  }
  return (
    <span
      role="link"
      tabIndex={0}
      className="tag"
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") go(e)
      }}
    >
      {purposeLabel(purpose)}
    </span>
  )
}
