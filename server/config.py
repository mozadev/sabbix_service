from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Zabbix Configuration
    zabbix_url: str = os.getenv("ZABBIX_URL")
    zabbix_user: str = os.getenv("ZABBIX_USER")
    zabbix_password: str = os.getenv("ZABBIX_PASSWORD")
    
    # Database Configuration
    database_url: str = "postgresql://user:password@localhost:5432/zabbix_monitor"
    database_test_url: str = "postgresql://user:password@localhost:5432/zabbix_monitor_test"
    
    # Security
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379/0"
    
    # Application Settings
    debug: bool = True
    environment: str = "development"
    log_level: str = "INFO"
    
    # Frontend URL
    frontend_url: str = "http://localhost:3000"
    
    # Monitoring Settings
    alert_check_interval: int = 300  # 5 minutes
    history_retention_days: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings() 