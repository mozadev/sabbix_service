from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    zabbix_host_id = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    hostname = Column(String, index=True)
    ip_address = Column(String, index=True)
    equipment_type = Column(String)  # router, switch, server, etc.
    location = Column(String)
    client_name = Column(String, index=True)
    status = Column(String)  # online, offline, maintenance
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    alarms = relationship("Alarm", back_populates="equipment")
    documentation = relationship("Documentation", back_populates="equipment")


class Alarm(Base):
    __tablename__ = "alarms"
    
    id = Column(Integer, primary_key=True, index=True)
    zabbix_event_id = Column(String, unique=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    alarm_type = Column(String)  # critical, warning, info
    severity = Column(String)  # high, medium, low
    title = Column(String)
    description = Column(Text)
    status = Column(String)  # active, resolved, acknowledged
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Zabbix specific fields
    zabbix_trigger_id = Column(String, nullable=True)
    zabbix_item_id = Column(String, nullable=True)
    zabbix_host_id = Column(String, nullable=True)
    
    # Relationships
    equipment = relationship("Equipment", back_populates="alarms")
    documentation = relationship("Documentation", back_populates="alarm")


class Documentation(Base):
    __tablename__ = "documentation"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    alarm_id = Column(Integer, ForeignKey("alarms.id"), nullable=True)
    title = Column(String)
    content = Column(Text)
    doc_type = Column(String)  # procedure, troubleshooting, maintenance
    author = Column(String)
    tags = Column(JSON)  # Store as JSON array
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    equipment = relationship("Equipment", back_populates="documentation")
    alarm = relationship("Alarm", back_populates="documentation")


class MonitoringMetrics(Base):
    __tablename__ = "monitoring_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    metric_name = Column(String, index=True)
    metric_value = Column(Float)
    unit = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Zabbix specific
    zabbix_item_id = Column(String, nullable=True)
    zabbix_host_id = Column(String, nullable=True)


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # admin, operator, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True) 