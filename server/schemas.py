from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# Equipment Schemas
class EquipmentBase(BaseModel):
    name: str
    hostname: str
    ip_address: str
    equipment_type: str
    location: str
    client_name: str
    status: str = "online"


class EquipmentCreate(EquipmentBase):
    zabbix_host_id: str


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    equipment_type: Optional[str] = None
    location: Optional[str] = None
    client_name: Optional[str] = None
    status: Optional[str] = None


class Equipment(EquipmentBase):
    id: int
    zabbix_host_id: str
    last_seen: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Alarm Schemas
class AlarmBase(BaseModel):
    alarm_type: str
    severity: str
    title: str
    description: str
    status: str = "active"


class AlarmCreate(AlarmBase):
    equipment_id: int
    zabbix_event_id: str
    zabbix_trigger_id: Optional[str] = None
    zabbix_item_id: Optional[str] = None
    zabbix_host_id: Optional[str] = None


class AlarmUpdate(BaseModel):
    status: Optional[str] = None
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None


class Alarm(AlarmBase):
    id: int
    equipment_id: int
    zabbix_event_id: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    zabbix_trigger_id: Optional[str] = None
    zabbix_item_id: Optional[str] = None
    zabbix_host_id: Optional[str] = None
    
    class Config:
        from_attributes = True


# Documentation Schemas
class DocumentationBase(BaseModel):
    title: str
    content: str
    doc_type: str
    author: str
    tags: List[str] = []
    is_public: bool = True


class DocumentationCreate(DocumentationBase):
    equipment_id: int
    alarm_id: Optional[int] = None


class DocumentationUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    doc_type: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class Documentation(DocumentationBase):
    id: int
    equipment_id: int
    alarm_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# User Schemas
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str = "viewer"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Dashboard Schemas
class DashboardStats(BaseModel):
    total_equipment: int
    online_equipment: int
    offline_equipment: int
    active_alarms: int
    critical_alarms: int
    warning_alarms: int
    resolved_alarms_today: int


class EquipmentWithAlarms(Equipment):
    alarms: List[Alarm] = []
    documentation_count: int = 0


# Zabbix Integration Schemas
class ZabbixHost(BaseModel):
    hostid: str
    host: str
    name: str
    status: str
    available: str


class ZabbixTrigger(BaseModel):
    triggerid: str
    description: str
    expression: str
    priority: str
    value: str
    lastchange: str


class ZabbixEvent(BaseModel):
    eventid: str
    source: str
    object: str
    objectid: str
    clock: str
    value: str
    acknowledged: str
    name: str


# API Response Schemas
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    version: str
    database: str
    zabbix_connection: str 