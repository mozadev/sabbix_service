from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from ..models import Equipment, Alarm, Documentation
from ..schemas import EquipmentCreate, EquipmentUpdate, EquipmentWithAlarms
from .zabbix_service import zabbix_service

logger = logging.getLogger(__name__)


class EquipmentService:
    
    @staticmethod
    def get_equipment(db: Session, skip: int = 0, limit: int = 100, 
                     client_name: str = None, status: str = None) -> List[Equipment]:
        """Get equipment with optional filtering"""
        query = db.query(Equipment)
        
        if client_name:
            query = query.filter(Equipment.client_name.ilike(f"%{client_name}%"))
        
        if status:
            query = query.filter(Equipment.status == status)
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_equipment_by_id(db: Session, equipment_id: int) -> Optional[Equipment]:
        """Get equipment by ID"""
        return db.query(Equipment).filter(Equipment.id == equipment_id).first()
    
    @staticmethod
    def get_equipment_by_zabbix_id(db: Session, zabbix_host_id: str) -> Optional[Equipment]:
        """Get equipment by Zabbix host ID"""
        return db.query(Equipment).filter(Equipment.zabbix_host_id == zabbix_host_id).first()
    
    @staticmethod
    def create_equipment(db: Session, equipment: EquipmentCreate) -> Equipment:
        """Create new equipment"""
        db_equipment = Equipment(**equipment.dict())
        db.add(db_equipment)
        db.commit()
        db.refresh(db_equipment)
        logger.info(f"Created equipment: {db_equipment.name}")
        return db_equipment
    
    @staticmethod
    def update_equipment(db: Session, equipment_id: int, equipment_update: EquipmentUpdate) -> Optional[Equipment]:
        """Update equipment"""
        db_equipment = EquipmentService.get_equipment_by_id(db, equipment_id)
        if not db_equipment:
            return None
        
        update_data = equipment_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_equipment, field, value)
        
        db_equipment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_equipment)
        logger.info(f"Updated equipment: {db_equipment.name}")
        return db_equipment
    
    @staticmethod
    def delete_equipment(db: Session, equipment_id: int) -> bool:
        """Delete equipment"""
        db_equipment = EquipmentService.get_equipment_by_id(db, equipment_id)
        if not db_equipment:
            return False
        
        db.delete(db_equipment)
        db.commit()
        logger.info(f"Deleted equipment: {db_equipment.name}")
        return True
    
    @staticmethod
    def sync_with_zabbix(db: Session) -> Dict[str, int]:
        """Synchronize equipment with Zabbix hosts"""
        try:
            # Get hosts from Zabbix
            zabbix_hosts = zabbix_service.get_hosts()
            
            synced_count = 0
            created_count = 0
            updated_count = 0
            
            for zabbix_host in zabbix_hosts:
                # Check if equipment exists
                existing_equipment = EquipmentService.get_equipment_by_zabbix_id(db, zabbix_host.hostid)
                
                if existing_equipment:
                    # Update existing equipment
                    existing_equipment.status = "online" if zabbix_host.status == "0" else "offline"
                    existing_equipment.last_seen = datetime.utcnow()
                    existing_equipment.updated_at = datetime.utcnow()
                    updated_count += 1
                else:
                    # Create new equipment
                    equipment_data = EquipmentCreate(
                        zabbix_host_id=zabbix_host.hostid,
                        name=zabbix_host.name,
                        hostname=zabbix_host.host,
                        ip_address="",  # Will be updated from interfaces
                        equipment_type="unknown",
                        location="",
                        client_name="",
                        status="online" if zabbix_host.status == "0" else "offline"
                    )
                    
                    EquipmentService.create_equipment(db, equipment_data)
                    created_count += 1
                
                synced_count += 1
            
            # Mark equipment as offline if not seen in Zabbix
            zabbix_host_ids = [host.hostid for host in zabbix_hosts]
            db.query(Equipment).filter(
                ~Equipment.zabbix_host_id.in_(zabbix_host_ids)
            ).update({
                "status": "offline",
                "updated_at": datetime.utcnow()
            })
            
            logger.info(f"Sync completed: {synced_count} synced, {created_count} created, {updated_count} updated")
            
            return {
                "synced": synced_count,
                "created": created_count,
                "updated": updated_count
            }
        
        except Exception as e:
            logger.error(f"Failed to sync with Zabbix: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def get_equipment_with_alarms(db: Session, equipment_id: int) -> Optional[EquipmentWithAlarms]:
        """Get equipment with its alarms"""
        equipment = EquipmentService.get_equipment_by_id(db, equipment_id)
        if not equipment:
            return None
        
        # Get active alarms
        alarms = db.query(Alarm).filter(
            and_(
                Alarm.equipment_id == equipment_id,
                Alarm.status.in_(["active", "acknowledged"])
            )
        ).all()
        
        # Get documentation count
        doc_count = db.query(Documentation).filter(
            Documentation.equipment_id == equipment_id
        ).count()
        
        # Create response object
        equipment_with_alarms = EquipmentWithAlarms(
            **equipment.__dict__,
            alarms=alarms,
            documentation_count=doc_count
        )
        
        return equipment_with_alarms
    
    @staticmethod
    def get_equipment_stats(db: Session) -> Dict[str, int]:
        """Get equipment statistics"""
        total = db.query(Equipment).count()
        online = db.query(Equipment).filter(Equipment.status == "online").count()
        offline = db.query(Equipment).filter(Equipment.status == "offline").count()
        maintenance = db.query(Equipment).filter(Equipment.status == "maintenance").count()
        
        return {
            "total": total,
            "online": online,
            "offline": offline,
            "maintenance": maintenance
        }
    
    @staticmethod
    def get_equipment_by_client(db: Session, client_name: str) -> List[Equipment]:
        """Get all equipment for a specific client"""
        return db.query(Equipment).filter(
            Equipment.client_name.ilike(f"%{client_name}%")
        ).all()
    
    @staticmethod
    def get_equipment_health(db: Session, equipment_id: int) -> Dict[str, Any]:
        """Get equipment health status"""
        equipment = EquipmentService.get_equipment_by_id(db, equipment_id)
        if not equipment:
            return {}
        
        # Get recent alarms
        recent_alarms = db.query(Alarm).filter(
            and_(
                Alarm.equipment_id == equipment_id,
                Alarm.created_at >= datetime.utcnow() - timedelta(days=7)
            )
        ).all()
        
        # Get alarm statistics
        critical_alarms = len([a for a in recent_alarms if a.alarm_type == "critical"])
        warning_alarms = len([a for a in recent_alarms if a.alarm_type == "warning"])
        
        # Calculate uptime (simplified)
        total_alarms = len(recent_alarms)
        uptime_percentage = max(0, 100 - (total_alarms * 5))  # Simplified calculation
        
        return {
            "equipment_id": equipment_id,
            "status": equipment.status,
            "last_seen": equipment.last_seen,
            "recent_alarms": len(recent_alarms),
            "critical_alarms": critical_alarms,
            "warning_alarms": warning_alarms,
            "uptime_percentage": uptime_percentage,
            "health_score": "good" if uptime_percentage > 90 else "warning" if uptime_percentage > 70 else "critical"
        }
    
    @staticmethod
    def search_equipment(db: Session, search_term: str) -> List[Equipment]:
        """Search equipment by name, hostname, IP, or client"""
        return db.query(Equipment).filter(
            or_(
                Equipment.name.ilike(f"%{search_term}%"),
                Equipment.hostname.ilike(f"%{search_term}%"),
                Equipment.ip_address.ilike(f"%{search_term}%"),
                Equipment.client_name.ilike(f"%{search_term}%")
            )
        ).all() 