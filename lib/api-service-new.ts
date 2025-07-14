// API Service for SmartRetail Twin Dashboard

import {
  DashboardData,
  Store,
  KPIData,
  ForecastData,
  CategoryForecast,
  CriticalAction,
  Equipment,
  Truck,
  ApiResponse
} from './types'

// Configuration
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://n8n-oayd.onrender.com/webhook',
  timeout: 30000, // Increased timeout for webhook responses
  retryAttempts: 2, // Reduced retries for webhooks
  retryDelay: 2000,
}

// API Endpoints
const API_ENDPOINTS = {
  health: '/health',
  dashboard: '/dashboard',
  kpis: '/kpis',
  stores: '/stores',
  forecast: '/forecast',
  actions: '/actions',
  equipment: '/equipment',
  trucks: '/trucks',
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Webhook API client for querying data
async function webhookRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`

  for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify({
          context: "smartretail_dashboard",
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }

      const data = await response.json()
      
      // Handle n8n webhook response format
      if (data && typeof data === 'object') {
        // If it's already in the right format, return it
        if ('data' in data && 'success' in data) {
          return data
        }
        // If it's direct data, wrap it in ApiResponse format
        return {
          data: data,
          success: true,
          timestamp: new Date().toISOString()
        } as T
      }

      throw new ApiError('Invalid response format from webhook')

    } catch (error) {
      console.warn(`Webhook request attempt ${attempt} failed:`, error)
      
      if (attempt === API_CONFIG.retryAttempts) {
        // On final attempt, return fallback response for health check
        if (endpoint === API_ENDPOINTS.health) {
          return {
            data: { status: "error" },
            success: false,
            timestamp: new Date().toISOString()
          } as T
        }
        throw new ApiError(
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * attempt))
    }
  }
  
  throw new ApiError('Max retry attempts exceeded')
}

// API Service Class using n8n Webhooks
export class DashboardApiService {
  // Cache for dashboard data to avoid multiple requests
  private static dashboardCache: { data: DashboardData | null; timestamp: number } = { data: null, timestamp: 0 }
  private static readonly CACHE_DURATION = 30000 // 30 seconds cache

  // Get complete dashboard data
  static async getDashboardData(): Promise<DashboardData> {
    // Check cache first
    const now = Date.now()
    if (this.dashboardCache.data && (now - this.dashboardCache.timestamp) < this.CACHE_DURATION) {
      console.log('Using cached dashboard data')
      return this.dashboardCache.data
    }

    try {
      const response = await webhookRequest<ApiResponse<DashboardData>>(API_ENDPOINTS.dashboard)
      
      if (response.success && response.data) {
        // Cache the successful response
        this.dashboardCache = { data: response.data, timestamp: now }
        return response.data
      }
      
      throw new Error('Invalid dashboard response')
    } catch (error) {
      console.warn('Dashboard API failed, using fallback data:', error)
      const fallbackData = this.getFallbackDashboardData()
      this.dashboardCache = { data: fallbackData, timestamp: now }
      return fallbackData
    }
  }

  // Get stores data
  static async getStores(): Promise<Store[]> {
    try {
      const response = await webhookRequest<ApiResponse<Store[]>>(API_ENDPOINTS.stores)
      return response.success ? response.data : []
    } catch (error) {
      console.warn('Stores API failed, using fallback:', error)
      const fallbackData = this.getFallbackDashboardData()
      return fallbackData.stores
    }
  }

  // Get KPI data
  static async getKPIs(): Promise<KPIData[]> {
    try {
      const response = await webhookRequest<ApiResponse<KPIData[]>>(API_ENDPOINTS.kpis)
      return response.success ? response.data : []
    } catch (error) {
      console.warn('KPIs API failed, using fallback:', error)
      const fallbackData = this.getFallbackDashboardData()
      return fallbackData.kpis
    }
  }
  
  // Get forecast data
  static async getForecastData(): Promise<ForecastData[]> {
    try {
      const response = await webhookRequest<ApiResponse<ForecastData[]>>(API_ENDPOINTS.forecast)
      return response.success ? response.data : []
    } catch (error) {
      console.warn('Forecast API failed, using fallback:', error)
      const fallbackData = this.getFallbackDashboardData()
      return fallbackData.forecastData
    }
  }

  // Get category forecasts
  static async getCategoryForecasts(): Promise<CategoryForecast[]> {
    try {
      const response = await webhookRequest<ApiResponse<CategoryForecast[]>>(`${API_ENDPOINTS.forecast}/categories`)
      return response.success ? response.data : []
    } catch (error) {
      console.warn('Category forecasts API failed, using fallback:', error)
      const fallbackData = this.getFallbackDashboardData()
      return fallbackData.categoryForecasts
    }
  }

  // Get critical actions
  static async getCriticalActions(): Promise<CriticalAction[]> {
    try {
      const response = await webhookRequest<ApiResponse<CriticalAction[]>>(API_ENDPOINTS.actions)
      return response.success ? response.data : []
    } catch (error) {
      console.warn('Actions API failed, using fallback:', error)
      const fallbackData = this.getFallbackDashboardData()
      return fallbackData.criticalActions
    }
  }

  // Get equipment data
  static async getEquipment(): Promise<Equipment[]> {
    try {
      const response = await webhookRequest<ApiResponse<Equipment[]>>(API_ENDPOINTS.equipment)
      return response.success ? response.data : []
    } catch (error) {
      console.warn('Equipment API failed, using fallback:', error)
      const fallbackData = this.getFallbackDashboardData()
      return fallbackData.equipment
    }
  }

  // Get truck data
  static async getTrucks(): Promise<Truck[]> {
    try {
      const response = await webhookRequest<ApiResponse<Truck[]>>(API_ENDPOINTS.trucks)
      return response.success ? response.data : []
    } catch (error) {
      console.warn('Trucks API failed, using fallback:', error)
      const fallbackData = this.getFallbackDashboardData()
      return fallbackData.trucks
    }
  }

  // Get specific store data
  static async getStore(storeId: string): Promise<Store> {
    try {
      const response = await webhookRequest<ApiResponse<Store>>(`${API_ENDPOINTS.stores}/${storeId}`)
      return response.success ? response.data : this.getFallbackDashboardData().stores[0]
    } catch (error) {
      console.warn(`Store ${storeId} API failed, using fallback:`, error)
      return this.getFallbackDashboardData().stores[0]
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await webhookRequest<ApiResponse<{ status: string }>>(API_ENDPOINTS.health)
      return response.success && response.data.status === 'ok'
    } catch {
      return false
    }
  }

  // Fallback data method
  private static getFallbackDashboardData(): DashboardData {
    return {
      kpis: [
        { title: "SKUs in Danger Zone", value: "1", total: "3", percentage: 33, type: "ring" as const, color: "text-red-600", bgColor: "bg-red-50" },
        { title: "Fill Rate vs Forecast", value: "63.3%", change: "-6.7%", trend: "down" as const, type: "sparkline" as const, color: "text-orange-600", bgColor: "bg-orange-50" },
        { title: "Urgent Alerts", value: "1", type: "badge" as const, color: "text-orange-600", bgColor: "bg-orange-50" },
        { title: "Avg Restock Lead Time", value: "2.1", unit: "days", change: "+0.4", type: "metric" as const, color: "text-blue-600", bgColor: "bg-blue-50" },
        { title: "Forecast Confidence", value: "78%", type: "metric" as const, color: "text-purple-600", bgColor: "bg-purple-50" }
      ],
      stores: [
        {
          id: "1", name: "Store #001 - Koramangala", type: "dark" as const, status: "warning" as const, demand: 78, stock: 45,
          lat: 12.9352, lng: 77.6245, address: "Koramangala, Bangalore", manager: "Rajesh Kumar",
          categories: { 
            electronics: { stock: 70, demand: 85, trend: "up" as const }, 
            groceries: { stock: 40, demand: 92, trend: "up" as const }, 
            apparel: { stock: 80, demand: 65, trend: "stable" as const },
            pharmacy: { stock: 60, demand: 70, trend: "stable" as const }
          },
          alerts: [{ type: "warning" as const, message: "Water bottles running low", time: "15 min ago" }]
        }
      ],
      forecastData: [
        { day: "Mon", date: "Dec 18", electronics: 85, groceries: 45, apparel: 120, pharmacy: 60, weather: "sunny", events: [], temperature: 28 },
        { day: "Tue", date: "Dec 19", electronics: 25, groceries: 15, apparel: 180, pharmacy: 80, weather: "rainy", events: ["Monsoon Alert"], temperature: 24 }
      ],
      categoryForecasts: [
        { category: "electronics", current: 85, forecast: 92, confidence: 78, trend: "up" as const },
        { category: "groceries", current: 45, forecast: 38, confidence: 85, trend: "down" as const }
      ],
      criticalActions: [
        { 
          id: 1, 
          title: "Restock Water Bottles", 
          impact: 85, 
          urgency: 90, 
          score: 87, 
          category: "restock" as const, 
          description: "Water bottles critically low across stores", 
          confidence: 95, 
          dataInputs: ["Stock levels", "Weather trends"], 
          actions: [{ label: "Order Now", type: "primary" as const, icon: "shopping-cart" }] 
        }
      ],
      equipment: [
        { id: 1, name: "Cooler Unit A1", type: "cooler" as const, health: 85, status: "good" as const, temp: "4°C", lastMaintenance: "2 days ago" }
      ],
      trucks: [
        { id: 1, route: "Bangalore-Koramangala", eta: "2:30 PM", delay: 15, risk: "low" as const, cargo: "Sports equipment" }
      ],
      lastUpdated: new Date().toISOString()
    }
  }

  // Clear cache to force fresh data on next request
  static clearCache(): void {
    this.dashboardCache = { data: null, timestamp: 0 }
    console.log('Dashboard cache cleared')
  }

  // Get cache status
  static getCacheStatus(): { cached: boolean; age: number } {
    const now = Date.now()
    const age = now - this.dashboardCache.timestamp
    return {
      cached: this.dashboardCache.data !== null && age < this.CACHE_DURATION,
      age: age
    }
  }
}

// Export the API error class for error handling
export { ApiError }

// Export configuration for customization
export { API_CONFIG }

// Export endpoints for reference
export { API_ENDPOINTS }
