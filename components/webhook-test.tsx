"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Activity, Database, BarChart3, MapPin, TrendingUp, AlertTriangle, Settings, Truck } from "lucide-react"
import { DashboardApiService, API_ENDPOINTS } from "@/lib/api-service"

export function WebhookTest() {
  const [cacheStatus, setCacheStatus] = useState<{cached: boolean; age: number} | null>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const endpoints = [
    { key: 'health', name: 'Health Check', icon: Activity, endpoint: API_ENDPOINTS.health },
    { key: 'kpis', name: 'KPIs', icon: BarChart3, endpoint: API_ENDPOINTS.kpis },
    { key: 'stores', name: 'Stores', icon: MapPin, endpoint: API_ENDPOINTS.stores },
    { key: 'forecast', name: 'Forecast', icon: TrendingUp, endpoint: API_ENDPOINTS.forecast },
    { key: 'actions', name: 'Actions', icon: AlertTriangle, endpoint: API_ENDPOINTS.actions },
    { key: 'equipment', name: 'Equipment', icon: Settings, endpoint: API_ENDPOINTS.equipment },
    { key: 'trucks', name: 'Trucks', icon: Truck, endpoint: API_ENDPOINTS.trucks },
    { key: 'dashboard', name: 'Dashboard', icon: Database, endpoint: API_ENDPOINTS.dashboard },
  ]

  const testEndpoint = async (key: string, endpoint: string) => {
    setLoading(prev => ({ ...prev, [key]: true }))
    setErrors(prev => ({ ...prev, [key]: '' }))
    setResponses(prev => ({ ...prev, [key]: null }))

    try {
      // Direct webhook call to test the endpoint
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://n8n-oayd.onrender.com/webhook'
      const url = `${baseUrl}${endpoint}`

      const result = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: 'smartretail_dashboard',
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!result.ok) {
        throw new Error(`HTTP ${result.status}: ${result.statusText}`)
      }

      const data = await result.json()
      setResponses(prev => ({ ...prev, [key]: data }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setErrors(prev => ({ ...prev, [key]: errorMessage }))
      console.error(`Webhook test failed for ${key}:`, error)
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const testAllEndpoints = async () => {
    for (const { key, endpoint } of endpoints) {
      await testEndpoint(key, endpoint)
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const clearCache = () => {
    DashboardApiService.clearCache()
    const status = DashboardApiService.getCacheStatus()
    setCacheStatus(status)
  }

  const checkCache = () => {
    const status = DashboardApiService.getCacheStatus()
    setCacheStatus(status)
  }

  const getStatusBadge = (key: string) => {
    if (loading[key]) {
      return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Testing</Badge>
    }
    if (errors[key]) {
      return <Badge variant="destructive">Error</Badge>
    }
    if (responses[key]) {
      const response = responses[key]
      if (response.success) {
        return <Badge variant="default" className="bg-green-600">Success</Badge>
      } else {
        return <Badge variant="destructive">Failed</Badge>
      }
    }
    return <Badge variant="outline">Not tested</Badge>
  }

  const formatResponse = (data: any) => {
    if (!data) return "No response"
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            n8n Webhook API Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testAllEndpoints} className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Test All Endpoints
            </Button>
            <Button onClick={checkCache} variant="outline">
              Check Cache Status
            </Button>
            <Button onClick={clearCache} variant="outline">
              Clear Cache
            </Button>
          </div>

          {cacheStatus && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-sm">
                <strong>Cache Status:</strong> {cacheStatus.cached ? 'Active' : 'Empty'} 
                {cacheStatus.cached && ` (${Math.round(cacheStatus.age / 1000)}s old)`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {endpoints.map(({ key, name, icon: Icon, endpoint }) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {name}
                </div>
                {getStatusBadge(key)}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{endpoint}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => testEndpoint(key, endpoint)} 
                disabled={loading[key]}
                size="sm"
                className="w-full"
              >
                {loading[key] ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <Activity className="h-3 w-3 mr-2" />
                )}
                Test {name}
              </Button>

              {errors[key] && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                  <strong>Error:</strong> {errors[key]}
                </div>
              )}

              {responses[key] && (
                <div className="space-y-2">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                    <div className="text-xs text-green-700 dark:text-green-300">
                      <strong>Status:</strong> {responses[key].success ? 'Success' : 'Failed'}
                      {responses[key].timestamp && (
                        <span className="ml-2">
                          <strong>Time:</strong> {new Date(responses[key].timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    {responses[key].data && (
                      <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                        <strong>Data:</strong> {Array.isArray(responses[key].data) ? `${responses[key].data.length} items` : typeof responses[key].data}
                      </div>
                    )}
                  </div>
                  
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Raw Response
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded overflow-auto max-h-32 whitespace-pre-wrap">
                      {formatResponse(responses[key])}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
