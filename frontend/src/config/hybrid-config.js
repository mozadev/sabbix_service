/**
 * Configuración para el Enfoque Híbrido
 * 
 * Este archivo contiene la configuración necesaria para integrar
 * el dashboard personalizado con Zabbix original
 */

export const HYBRID_CONFIG = {
  // Configuración de Zabbix
  ZABBIX: {
    URL: 'http://10.232.35.243:8080',
    API_URL: 'http://localhost:8000/api/v1',
    REFRESH_INTERVAL: 30000, // 30 segundos
    CONNECTION_TIMEOUT: 10000, // 10 segundos
  },

  // Configuración de la aplicación
  APP: {
    NAME: 'Claro Global Hitss - Monitor de Red',
    VERSION: '1.0.0',
    DESCRIPTION: 'Sistema híbrido de monitoreo de equipos de red',
  },

  // Configuración de navegación
  NAVIGATION: {
    // Menú principal (dashboard personalizado)
    MAIN_MENU: [
      { text: 'Dashboard', path: '/', icon: 'Dashboard' },
      { text: 'Equipos', path: '/equipment', icon: 'Computer' },
      { text: 'Alarmas', path: '/alarms', icon: 'Warning' },
    ],
    
    // Menú Zabbix (sistema original)
    ZABBIX_MENU: [
      { text: 'Zabbix Dashboard', path: '/zabbix', icon: 'Monitor' },
    ],
  },

  // Configuración de funcionalidades
  FEATURES: {
    // Funcionalidades del dashboard personalizado
    CUSTOM_DASHBOARD: {
      ENABLED: true,
      FEATURES: [
        'Estadísticas personalizadas',
        'Gráficos interactivos',
        'Documentación de alarmas',
        'Reportes específicos',
        'Integración con sistemas existentes',
      ],
    },

    // Funcionalidades de Zabbix
    ZABBIX_INTEGRATION: {
      ENABLED: true,
      FEATURES: [
        'Monitoreo en tiempo real',
        'Gestión de alarmas',
        'Configuración de equipos',
        'Reportes avanzados',
        'Alertas automáticas',
      ],
    },
  },

  // Configuración de UI/UX
  UI: {
    // Tema para dashboard personalizado
    CUSTOM_THEME: {
      PRIMARY: '#1976d2',
      SECONDARY: '#dc004e',
      SUCCESS: '#4caf50',
      WARNING: '#ff9800',
      ERROR: '#f44336',
    },

    // Tema para sección Zabbix
    ZABBIX_THEME: {
      PRIMARY: '#dc004e',
      SECONDARY: '#1976d2',
    },

    // Configuración de responsive
    RESPONSIVE: {
      BREAKPOINTS: {
        MOBILE: 600,
        TABLET: 960,
        DESKTOP: 1280,
      },
    },
  },

  // Configuración de notificaciones
  NOTIFICATIONS: {
    ENABLED: true,
    TYPES: {
      CRITICAL_ALARMS: {
        SOUND: true,
        TOAST: true,
        DURATION: 0, // Sin auto-close
      },
      WARNING_ALARMS: {
        SOUND: true,
        TOAST: true,
        DURATION: 5000,
      },
      ZABBIX_CONNECTION: {
        SOUND: false,
        TOAST: true,
        DURATION: 3000,
      },
    },
  },

  // Configuración de sincronización
  SYNC: {
    ENABLED: true,
    INTERVALS: {
      EQUIPMENT: 60000, // 1 minuto
      ALARMS: 30000,    // 30 segundos
      STATS: 30000,     // 30 segundos
    },
    AUTO_SYNC: true,
  },
};

// Funciones de utilidad para el enfoque híbrido
export const HYBRID_UTILS = {
  /**
   * Determinar si una ruta pertenece al dashboard personalizado
   */
  isCustomDashboard: (path) => {
    return HYBRID_CONFIG.NAVIGATION.MAIN_MENU.some(item => item.path === path);
  },

  /**
   * Determinar si una ruta pertenece a Zabbix
   */
  isZabbixRoute: (path) => {
    return HYBRID_CONFIG.NAVIGATION.ZABBIX_MENU.some(item => item.path === path);
  },

  /**
   * Obtener el tema apropiado según la ruta
   */
  getThemeForRoute: (path) => {
    if (HYBRID_UTILS.isZabbixRoute(path)) {
      return HYBRID_CONFIG.UI.ZABBIX_THEME;
    }
    return HYBRID_CONFIG.UI.CUSTOM_THEME;
  },

  /**
   * Obtener la configuración de notificaciones para un tipo
   */
  getNotificationConfig: (type) => {
    return HYBRID_CONFIG.NOTIFICATIONS.TYPES[type] || {};
  },

  /**
   * Verificar si una funcionalidad está habilitada
   */
  isFeatureEnabled: (feature) => {
    return HYBRID_CONFIG.FEATURES[feature]?.ENABLED || false;
  },

  /**
   * Obtener la URL completa de Zabbix
   */
  getZabbixUrl: (path = '') => {
    return `${HYBRID_CONFIG.ZABBIX.URL}${path}`;
  },

  /**
   * Obtener la URL completa de la API
   */
  getApiUrl: (endpoint = '') => {
    return `${HYBRID_CONFIG.ZABBIX.API_URL}${endpoint}`;
  },
};

// Configuración de desarrollo
export const DEV_CONFIG = {
  ENABLE_LOGGING: true,
  ENABLE_MOCK_DATA: false,
  API_MOCK_DELAY: 1000,
  SHOW_DEBUG_INFO: false,
};

// Exportar configuración completa
export default {
  HYBRID_CONFIG,
  HYBRID_UTILS,
  DEV_CONFIG,
}; 