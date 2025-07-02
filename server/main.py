from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from .config import settings
from .database import init_db
from .routes import equipment, alarms
from .services.zabbix_service import ZabbixService
from .schemas import HealthCheck

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Zabbix service
zabbix_service = ZabbixService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Zabbix Monitor API...")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    # Test Zabbix connection
    try:
        if zabbix_service.test_connection():
            logger.info("Zabbix connection test successful")
        else:
            logger.warning("Zabbix connection test failed")
    except Exception as e:
        logger.warning(f"Zabbix connection test failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Zabbix Monitor API...")


# Create FastAPI app
app = FastAPI(
    title="Zabbix Monitor API",
    description="API para monitoreo de equipos de red y documentación de alarmas - Claro Global Hitss",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure appropriately for production
)

# Include routers
app.include_router(equipment.router, prefix="/api/v1")
app.include_router(alarms.router, prefix="/api/v1")


@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Zabbix Monitor API - Claro Global Hitss",
        "version": "1.0.0",
        "docs": "/docs",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health", response_model=HealthCheck, tags=["health"])
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        from .database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"
    
    try:
        # Test Zabbix connection
        zabbix_status = "healthy" if zabbix_service.test_connection() else "unhealthy"
    except Exception as e:
        logger.error(f"Zabbix health check failed: {e}")
        zabbix_status = "unhealthy"
    
    overall_status = "healthy" if db_status == "healthy" and zabbix_status == "healthy" else "degraded"
    
    return HealthCheck(
        status=overall_status,
        timestamp=datetime.utcnow(),
        version="1.0.0",
        database=db_status,
        zabbix_connection=zabbix_status
    )


@app.get("/api/v1/dashboard/stats", tags=["dashboard"])
async def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        from .database import SessionLocal
        from .services.equipment_service import EquipmentService
        from .services.alarm_service import AlarmService
        
        db = SessionLocal()
        
        # Get equipment stats
        equipment_stats = EquipmentService.get_equipment_stats(db)
        
        # Get alarm stats
        alarm_stats = AlarmService.get_alarm_stats(db)
        
        db.close()
        
        return {
            "equipment": equipment_stats,
            "alarms": alarm_stats,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Failed to get dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard statistics")


@app.get("/api/v1/zabbix/test", tags=["zabbix"])
async def test_zabbix_connection():
    """Test Zabbix connection"""
    try:
        success = zabbix_service.test_connection()
        return {
            "success": success,
            "message": "Zabbix connection test completed",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Zabbix connection test failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    ) 