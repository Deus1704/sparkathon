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
import {
  parseJsonFromResponse,
  validateKPISchema,
  validateStoreSchema,
  validateForecastSchema,
  buildSchemaPrompt,
  KPI_SCHEMA,
  STORE_SCHEMA,
  FORECAST_SCHEMA
} from './schema-parser'

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

// Chatbot API client for querying data
async function chatbotRequest<T>(
  prompt: string,
  options: RequestInit = {}
): Promise<T> {
  const url = API_CONFIG.baseUrl

  for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

      const response = await fetch(url, {
        method: 'POST',
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify({
          prompt: prompt,
          // Add any additional parameters your chatbot expects
          format: 'json',
          context: 'smartretail_dashboard'
        })
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }

      const data = await response.json()

      // Try to parse the response - it might be text that needs parsing
      if (typeof data === 'string') {
        try {
          return JSON.parse(data)
        } catch {
          // If it's not JSON, wrap it in a response format
          return { data: data, success: true, timestamp: new Date().toISOString() }
        }
      }

      return data
      
    } catch (error) {
      if (attempt === API_CONFIG.retryAttempts) {
        if (error instanceof ApiError) {
          throw error
        }
        throw new ApiError(
          `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * attempt))
    }
  }
  
  throw new ApiError('Max retry attempts exceeded')
}

// API Service Class using Chatbot
export class DashboardApiService {
  // Cache for dashboard data to avoid multiple requests
  private static dashboardCache: { data: DashboardData | null; timestamp: number } = { data: null, timestamp: 0 }
  private static readonly CACHE_DURATION = 30000 // 30 seconds cache

  // Single comprehensive request for all dashboard data
  static async getDashboardData(): Promise<DashboardData> {
    // Check cache first
    const now = Date.now()
    if (this.dashboardCache.data && (now - this.dashboardCache.timestamp) < this.CACHE_DURATION) {
      console.log('Using cached dashboard data')
      return this.dashboardCache.data
    }
    const prompt = `I need comprehensive retail dashboard data for SmartRetail Twin Dashboard. Please analyze the current situation and provide actionable insights.

CURRENT CONTEXT:
- Product Catalogue: Cricket bat (70% stock), Water Bottle (40% stock), Umbrella (80% stock)
- Location: Bangalore retail network
- Current trending topics and weather affecting demand
- Operational challenges and opportunities

ANALYSIS NEEDED:

1. KEY PERFORMANCE INDICATORS
   - How many products are in danger zone (below 50% stock)?
   - Overall fill rate vs forecast performance
   - Number of urgent alerts requiring attention
   - Average restock lead time
   - Forecast confidence based on current trends

2. STORE NETWORK STATUS
   - 3-4 Bangalore store locations with realistic coordinates
   - Current stock levels and demand patterns
   - Store operational status and alerts
   - Weather impact on each location
   - Manager information and category performance

3. SALES FORECASTING
   - 7-day sales forecast by product category
   - Weather impact (especially rain affecting umbrella/water bottle sales)
   - Special events and seasonal factors
   - Temperature and weather conditions

4. CRITICAL ACTIONS
   - Urgent restock recommendations with priority scores
   - Weather-related preparations needed
   - High-impact operational decisions
   - Confidence levels and supporting data

5. EQUIPMENT & LOGISTICS
   - Equipment health status (coolers, conveyors, etc.)
   - Delivery truck status and estimated arrival times
   - Maintenance schedules and risk assessments
   - Operational efficiency metrics

Please analyze the trending topics, weather patterns, and stock levels to provide realistic, actionable insights. Focus especially on how Bangalore weather trends (particularly rain) affect product demand.

Provide your comprehensive analysis as structured data that can power a real-time dashboard.`

    const response = await chatbotRequest<any>(prompt)

    // Parse the comprehensive response
    let parsed = null
    if (typeof response === 'string') {
      parsed = parseJsonFromString(response)
    } else if (Array.isArray(response) && response[0]?.output) {
      parsed = parseJsonFromString(response[0].output)
    } else {
      parsed = parseJsonFromResponse(response)
    }

    // Handle flexible response formats - if we get any useful data, try to use it
    if (parsed && typeof parsed === 'object') {
      // If we have some data but missing required fields, enhance it
      if (!parsed.kpis || !parsed.stores) {
        console.log('Enhancing incomplete response with fallback data')
        const fallback = this.getFallbackDashboardData()
        parsed = {
          ...fallback,
          ...parsed,
          kpis: parsed.kpis || fallback.kpis,
          stores: parsed.stores || fallback.stores,
          lastUpdated: new Date().toISOString()
        }
      }

      // Cache the successful response
      this.dashboardCache = { data: parsed as DashboardData, timestamp: now }
      return parsed as DashboardData
    }

    console.warn('Could not parse dashboard data, using fallback. Response type:', typeof response)

    // Return fallback data if parsing fails
    const fallbackData = this.getFallbackDashboardData()
    this.dashboardCache = { data: fallbackData, timestamp: now }
    return fallbackData
  }

  // Fallback data method
  private static getFallbackDashboardData(): DashboardData {
    return {
      kpis: [
        { title: "SKUs in Danger Zone", value: "1", total: "3", percentage: 33, type: "ring" as const, color: "text-red-600", bgColor: "bg-red-50" },
        { title: "Fill Rate vs Forecast", value: "63.3%", change: "-6.7%", trend: "down" as const, type: "sparkline" as const, color: "text-orange-600", bgColor: "bg-orange-50" },
        { title: "Urgent Alerts", value: "1", type: "badge" as const, color: "text-orange-600", bgColor: "bg-orange-50" },
        { title: "Avg Restock Lead Time", value: "2.1", unit: "days", change: "+0.4", type: "metric" as const, color: "text-blue-600", bgColor: "bg-blue-50" },
        { title: "Forecast Confidence", value: "78%", type: "percentage" as const, color: "text-purple-600", bgColor: "bg-purple-50" }
      ],
      stores: [
        {
          id: "1", name: "Store #001 - Koramangala", type: "dark" as const, status: "warning" as const, demand: 78, stock: 45,
          lat: 12.9352, lng: 77.6245, address: "Koramangala, Bangalore", manager: "Rajesh Kumar",
          categories: { sports: { stock: 70, demand: 85, trend: "up" as const }, travel: { stock: 40, demand: 92, trend: "up" as const }, essentials: { stock: 80, demand: 65, trend: "stable" as const } },
          alerts: [{ type: "warning" as const, message: "Water bottles running low", time: "15 min ago" }]
        }
      ],
      forecastData: [
        { day: "Mon", date: "Dec 18", sports: 85, travel: 45, essentials: 120, weather: "sunny", events: [], temperature: 28 },
        { day: "Tue", date: "Dec 19", sports: 25, travel: 15, essentials: 180, weather: "rainy", events: ["Monsoon Alert"], temperature: 24 }
      ],
      categoryForecasts: [],
      criticalActions: [
        { id: 1, title: "Restock Water Bottles", impact: 85, urgency: 90, score: 87, category: "restock" as const, description: "Water bottles critically low", confidence: 95, dataInputs: ["Stock levels"], actions: [{ label: "Order Now", type: "primary" as const, icon: null }] }
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

  // Get stores data from comprehensive dashboard data
  static async getStores(): Promise<Store[]> {
    const dashboardData = await this.getDashboardData()
    return dashboardData.stores || []
  }

  // Get KPI data from comprehensive dashboard data
  static async getKPIs(): Promise<KPIData[]> {
    const dashboardData = await this.getDashboardData()
    return dashboardData.kpis || []
  }
  
  // Get forecast data from comprehensive dashboard data
  static async getForecastData(): Promise<ForecastData[]> {
    const dashboardData = await this.getDashboardData()
    return dashboardData.forecastData || []
  }

  // Get category forecasts from comprehensive dashboard data
  static async getCategoryForecasts(): Promise<CategoryForecast[]> {
    const dashboardData = await this.getDashboardData()
    return dashboardData.categoryForecasts || []
  }

  // Get critical actions from comprehensive dashboard data
  static async getCriticalActions(): Promise<CriticalAction[]> {
    const dashboardData = await this.getDashboardData()
    return dashboardData.criticalActions || []
  }

  // Get equipment data from comprehensive dashboard data
  static async getEquipment(): Promise<Equipment[]> {
    const dashboardData = await this.getDashboardData()
    return dashboardData.equipment || []
  }

  // Get truck data from comprehensive dashboard data
  static async getTrucks(): Promise<Truck[]> {
    const dashboardData = await this.getDashboardData()
    return dashboardData.trucks || []
  }

  // Get specific store data
  static async getStore(storeId: string): Promise<Store> {
    const prompt = `Please provide detailed information for store ID: ${storeId} including:
    - Complete inventory levels by category
    - Current alerts and issues
    - Staff and manager information
    - Recent performance metrics

    Return as single store JSON object.`

    const response = await chatbotRequest<{store: Store} | Store>(prompt)
    return 'store' in response ? response.store : response
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const prompt = "Please respond with 'ok' to confirm the system is operational."
      const response = await chatbotRequest<string>(prompt)
      return typeof response === 'string' && response.toLowerCase().includes('ok')
    } catch {
      return false
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
