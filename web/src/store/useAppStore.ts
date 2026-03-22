'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BusinessProfile, AIAnalysis, MonitorScanResult, LeadAlert, SavedLead, AudienceResult, PlanId } from '@/lib/types'

interface AppState {
  businessProfile: BusinessProfile | null
  aiAnalysis: AIAnalysis | null
  isAnalyzing: boolean
  analysisStage: string
  isOnboarded: boolean
  monitorResults: MonitorScanResult | null
  isScanning: boolean
  savedLeads: SavedLead[]
  audienceResult: AudienceResult | null
  audienceScansToday: number
  lastAudienceScanDate: string | null
  monitorScansToday: number
  lastMonitorScanDate: string | null
  planId: PlanId
  stripeCustomerId: string | null

  setBusinessProfile: (p: BusinessProfile) => void
  setAIAnalysis: (a: AIAnalysis) => void
  setOnboarded: (v: boolean) => void
  setAnalyzing: (v: boolean) => void
  setStage: (s: string) => void
  setMonitorResults: (r: MonitorScanResult) => void
  setScanning: (v: boolean) => void
  saveLead: (alert: LeadAlert) => void
  removeLead: (alertId: string) => void
  updateLeadStage: (alertId: string, stage: SavedLead['stage']) => void
  addLeadNote: (alertId: string, text: string) => void
  setAudienceResult: (r: AudienceResult) => void
  recordAudienceScan: () => void
  recordMonitorScan: () => void
  setPlan: (planId: PlanId, customerId?: string) => void
  reset: () => void
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      businessProfile: null, aiAnalysis: null, isAnalyzing: false, analysisStage: '',
      isOnboarded: false, monitorResults: null, isScanning: false, savedLeads: [],
      audienceResult: null, audienceScansToday: 0, lastAudienceScanDate: null,
      monitorScansToday: 0, lastMonitorScanDate: null,
      planId: 'free', stripeCustomerId: null,

      setBusinessProfile: (p) => set({ businessProfile: p }),
      setAIAnalysis: (a) => set({ aiAnalysis: a }),
      setOnboarded: (v) => set({ isOnboarded: v }),
      setAnalyzing: (v) => set({ isAnalyzing: v }),
      setStage: (s) => set({ analysisStage: s }),
      setMonitorResults: (r) => set({ monitorResults: r }),
      setScanning: (v) => set({ isScanning: v }),
      saveLead: (alert) => {
        const existing = get().savedLeads.find(l => l.alertId === alert.id)
        if (existing) return
        const lead: SavedLead = {
          id: `sl-${Date.now()}`, alertId: alert.id, alert, stage: 'new',
          notes: [], estimatedValue: null,
          savedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        }
        set(s => ({ savedLeads: [lead, ...s.savedLeads] }))
      },
      removeLead: (alertId) => set(s => ({ savedLeads: s.savedLeads.filter(l => l.alertId !== alertId) })),
      updateLeadStage: (alertId, stage) => set(s => ({
        savedLeads: s.savedLeads.map(l => l.alertId === alertId ? { ...l, stage, updatedAt: new Date().toISOString() } : l)
      })),
      addLeadNote: (alertId, text) => set(s => ({
        savedLeads: s.savedLeads.map(l => l.alertId === alertId
          ? { ...l, notes: [...l.notes, { id: `n-${Date.now()}`, text, createdAt: new Date().toISOString() }], updatedAt: new Date().toISOString() }
          : l)
      })),
      setAudienceResult: (r) => set({ audienceResult: r }),
      recordAudienceScan: () => {
        const today = new Date().toISOString().slice(0, 10)
        const { lastAudienceScanDate, audienceScansToday } = get()
        const count = lastAudienceScanDate === today ? audienceScansToday + 1 : 1
        set({ audienceScansToday: count, lastAudienceScanDate: today })
      },
      recordMonitorScan: () => {
        const today = new Date().toISOString().slice(0, 10)
        const { lastMonitorScanDate, monitorScansToday } = get()
        const count = lastMonitorScanDate === today ? monitorScansToday + 1 : 1
        set({ monitorScansToday: count, lastMonitorScanDate: today })
      },
      setPlan: (planId, customerId) => set({ planId, ...(customerId ? { stripeCustomerId: customerId } : {}) }),
      reset: () => set({ businessProfile: null, aiAnalysis: null, isAnalyzing: false, analysisStage: '', isOnboarded: false, monitorResults: null, isScanning: false, savedLeads: [], audienceResult: null }),
    }),
    { name: 'lesead-app' }
  )
)

export default useAppStore
