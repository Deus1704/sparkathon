# SmartRetail Twin Dashboard - API Overview & n8n Integration Guide

## 🌐 Current Implementation: Multiple n8n Webhook Endpoints

The dashboard uses **multiple specific n8n webhook endpoints** for different data types:

**Base URL:** `https://n8n-oayd.onrender.com/webhook/`

### Webhook Endpoints
- **Health:** `https://n8n-oayd.onrender.com/webhook/health`
- **Dashboard:** `https://n8n-oayd.onrender.com/webhook/dashboard`
- **KPIs:** `https://n8n-oayd.onrender.com/webhook/kpis`
- **Stores:** `https://n8n-oayd.onrender.com/webhook/stores`
- **Forecast:** `https://n8n-oayd.onrender.com/webhook/forecast`
- **Actions:** `https://n8n-oayd.onrender.com/webhook/actions`
- **Equipment:** `https://n8n-oayd.onrender.com/webhook/equipment`
- **Trucks:** `https://n8n-oayd.onrender.com/webhook/trucks`

### Request Format
All endpoints accept POST requests with:
```json
{
  "context": "smartretail_dashboard",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📋 All API Endpoints & Schemas

While the dashboard uses a single chatbot endpoint, here are **ALL** the traditional REST API endpoints it can support, with complete schemas:

### 🏥 **1. Health Check API**
```http
GET /health
```

**Response Schema:**
```typescript
interface HealthResponse {
  data: { status: "ok" | "error" }
  success: boolean
  timestamp: string
}
```

---

### 📊 **2. Dashboard Overview API**
```http
GET /dashboard
```

**Response Schema:**
```typescript
interface DashboardResponse {
  data: DashboardData
  success: boolean
  timestamp: string
}

interface DashboardData {
  stores: Store[]
  kpis: KPIData[]
  forecastData: ForecastData[]
  categoryForecasts: CategoryForecast[]
  criticalActions: CriticalAction[]
  equipment: Equipment[]
  trucks: Truck[]
  lastUpdated: string
}
```

---

### 📈 **3. KPIs API**
```http
GET /kpis
```

**Response Schema:**
```typescript
interface KPIResponse {
  data: KPIData[]
  success: boolean
  timestamp: string
}

interface KPIData {
  title: string                    // e.g., "SKUs in Danger Zone"
  value: string                    // e.g., "247"
  total?: string                   // e.g., "12,450"
  percentage?: number              // 0-100
  change?: string                  // e.g., "+2.1%"
  trend?: "up" | "down" | "stable"
  unit?: string                    // e.g., "minutes", "%"
  type: "ring" | "sparkline" | "badge" | "metric"
  color: string                    // e.g., "text-red-600"
  bgColor: string                  // e.g., "bg-red-50"
}
```

**Example Response:**
```json
{
  "data": [
    {
      "title": "SKUs in Danger Zone",
      "value": "247",
      "total": "12,450",
      "percentage": 85,
      "type": "ring",
      "color": "text-red-600",
      "bgColor": "bg-red-50"
    },
    {
      "title": "Fill Rate vs Forecast",
      "value": "94.2%",
      "change": "+2.1%",
      "trend": "up",
      "type": "sparkline",
      "color": "text-green-600",
      "bgColor": "bg-green-50"
    }
  ],
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### 🏪 **4. Stores API**
```http
GET /stores
GET /stores/:id
```

**Response Schema:**
```typescript
interface StoreResponse {
  data: Store[]
  success: boolean
  timestamp: string
}

interface Store {
  id: string
  name: string                     // e.g., "Store #001 - Koramangala"
  type: "dark" | "fulfillment"
  status: "critical" | "warning" | "good"
  demand: number                   // 0-100
  stock: number                    // 0-100
  lat: number                      // Latitude (12.9352)
  lng: number                      // Longitude (77.6245)
  address?: string                 // "Koramangala, Bangalore"
  manager?: string                 // "Rajesh Kumar"
  categories?: {
    electronics?: CategoryData
    groceries?: CategoryData
    apparel?: CategoryData
    pharmacy?: CategoryData
  }
  alerts?: Alert[]
}

interface CategoryData {
  stock: number                    // 0-100
  demand: number                   // 0-100
  trend: "up" | "down" | "stable"
}

interface Alert {
  type: "critical" | "warning" | "info"
  message: string                  // "Water bottles running low"
  time: string                     // "15 min ago"
}
```

---

### 🔮 **5. Forecasting APIs**
```http
GET /forecast/timeline
GET /forecast/categories
```

**Timeline Response Schema:**
```typescript
interface ForecastResponse {
  data: ForecastData[]
  success: boolean
  timestamp: string
}

interface ForecastData {
  day: string                      // "Mon", "Tue"
  date: string                     // "Dec 18"
  electronics: number              // Sales forecast
  groceries: number
  apparel: number
  pharmacy: number
  weather: "sunny" | "cloudy" | "rainy" | "stormy"
  events: string[]                 // ["Monsoon Alert"]
  temperature: number              // 28 (Celsius)
  confidence?: number              // 0-100
}
```

**Category Forecast Response Schema:**
```typescript
interface CategoryForecastResponse {
  data: CategoryForecast[]
  success: boolean
  timestamp: string
}

interface CategoryForecast {
  category: string                 // "electronics"
  current: number                  // Current sales
  forecast: number                 // Predicted sales
  confidence: number               // 0-100
  trend: "up" | "down" | "stable"
}
```

---

### ⚠️ **6. Critical Actions API (War Room)**
```http
GET /warroom/actions
GET /api/actions
```

**Response Schema:**
```typescript
interface ActionsResponse {
  data: CriticalAction[]
  success: boolean
  timestamp: string
}

interface CriticalAction {
  id: number
  title: string                    // "Restock Water Bottles"
  impact: number                   // 0-100 (business impact)
  urgency: number                  // 0-100 (time sensitivity)
  score: number                    // 0-100 (calculated priority)
  category: "restock" | "weather" | "demand" | "maintenance"
  description: string              // Detailed explanation
  confidence: number               // 0-100
  dataInputs: string[]             // ["Stock levels", "Weather trends"]
  actions: ActionButton[]
  timeframe?: string               // "Immediate", "Within 24h"
  riskLevel?: "low" | "medium" | "high"
}

interface ActionButton {
  label: string                    // "Order Now"
  type: "primary" | "secondary" | "outline"
  icon?: string                    // "shopping-cart"
}
```

---

### 🔧 **7. Equipment API (Maintenance)**
```http
GET /maintenance/equipment
GET /api/equipment
```

**Response Schema:**
```typescript
interface EquipmentResponse {
  data: Equipment[]
  success: boolean
  timestamp: string
}

interface Equipment {
  id: number
  name: string                     // "Cooler Unit A1"
  type: "cooler" | "conveyor" | "forklift"
  health: number                   // 0-100
  status: "good" | "warning" | "critical"
  temp?: string                    // "4°C" (for coolers)
  speed?: string                   // "1.2 m/s" (for conveyors)
  battery?: string                 // "85%" (for forklifts)
  lastMaintenance: string          // "2 days ago"
}
```

---

### 🚛 **8. Logistics/Trucks API**
```http
GET /logistics/trucks
```

**Response Schema:**
```typescript
interface TruckResponse {
  data: Truck[]
  success: boolean
  timestamp: string
}

interface Truck {
  id: number
  route: string                    // "Bangalore-Koramangala"
  eta: string                      // "2:30 PM"
  delay: number                    // Minutes delayed
  risk: "low" | "medium" | "high"
  cargo: string                    // "Sports equipment"
}
```

---

## 🎯 **n8n Workflow Generation Prompt**

> **🚀 Create 8 separate n8n workflows using Google Sheets + AI agents to power a SmartRetail Twin Dashboard**
>
> **Context:** Build dedicated workflows for each data endpoint that generate specific real-time data for KPIs, store management, forecasting, critical actions, equipment monitoring, and logistics tracking.
>
> **Required Workflows:**
> 1. **Health Check** (`/webhook/health`) - System status monitoring
> 2. **Dashboard Overview** (`/webhook/dashboard`) - Complete data aggregation  
> 3. **KPIs** (`/webhook/kpis`) - Key performance indicators
> 4. **Stores** (`/webhook/stores`) - Store network status
> 5. **Forecasting** (`/webhook/forecast`) - Sales predictions
> 6. **Critical Actions** (`/webhook/actions`) - Priority recommendations
> 7. **Equipment** (`/webhook/equipment`) - Maintenance status
> 8. **Trucks** (`/webhook/trucks`) - Logistics tracking
>
> **Requirements:**
> - Use **Google Sheets** as primary data source for each workflow
> - Integrate **AI agents** (OpenAI/Claude) for intelligent analysis  
> - Output **JSON responses** matching the schemas above
> - Each workflow responds to POST requests with `{"context": "smartretail_dashboard", "timestamp": "..."}`
> - Base URL: `https://n8n-oayd.onrender.com/webhook/{endpoint}`
>
> **Data Sources to Create:**
> 1. **Product Inventory Sheet** - SKUs, stock levels, categories (Cricket bat: 70%, Water Bottle: 40%, Umbrella: 80%)
> 2. **Store Network Sheet** - Bangalore store locations, managers, status, coordinates
> 3. **Sales History Sheet** - Historical sales data by category and weather
> 4. **Equipment Status Sheet** - Coolers, conveyors, forklifts with health metrics
> 5. **Logistics Sheet** - Truck routes, ETAs, cargo info for Bangalore area
> 6. **Weather/Events Sheet** - Bangalore weather data, local events, trends
>
> **AI Agent Functions per Workflow:**
> - **KPI Workflow:** Calculate danger zones, fill rates, alerts from inventory data
> - **Store Workflow:** Analyze store performance, status, and inventory levels
> - **Forecast Workflow:** Predict sales based on weather patterns and trends
> - **Actions Workflow:** Generate critical actions with impact/urgency scores
> - **Equipment Workflow:** Assess maintenance needs and operational risks
> - **Trucks Workflow:** Calculate delivery ETAs and risk assessments
>
> **Output Format:** Each workflow returns specific JSON data:
> ```json
> {
>   "data": [...], // Endpoint-specific data
>   "success": true,
>   "timestamp": "2024-01-15T10:30:00Z"
> }
> ```
>
> **Focus Areas:**
> - Bangalore-specific context (weather impact on umbrella/water bottle sales)
> - Real-time inventory alerts and restock recommendations  
> - Weather-driven demand forecasting
> - Maintenance scheduling based on equipment health
> - Delivery optimization for local routes
>
> Generate 8 dedicated n8n workflows that create intelligent, data-driven retail operations insights using Google Sheets + AI analysis for each specific endpoint.

---

## 🔄 **Refresh Intervals**

The dashboard polls different data types at different intervals:

- **KPIs:** Every 15 seconds
- **Stores:** Every 20 seconds  
- **Forecast:** Every 60 seconds
- **Actions:** Every 30 seconds
- **Equipment:** Every 45 seconds
- **Trucks:** Every 30 seconds

---

## 📝 **Implementation Notes**

1. **Base Response Format:** All endpoints wrap data in `ApiResponse<T>` format
2. **Error Handling:** Returns `success: false` with error message
3. **Timestamps:** ISO 8601 format (`2024-01-15T10:30:00Z`)
4. **CORS:** Required for browser access
5. **Caching:** 30-second cache to prevent excessive requests
6. **Fallback Data:** Dashboard has fallback data for offline scenarios

---

## 🛠️ **Current Status**

✅ **Implemented:** Single chatbot endpoint with comprehensive JSON parsing  
✅ **Working:** KPI Bar, Store Map with real-time updates  
🔄 **Next:** Forecasting, War Room, Maintenance components  
📊 **Data:** Google Sheets + AI agents recommended for n8n workflows
