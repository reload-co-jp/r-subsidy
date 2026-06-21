"use client"

import { useState, useEffect } from "react"
import type { NormalizedSubsidy, UserProfile, ScoringResult } from "../../lib/types"
import { scoreAndSort } from "../../lib/scoring"
import { matchesPrefecture } from "../../lib/prefectures"
import DiagnosisForm from "./diagnosis-form"
import DiagnosisResult from "./diagnosis-result"
import { STORAGE_KEY } from "./constants"

type Step = "form" | "result"

export default function DiagnosisClient() {
  const [step, setStep] = useState<Step>("form")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ScoringResult[]>([])

  const [businessType, setBusinessType] = useState<UserProfile["businessType"]>("corporation")
  const [prefecture, setPrefecture] = useState("東京都")
  const [industry, setIndustry] = useState("製造業")
  const [employeeCount, setEmployeeCount] = useState<number>(20)
  const [purposes, setPurposes] = useState<string[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const p = JSON.parse(saved)
        if (p.businessType) setBusinessType(p.businessType)
        if (p.prefecture) setPrefecture(p.prefecture)
        if (p.industry) setIndustry(p.industry)
        if (typeof p.employeeCount === "number") setEmployeeCount(p.employeeCount)
        if (Array.isArray(p.purposes)) setPurposes(p.purposes)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ businessType, prefecture, industry, employeeCount, purposes })
      )
    } catch (e: unknown) {
      console.error("Failed to save profile", e)
    }
  }, [businessType, prefecture, industry, employeeCount, purposes])

  const togglePurpose = (p: string) => {
    setPurposes((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/data/subsidies-master.json")
      if (!res.ok) throw new Error("データを取得できませんでした")
      const subsidies: NormalizedSubsidy[] = await res.json()

      const profile: UserProfile = {
        businessType,
        prefecture,
        industry,
        employeeCount,
        purposes,
      }
      const activeSubsidies = subsidies.filter((subsidy) => {
        if (subsidy.status !== "open" && subsidy.status !== "upcoming") return false
        return matchesPrefecture(subsidy, prefecture)
      })
      const scored = scoreAndSort(activeSubsidies, profile)
      setResults(scored)
      setStep("result")
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  if (step === "result") {
    return <DiagnosisResult results={results} onReset={() => setStep("form")} />
  }

  return (
    <DiagnosisForm
      businessType={businessType}
      setBusinessType={setBusinessType}
      prefecture={prefecture}
      setPrefecture={setPrefecture}
      industry={industry}
      setIndustry={setIndustry}
      employeeCount={employeeCount}
      setEmployeeCount={setEmployeeCount}
      purposes={purposes}
      togglePurpose={togglePurpose}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
    />
  )
}
