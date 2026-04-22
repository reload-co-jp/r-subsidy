// JGrants API raw types
export type JGrantsListResponse = {
  metadata?: {
    type?: string
    resultset?: {
      count?: number
      total_count?: number
    }
  }
  result:
    | {
        metadata: {
          total_count: number
          count: number
        }
        subsidies: JGrantsListItem[]
      }
    | JGrantsListItem[]
}

export type JGrantsListItem = {
  id: string
  title: string
  name?: string
  institution_name?: string
  subtitle?: string
  acceptance_status?: string
  prefecture?: string[]
  industry_type?: string[]
  start_date?: string
  end_date?: string
  target_number_of_employees?: string
  target_area_search?: string
  subsidy_max_limit?: number
  acceptance_start_datetime?: string
  acceptance_end_datetime?: string
}

export type JGrantsDetailResponse = {
  metadata?: {
    type?: string
    resultset?: {
      count?: number
    }
  }
  result: JGrantsDetail | JGrantsDetail[]
}

export type JGrantsDetail = {
  id: string
  title: string
  name?: string
  subsidy_catch_phrase?: string
  detail?: string
  use_purpose?: string
  industry?: string
  target_area_search?: string
  target_area_detail?: string
  target_number_of_employees?: string
  subsidy_rate?: string
  subsidy_max_limit?: number
  subsidy_min_limit?: number
  acceptance_start_datetime?: string
  acceptance_end_datetime?: string
  project_end_deadline?: string
  request_reception_presence?: string
  is_enable_multiple_request?: boolean
  front_subsidy_detail_page_url?: string
  institution_name?: string
  granttype?: string
  subtitle?: string
  acceptance_status?: string
  subsidy_detail?: {
    overview?: string
    detail?: string
    subsidized_rate?: string
    upper_limit?: string
    lower_limit?: string
    reference_url?: string
  }
  target?: {
    prefecture?: string[]
    industry_type?: string[]
    target_number_of_employees?: string
    target_type?: string[]
  }
  acceptance_period_list?: {
    start_date?: string
    end_date?: string
    workflow?: string
  }[]
  contact_to?: {
    name?: string
    phone?: string
    email?: string
    url?: string
  }[]
  workflow?: {
    id?: string
    target_area_search?: string
    target_area_detail?: string
    fiscal_year_round?: string
    acceptance_start_datetime?: string
    acceptance_end_datetime?: string
    project_end_deadline?: string
  }[]
  updated_date?: string
}

// Normalized types
export type Region = 'national' | 'tokyo' | 'prefecture'
export type Status = 'open' | 'upcoming' | 'closed' | 'unknown'
export type Source = 'jgrants' | 'tokyo' | 'manual'

export type NormalizedSubsidy = {
  id: string
  slug: string
  title: string
  overview: string
  detail: string
  region: Region
  prefectures: string[]
  industries: string[]
  employeeMin: number | null
  employeeMax: number | null
  purposes: string[]
  status: Status
  workflow: string | null
  subsidizedRate: string | null
  upperLimit: string | null
  lowerLimit: string | null
  startDate: string | null
  endDate: string | null
  source: Source
  referenceUrl: string | null
  updatedAt: string
}

export type NormalizedSubsidyWithRaw = NormalizedSubsidy & {
  raw: unknown
}

// User profile for diagnosis
export type BusinessType = 'corporation' | 'sole_proprietor'

export type UserProfile = {
  businessType: BusinessType
  prefecture: string
  industry: string
  employeeCount: number
  purposes: string[]
}

// Scoring
export type ScoreBreakdown = {
  region: number
  industry: number
  employee: number
  purpose: number
  status: number
  tokyoBonus: number
}

export type Tier = 'strong' | 'match' | 'check'

export type ScoringResult = {
  subsidy: NormalizedSubsidy
  score: number
  tier: Tier
  breakdown: ScoreBreakdown
}

// JSON output types
export type SubsidyIndexItem = {
  id: string
  slug: string
  title: string
  region: Region
  prefectures: string[]
  status: Status
  industries: string[]
  purposes: string[]
  upperLimit: string | null
  source: Source
  updatedAt: string
}

export type UpdateHistory = {
  lastUpdated: string
  totalCount: number
  sources: {
    jgrants: number
    national: number
    tokyo: number
    manual: number
  }
}
