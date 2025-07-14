# n8n Webhook API Integration Guide

This guide explains how to set up real-time data integration using your n8n webhook endpoints for the SmartRetail Twin Dashboard.

## Overview

The dashboard has been updated to work with **multiple dedicated n8n webhook endpoints** for optimal performance. It includes:

- ✅ **Multiple dedicated endpoints** for specific data types
- ✅ **30-second caching** to minimize repeated requests
- ✅ **Real-time data hooks** with automatic polling
- ✅ **Error handling** and fallback to cached data
- ✅ **Loading states** and refresh controls
- ✅ **TypeScript interfaces** for type safety
- ✅ **Configurable refresh intervals**
- ✅ **Health monitoring** for API connectivity

## Quick Setup

### 1. Activate Your n8n Webhooks

Your webhook endpoints:
- **Health:** `https://n8n-oayd.onrender.com/webhook/health`
- **Dashboard:** `https://n8n-oayd.onrender.com/webhook/dashboard`
- **KPIs:** `https://n8n-oayd.onrender.com/webhook/kpis`
- **Stores:** `https://n8n-oayd.onrender.com/webhook/stores`
- **Forecast:** `https://n8n-oayd.onrender.com/webhook/forecast`
- **Actions:** `https://n8n-oayd.onrender.com/webhook/actions`
- **Equipment:** `https://n8n-oayd.onrender.com/webhook/equipment`
- **Trucks:** `https://n8n-oayd.onrender.com/webhook/trucks`

**Important**: Make sure your n8n workflows are active or in test mode. The webhooks need to be running to receive requests.

### 2. Test the Integration

1. Start the dashboard: `npm run dev`
2. Go to **Settings** page in the sidebar
3. Use the **API Test** component to verify connections
4. Try the health check and individual endpoint tests

### 3. Request Format

The dashboard sends POST requests to each webhook with this format:

```json
{
  "context": "smartretail_dashboard",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 4. Response Handling

Each webhook endpoint returns **structured JSON responses** in ApiResponse format:

```json
{
  "data": [...], // Endpoint-specific data
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

The dashboard:
- ✅ **Validates response structure** before using data in UI
- ✅ **Handles errors gracefully** with fallback data
- ✅ **Caches successful responses** for 30 seconds
- ✅ **Retries failed requests** with exponential backoff

### 5. Expected Data Types

Each webhook should provide specific data:

**Health Endpoint (`/webhook/health`):**
- System status monitoring
- API connectivity verification

**KPIs Endpoint (`/webhook/kpis`):**
- SKUs in danger zone (count and percentage)
- Fill rate vs forecast
- Urgent alerts count
- Average restock lead time
- Forecast confidence

**Stores Endpoint (`/webhook/stores`):**
- Store locations and status
- Inventory levels by category
- Weather impacts
- Manager information

**Forecast Endpoint (`/webhook/forecast`):**
- Sales predictions by category
- Weather impact on sales
- Special events affecting demand

**Actions Endpoint (`/webhook/actions`):**
- Restock recommendations
- Equipment maintenance alerts
- Demand spikes requiring response

**Equipment Endpoint (`/webhook/equipment`):**
- Equipment health and status
- Maintenance schedules
- Operational metrics

**Trucks Endpoint (`/webhook/trucks`):**
- Delivery tracking
- ETA predictions
- Route optimization

## Features Implemented

### Real-Time Components Updated

- ✅ **KPI Bar** - Shows live metrics via `/webhook/kpis`
- ✅ **Store Map** - Real-time store status via `/webhook/stores`
- ✅ **Forecasting** - Timeline and category forecasts via `/webhook/forecast`
- ✅ **War Room** - Critical actions via `/webhook/actions`
- ✅ **Maintenance** - Equipment and logistics via `/webhook/equipment` & `/webhook/trucks`

### Error Handling

- **Graceful degradation**: Shows cached/fallback data when APIs are unavailable
- **Retry logic**: Automatic retries with exponential backoff
- **User feedback**: Clear error messages and loading states
- **Health monitoring**: Connection status via `/webhook/health`

### Configuration Options

Edit `lib/config.ts` to customize:

```typescript
export const config = {
  api: {
    baseUrl: 'your-api-url',
    timeout: 10000,
    retryAttempts: 3,
  },
  realtime: {
    kpiRefreshInterval: 15000,     // 15 seconds
    storeRefreshInterval: 20000,   // 20 seconds
    forecastRefreshInterval: 60000, // 1 minute
  },
  features: {
    enableRealtime: true,
    enableRetryOnError: true,
  }
}
```

## Webhook Response Formats

Each n8n webhook should return responses in the standard ApiResponse format:

### 🔄 **Standard Response Format:**

All endpoints should return data in this structure:

```json
{
  "data": [endpoint-specific-data],
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 🔧 **Error Response Format:**
```json
{
  "data": null,
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 📊 **Example Responses:**

**KPIs Endpoint:**
```json
{
  "data": [
    {
      "title": "SKUs in Danger Zone",
      "value": "1",
      "total": "3",
      "percentage": 33,
      "type": "ring",
      "color": "text-red-600",
      "bgColor": "bg-red-50"
    }
  ],
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Stores Endpoint:**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Store #001 - Koramangala",
      "type": "dark",
      "status": "warning",
      "demand": 78,
      "stock": 45,
      "lat": 12.9352,
      "lng": 77.6245
    }
  ],
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Testing

### 1. Test with Mock API

Start a simple mock server:

```bash
# Install json-server for quick testing
npm install -g json-server

# Create mock data file
echo '{"kpis": [], "stores": [], "health": {"status": "ok"}}' > mock-data.json

# Start mock server
json-server --watch mock-data.json --port 3001
```

### 2. Test Connection

1. Start your dashboard: `npm run dev`
2. Check the header for connection status
3. Use refresh buttons to test manual updates
4. Check browser console for any errors

### 3. Test Error Handling

1. Stop your API server
2. Observe fallback data and error messages
3. Restart API and verify reconnection

## Next Steps

1. **Set up your API endpoints** following the specification in `docs/api-endpoints.md`
2. **Update the API URL** in your `.env.local` file
3. **Test the connection** using the dashboard
4. **Customize refresh intervals** based on your needs
5. **Add more components** (forecasting, war room, maintenance)

## Troubleshooting

### Common Issues

**"API Error" badge showing:**
- Check if your n8n workflows are active
- Verify the webhook URLs are correctly configured
- Check browser console for CORS or network errors

**Data not updating:**
- Verify webhook endpoints return correct JSON format
- Check individual endpoint responses in browser network tab
- Look for JavaScript errors in console

**Specific endpoint failures:**
- Test individual webhooks using tools like Postman
- Check n8n workflow logs for errors
- Ensure Google Sheets data is accessible

**CORS errors:**
- Add CORS headers to your n8n webhook responses
- For development, you can disable CORS in browser

### Debug Mode

Enable debug logging:

```bash
NEXT_PUBLIC_ENABLE_DEBUG=true
```

This will log all webhook requests and responses to the browser console.

### Testing Individual Endpoints

Test each webhook endpoint directly:

```bash
# Health check
curl -X POST https://n8n-oayd.onrender.com/webhook/health \
  -H "Content-Type: application/json" \
  -d '{"context": "smartretail_dashboard", "timestamp": "2024-01-15T10:30:00Z"}'

# KPIs
curl -X POST https://n8n-oayd.onrender.com/webhook/kpis \
  -H "Content-Type: application/json" \
  -d '{"context": "smartretail_dashboard", "timestamp": "2024-01-15T10:30:00Z"}'
```

---

## 📋 **API Endpoint Schemas**

If you prefer to use traditional REST API endpoints instead of the chatbot, here are the complete schemas for all endpoints:

### **Base Response Format**
All endpoints follow this wrapper format:
```typescript
interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: string
}
```

### **Error Response Format**
```json
{
  "data": null,
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### **1. GET /api/stores - Store Network Data**

**Request:**
```http
GET /api/stores
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
  name: string
  type: "dark" | "fulfillment"
  status: "critical" | "warning" | "good"
  demand: number                   // 0-100
  stock: number                    // 0-100
  lat: number                      // Latitude
  lng: number                      // Longitude
  address?: string
  manager?: string
  categories?: {
    sports?: CategoryData
    travel?: CategoryData
    essentials?: CategoryData
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
  message: string
  time: string                     // e.g., "15 min ago"
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Store #001 - Koramangala",
      "type": "dark",
      "status": "warning",
      "demand": 78,
      "stock": 45,
      "lat": 12.9352,
      "lng": 77.6245,
      "address": "Koramangala, Bangalore",
      "manager": "Rajesh Kumar",
      "categories": {
        "sports": { "stock": 70, "demand": 85, "trend": "up" },
        "travel": { "stock": 40, "demand": 92, "trend": "up" },
        "essentials": { "stock": 80, "demand": 65, "trend": "stable" }
      },
      "alerts": [
        {
          "type": "warning",
          "message": "Water bottles running low",
          "time": "15 min ago"
        }
      ]
    }
  ],
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### **2. GET /api/forecast - Sales Forecasting Data**

**Request:**
```http
GET /api/forecast
```

**Response Schema:**
```typescript
interface ForecastResponse {
  data: ForecastData[]
  success: boolean
  timestamp: string
}

interface ForecastData {
  day: string                      // e.g., "Mon", "Tue"
  date: string                     // e.g., "Dec 18"
  sports: number                   // Sales forecast number
  travel: number
  essentials: number
  weather: "sunny" | "cloudy" | "rainy" | "stormy"
  events: string[]                 // e.g., ["Monsoon Alert"]
  temperature: number              // e.g., 28 (Celsius)
  confidence: number               // 0-100 (forecast confidence)
}
```

**Example Response:**
```json
{
  "data": [
    {
      "day": "Mon",
      "date": "Dec 18",
      "sports": 85,
      "travel": 45,
      "essentials": 120,
      "weather": "sunny",
      "events": [],
      "temperature": 28,
      "confidence": 87
    },
    {
      "day": "Tue",
      "date": "Dec 19",
      "sports": 25,
      "travel": 15,
      "essentials": 180,
      "weather": "rainy",
      "events": ["Monsoon Alert"],
      "temperature": 24,
      "confidence": 92
    }
  ],
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### **3. GET /api/actions - Critical Actions**

**Request:**
```http
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
  title: string
  impact: number                   // 0-100 (business impact)
  urgency: number                  // 0-100 (time sensitivity)
  score: number                    // 0-100 (calculated priority)
  category: "restock" | "weather" | "demand" | "maintenance"
  description: string
  confidence: number               // 0-100 (confidence in recommendation)
  dataInputs: string[]             // Data sources used
  actions: ActionButton[]
  timeframe: string                // e.g., "Immediate", "Within 24h"
  riskLevel: "low" | "medium" | "high"
}

interface ActionButton {
  label: string                    // e.g., "Order Now"
  type: "primary" | "secondary" | "outline"
  icon?: string                    // Icon name (optional)
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Restock Water Bottles",
      "impact": 85,
      "urgency": 90,
      "score": 87,
      "category": "restock",
      "description": "Water bottles critically low across stores",
      "confidence": 95,
      "dataInputs": ["Stock levels", "Weather trends"],
      "timeframe": "Immediate",
      "riskLevel": "high",
      "actions": [
        {
          "label": "Order Now",
          "type": "primary",
          "icon": "shopping-cart"
        },
        {
          "label": "Schedule",
          "type": "secondary",
          "icon": "calendar"
        }
      ]
    }
  ],
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### **4. GET /api/equipment - Equipment Status**

**Request:**
```http
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
  name: string
  type: "cooler" | "conveyor" | "forklift"
  health: number                   // 0-100
  status: "good" | "warning" | "critical"
  temp?: string                    // e.g., "4°C" (for coolers)
  speed?: string                   // e.g., "1.2 m/s" (for conveyors)
  battery?: string                 // e.g., "85%" (for forklifts)
  lastMaintenance: string          // e.g., "2 days ago"
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Cooler Unit A1",
      "type": "cooler",
      "health": 85,
      "status": "good",
      "temp": "4°C",
      "lastMaintenance": "2 days ago"
    },
    {
      "id": 2,
      "name": "Conveyor Belt B2",
      "type": "conveyor",
      "health": 65,
      "status": "warning",
      "speed": "1.2 m/s",
      "lastMaintenance": "1 week ago"
    }
  ],
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### **5. GET /api/trucks - Truck Logistics Data**

**Request:**
```http
GET /api/trucks
```

**Response Schema:**
```typescript
interface TrucksResponse {
  data: Truck[]
  success: boolean
  timestamp: string
}

interface Truck {
  id: number
  driver: string
  route: string
  status: "en route" | "delivered" | "pending"
  eta: string                    // Estimated time of arrival
  cargo: CargoDetail[]
}

interface CargoDetail {
  item: string
  quantity: number
  status: "loaded" | "unloaded" | "in transit"
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "driver": "John Doe",
      "route": "Warehouse A to Store #001",
      "status": "en route",
      "eta": "2024-01-15T12:30:00Z",
      "cargo": [
        {
          "item": "Water Bottles",
          "quantity": 100,
          "status": "loaded"
        }
      ]
    }
  ],
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### **6. GET /api/stores/:id - Individual Store Data**

**Request:**
```http
GET /api/stores/1
```

**Response Schema:**
```typescript
interface SingleStoreResponse {
  data: Store  // Same Store interface as stores endpoint
  success: boolean
  timestamp: string
}
```

Returns detailed information for a specific store with the same structure as the stores endpoint.

---

## Support

If you need help:
1. Check the API endpoint specification in `docs/api-endpoints.md`
2. Review the TypeScript interfaces in `lib/types.ts`
3. Look at the example data structures in the fallback data
4. Test with the mock server setup above

## 🛠️ **Current Status**

✅ **Implemented:** Multiple dedicated webhook endpoints  
✅ **Working:** All components with real-time updates via specific endpoints  
✅ **Active:** KPI Bar, Store Map, Forecasting, War Room, Maintenance components  
📊 **Data:** Google Sheets + AI agents recommended for each n8n workflow

## 📋 **Webhook Endpoint Summary**

| Component | Endpoint | Purpose | Refresh Rate |
|-----------|----------|---------|--------------|
| Health Monitor | `/webhook/health` | System status | 10 minutes |
| KPI Bar | `/webhook/kpis` | Key metrics | 3 minutes |
| Store Map | `/webhook/stores` | Store status | 5 minutes |
| Forecasting | `/webhook/forecast` | Sales predictions | 10 minutes |
| War Room | `/webhook/actions` | Critical actions | 2 minutes |
| Equipment | `/webhook/equipment` | Maintenance status | 5 minutes |
| Logistics | `/webhook/trucks` | Truck tracking | 2 minutes |
| Dashboard | `/webhook/dashboard` | Complete data | 5 minutes |
