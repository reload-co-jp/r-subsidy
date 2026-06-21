"use client"

import { useState, useEffect } from "react"
import type { NormalizedSubsidy, UserProfile, ScoringResult } from "../../lib/types"
import { scoreAndSort } from "../../lib/scoring"
import { matchesPrefecture } from "../../lib/prefectures"
import DiagnosisForm from "./diagnosis-form"
import DiagnosisResult from "./diagnosis-result"
import { STORAGE_KEY } from "./constants"

type Step = "form" | "result"

const DEFAULT_PROFILE: UserProfile = {
  businessType: "corporation",
  prefecture: "東京都",
  industry: "製造業",
  employeeCount: 20,
  purposes: [],
}

export default function DiagnosisClient() {
  const [step, setStep] = useState<Step>("form")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ScoringResult[]>([])
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const p = JSON.parse(saved)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage on mount
      setProfile((prev) => ({
        businessType: p.businessType ?? prev.businessType,
        prefecture: p.prefecture ?? prev.prefecture,
        industry: p.industry ?? prev.industry,
        employeeCount: typeof p.employeeCount === "number" ? p.employeeCount : prev.employeeCount,
        purposes: Array.isArray(p.purposes) ? p.purposes : prev.purposes,
      }))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch (e: unknown) {
      console.error("Failed to save profile", e)
    }
  }, [profile])

  const setBusinessType = (businessType: UserProfile["businessType"]) =>
    setProfile((prev) => ({ ...prev, businessType }))
  const setPrefecture = (prefecture: string) =>
    setProfile((prev) => ({ ...prev, prefecture }))
  const setIndustry = (industry: string) =>
    setProfile((prev) => ({ ...prev, industry }))
  const setEmployeeCount = (employeeCount: number) =>
    setProfile((prev) => ({ ...prev, employeeCount }))
  const togglePurpose = (p: string) =>
    setProfile((prev) => ({
      ...prev,
      purposes: prev.purposes.includes(p)
        ? prev.purposes.filter((x) => x !== p)
        : [...prev.purposes, p],
    }))

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/data/subsidies-master.json")
      if (!res.ok) throw new Error("データを取得できませんでした")
      const subsidies: NormalizedSubsidy[] = await res.json()

      const activeSubsidies = subsidies.filter((subsidy) => {
        if (subsidy.status !== "open" && subsidy.status !== "upcoming") return false
        return matchesPrefecture(subsidy, profile.prefecture)
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
      businessType={profile.businessType}
      setBusinessType={setBusinessType}
      prefecture={profile.prefecture}
      setPrefecture={setPrefecture}
      industry={profile.industry}
      setIndustry={setIndustry}
      employeeCount={profile.employeeCount}
      setEmployeeCount={setEmployeeCount}
      purposes={profile.purposes}
      togglePurpose={togglePurpose}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
    />
  )
}
