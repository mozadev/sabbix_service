# Zabbix Monitor - Sistema de Monitoreo de Redes

Sistema completo para monitoreo de equipos de red y documentación de alarmas desarrollado para **Claro Global Hitss**.

## 🚀 Características

- **Monitoreo en Tiempo Real**: Integración completa con Zabbix para monitoreo de equipos de red
- **Dashboard Interactivo**: Visualización de estadísticas y métricas en tiempo real
- **Gestión de Alarmas**: Sistema completo de alarmas con acknowledgment y resolución
- **Documentación**: Sistema de documentación para equipos y procedimientos
- **API RESTful**: Backend robusto con FastAPI
- **Frontend Moderno**: Interfaz de usuario con React y Material-UI
- **Escalable**: Arquitectura diseñada para crecimiento y alta disponibilidad

## 🏗️ Arquitectura

```
zabbix_alarm_report/
├── server/                 # Backend FastAPI
│   ├── config.py          # Configuración de la aplicación
│   ├── database.py        # Configuración de base de datos
│   ├── models.py          # Modelos de datos
│   ├── schemas.py         # Esquemas Pydantic
│   ├── main.py           # Aplicación principal
│   ├── services/         # Lógica de negocio
│   │   ├── zabbix_service.py
│   │   ├── equipment_service.py
│   │   └── alarm_service.py
│   └── routes/           # Endpoints de la API
│       ├── equipment.py
│       └── alarms.py
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Páginas de la aplicación
│   │   └── App.js        # Componente principal
│   └── package.json
├── requirements.txt       # Dependencias Python
└── README.md
```

## 📋 Prerrequisitos

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis (opcional, para caching)
- Acceso a servidor Zabbix

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd zabbix_alarm_report
```

### 2. Configurar el Backend

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones
```

### 3. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb zabbix_monitor

# Configurar DATABASE_URL en .env
DATABASE_URL=postgresql://user:password@localhost:5432/zabbix_monitor
```

### 4. Configurar Zabbix

Editar el archivo `.env` con las credenciales de Zabbix:

```env
ZABBIX_URL=http://10.232.35.243:8080/api_jsonrpc.php
ZABBIX_USER=tu_usuario_zabbix
ZABBIX_PASSWORD=tu_password_zabbix
```

### 5. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar proxy (opcional)
# El proxy ya está configurado en package.json para desarrollo
```

## 🚀 Ejecución

### Backend

```bash
# Desde la raíz del proyecto
cd server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
# Desde el directorio frontend
cd frontend
npm start
```

La aplicación estará disponible en:
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
- Documentación API: http://localhost:8000/docs

## 📊 Uso

### 1. Dashboard Principal

- Visualización de estadísticas en tiempo real
- Gráficos de estado de equipos y alarmas
- Métricas de rendimiento

### 2. Gestión de Equipos

- Lista de todos los equipos monitoreados
- Estado de conectividad
- Información detallada por equipo
- Sincronización automática con Zabbix

### 3. Gestión de Alarmas

- Alarmas activas y resueltas
- Filtros por tipo y severidad
- Acknowledgment y resolución de alarmas
- Historial de eventos

### 4. API Endpoints

#### Equipos
- `GET /api/v1/equipment/` - Listar equipos
- `GET /api/v1/equipment/{id}` - Obtener equipo específico
- `POST /api/v1/equipment/sync` - Sincronizar con Zabbix
- `GET /api/v1/equipment/stats/summary` - Estadísticas de equipos

#### Alarmas
- `GET /api/v1/alarms/` - Listar alarmas
- `GET /api/v1/alarms/{id}` - Obtener alarma específica
- `POST /api/v1/alarms/{id}/acknowledge` - Acknowledgment
- `POST /api/v1/alarms/{id}/resolve` - Resolver alarma
- `GET /api/v1/alarms/stats/summary` - Estadísticas de alarmas

#### Dashboard
- `GET /api/v1/dashboard/stats` - Estadísticas del dashboard

## 🔧 Configuración Avanzada

### Variables de Entorno

```env
# Zabbix Configuration
ZABBIX_URL=http://10.232.35.243:8080/api_jsonrpc.php
ZABBIX_USER=your_zabbix_user
ZABBIX_PASSWORD=your_zabbix_password

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/zabbix_monitor

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Settings
DEBUG=True
ENVIRONMENT=development
LOG_LEVEL=INFO

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Monitoring Settings
ALERT_CHECK_INTERVAL=300
HISTORY_RETENTION_DAYS=30
```

### Configuración de Producción

1. **Base de Datos**: Usar PostgreSQL en producción
2. **Redis**: Configurar para caching y sesiones
3. **Logging**: Configurar logging estructurado
4. **Seguridad**: Configurar CORS y autenticación
5. **Monitoreo**: Configurar health checks y métricas

## 📈 Monitoreo y Mantenimiento

### Health Checks

```bash
# Verificar estado de la aplicación
curl http://localhost:8000/health

# Verificar conexión con Zabbix
curl http://localhost:8000/api/v1/zabbix/test
```

### Logs

Los logs se configuran automáticamente con el nivel especificado en `LOG_LEVEL`.

### Backup

```bash
# Backup de la base de datos
pg_dump zabbix_monitor > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de conexión a Zabbix**
   - Verificar credenciales en `.env`
   - Verificar conectividad de red
   - Verificar URL de Zabbix

2. **Error de base de datos**
   - Verificar conexión PostgreSQL
   - Verificar DATABASE_URL en `.env`
   - Verificar permisos de usuario

3. **Frontend no carga datos**
   - Verificar que el backend esté ejecutándose
   - Verificar configuración de proxy
   - Verificar CORS en el backend

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está desarrollado para Claro Global Hitss.

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo de Claro Global Hitss.

---

**Desarrollado con ❤️ para Claro Global Hitss** 