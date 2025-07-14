// Configuration for SmartRetail Twin Dashboard

export const config = {
  api: {
    // n8n Webhook base URL - endpoints will be appended
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://n8n-oayd.onrender.com/webhook',
    timeout: 15000, // Reduced timeout for faster fallbacks on static sites
    retryAttempts: 1, // Fewer retries for static deployment
    retryDelay: 1000,
  },
  
  realtime: {
    // Adjusted refresh intervals for static deployment
    defaultRefreshInterval: 300000, // 5 minutes (much slower for static)
    kpiRefreshInterval: 180000,     // 3 minutes for KPIs
    storeRefreshInterval: 300000,   // 5 minutes for store data
    forecastRefreshInterval: 600000, // 10 minutes for forecasts
    maintenanceRefreshInterval: 300000, // 5 minutes for maintenance
    healthCheckInterval: 600000,    // 10 minutes for health checks
  },
  
  features: {
    enableRealtime: false, // Disabled for static deployment
    enableWebSocket: false,
    enableRetryOnError: true,
    enableOfflineMode: true, // Enable offline mode for static sites
  },
  
  ui: {
    showLoadingStates: true,
    showLastUpdated: true,
    showErrorMessages: false, // Hide errors on static deployment
    autoRefreshOnFocus: false, // Disable for static deployment
  }
}

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  config.realtime.defaultRefreshInterval = 30000
  config.api.timeout = 30000
  config.features.enableRealtime = true
  config.ui.showErrorMessages = true
  config.ui.autoRefreshOnFocus = true
}

if (process.env.NODE_ENV === 'production') {
  config.features.enableRetryOnError = true
  config.features.enableOfflineMode = true
  // For static deployment, prioritize speed and fallbacks
  config.api.timeout = 10000
  config.api.retryAttempts = 0 // No retries in production static deployment
}
