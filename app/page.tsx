"use client"

import { useState, useCallback } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { KPIBar } from "@/components/kpi-bar"
import { GeoMapSection } from "@/components/geo-map-section"
import { WarRoomPanel } from "@/components/war-room-panel"
import { ForecastTimeline } from "@/components/forecast-timeline"
import { MaintenanceWidget } from "@/components/maintenance-widget"
import { OpsChat } from "@/components/ops-chat"
import { SettingsPanel } from "@/components/settings-panel"
import { StoreMapPage } from "@/components/pages/store-map-page"
import { WarRoomPage } from "@/components/pages/war-room-page"
import { ForecastingPage } from "@/components/pages/forecasting-page"
import { WebhookTest } from "@/components/webhook-test"

export default function Dashboard() {
  const [activeView, setActiveView] = useState("overview")
  const [darkMode, setDarkMode] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleGlobalRefresh = useCallback(async () => {
    setIsRefreshing(true)
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Force refresh by triggering a page reload or custom refresh logic
    window.location.reload()
  }, [])

  const renderContent = () => {
    switch (activeView) {
      case "map":
        return <StoreMapPage />
      case "warroom":
        return <WarRoomPage />
      case "forecast":
        return <ForecastingPage />
      case "settings":
        return (
          <div className="space-y-6">
            <KPIBar />
            <SettingsPanel />
            <WebhookTest />
          </div>
        )
      default:
        return (
          <>
            {/* Hero KPI Bar */}
            <KPIBar />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Left Column - Map and Forecast */}
              <div className="xl:col-span-3 space-y-6">
                <GeoMapSection />
                <ForecastTimeline />
              </div>

              {/* Right Column - War Room */}
              <div className="xl:col-span-1">
                <WarRoomPanel />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MaintenanceWidget />
            </div>

            {/* Ops Chat - Always at bottom */}
            <OpsChat />
          </>
        )
    }
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <SidebarProvider defaultOpen={true}>
        <DashboardSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <SidebarInset>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            <DashboardHeader
              onRefresh={handleGlobalRefresh}
              isRefreshing={isRefreshing}
            />
            <main className="p-4 space-y-6">{renderContent()}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
