from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from ..models import Alarm, Equipment
from ..schemas import AlarmCreate, AlarmUpdate
from .zabbix_service import zabbix_service

logger = logging.getLogger(__name__)


class AlarmService:
    
    @staticmethod
    def get_alarms(db: Session, skip: int = 0, limit: int = 100, 
                  status: str = None, alarm_type: str = None, 
                  equipment_id: int = None) -> List[Alarm]:
        """Get alarms with optional filtering"""
        query = db.query(Alarm)
        
        if status:
            query = query.filter(Alarm.status == status)
        
        if alarm_type:
            query = query.filter(Alarm.alarm_type == alarm_type)
        
        if equipment_id:
            query = query.filter(Alarm.equipment_id == equipment_id)
        
        return query.order_by(desc(Alarm.created_at)).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_alarm_by_id(db: Session, alarm_id: int) -> Optional[Alarm]:
        """Get alarm by ID"""
        return db.query(Alarm).filter(Alarm.id == alarm_id).first()
    
    @staticmethod
    def get_alarm_by_zabbix_event_id(db: Session, zabbix_event_id: str) -> Optional[Alarm]:
        """Get alarm by Zabbix event ID"""
        return db.query(Alarm).filter(Alarm.zabbix_event_id == zabbix_event_id).first()
    
    @staticmethod
    def create_alarm(db: Session, alarm: AlarmCreate) -> Alarm:
        """Create new alarm"""
        db_alarm = Alarm(**alarm.dict())
        db.add(db_alarm)
        db.commit()
        db.refresh(db_alarm)
        logger.info(f"Created alarm: {db_alarm.title}")
        return db_alarm
    
    @staticmethod
    def update_alarm(db: Session, alarm_id: int, alarm_update: AlarmUpdate) -> Optional[Alarm]:
        """Update alarm"""
        db_alarm = AlarmService.get_alarm_by_id(db, alarm_id)
        if not db_alarm:
            return None
        
        update_data = alarm_update.dict(exclude_unset=True)
        
        # Handle acknowledgment
        if "acknowledged_by" in update_data:
            db_alarm.acknowledged_at = datetime.utcnow()
        
        # Handle resolution
        if update_data.get("status") == "resolved":
            db_alarm.resolved_at = datetime.utcnow()
        
        for field, value in update_data.items():
            setattr(db_alarm, field, value)
        
        db_alarm.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_alarm)
        logger.info(f"Updated alarm: {db_alarm.title}")
        return db_alarm
    
    @staticmethod
    def delete_alarm(db: Session, alarm_id: int) -> bool:
        """Delete alarm"""
        db_alarm = AlarmService.get_alarm_by_id(db, alarm_id)
        if not db_alarm:
            return False
        
        db.delete(db_alarm)
        db.commit()
        logger.info(f"Deleted alarm: {db_alarm.title}")
        return True
    
    @staticmethod
    def acknowledge_alarm(db: Session, alarm_id: int, acknowledged_by: str) -> Optional[Alarm]:
        """Acknowledge an alarm"""
        db_alarm = AlarmService.get_alarm_by_id(db, alarm_id)
        if not db_alarm:
            return None
        
        db_alarm.status = "acknowledged"
        db_alarm.acknowledged_by = acknowledged_by
        db_alarm.acknowledged_at = datetime.utcnow()
        db_alarm.updated_at = datetime.utcnow()
        
        # Also acknowledge in Zabbix if we have the event ID
        if db_alarm.zabbix_event_id:
            try:
                zabbix_service.acknowledge_event(
                    db_alarm.zabbix_event_id, 
                    f"Acknowledged by {acknowledged_by}"
                )
            except Exception as e:
                logger.warning(f"Failed to acknowledge in Zabbix: {e}")
        
        db.commit()
        db.refresh(db_alarm)
        logger.info(f"Alarm acknowledged: {db_alarm.title} by {acknowledged_by}")
        return db_alarm
    
    @staticmethod
    def resolve_alarm(db: Session, alarm_id: int) -> Optional[Alarm]:
        """Resolve an alarm"""
        db_alarm = AlarmService.get_alarm_by_id(db, alarm_id)
        if not db_alarm:
            return None
        
        db_alarm.status = "resolved"
        db_alarm.resolved_at = datetime.utcnow()
        db_alarm.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_alarm)
        logger.info(f"Alarm resolved: {db_alarm.title}")
        return db_alarm
    
    @staticmethod
    def sync_alarms_with_zabbix(db: Session) -> Dict[str, int]:
        """Synchronize alarms with Zabbix events"""
        try:
            # Get recent events from Zabbix (last 24 hours)
            zabbix_events = zabbix_service.get_events(
                time_from=datetime.now() - timedelta(hours=24)
            )
            
            synced_count = 0
            created_count = 0
            updated_count = 0
            
            for zabbix_event in zabbix_events:
                # Check if alarm exists
                existing_alarm = AlarmService.get_alarm_by_zabbix_event_id(db, zabbix_event.eventid)
                
                if existing_alarm:
                    # Update existing alarm if needed
                    if existing_alarm.status != "resolved" and zabbix_event.value == "0":
                        existing_alarm.status = "resolved"
                        existing_alarm.resolved_at = datetime.utcnow()
                        existing_alarm.updated_at = datetime.utcnow()
                        updated_count += 1
                else:
                    # Create new alarm
                    # Map Zabbix priority to alarm type
                    priority_map = {
                        "0": "info",
                        "1": "warning", 
                        "2": "warning",
                        "3": "critical",
                        "4": "critical",
                        "5": "critical"
                    }
                    
                    alarm_type = priority_map.get(zabbix_event.priority, "info")
                    
                    # Map priority to severity
                    severity_map = {
                        "0": "low",
                        "1": "low",
                        "2": "medium",
                        "3": "high",
                        "4": "high",
                        "5": "high"
                    }
                    
                    severity = severity_map.get(zabbix_event.priority, "low")
                    
                    # Find equipment by Zabbix host ID
                    equipment = db.query(Equipment).filter(
                        Equipment.zabbix_host_id == zabbix_event.objectid
                    ).first()
                    
                    if equipment:
                        alarm_data = AlarmCreate(
                            equipment_id=equipment.id,
                            zabbix_event_id=zabbix_event.eventid,
                            zabbix_trigger_id=zabbix_event.objectid,
                            zabbix_host_id=zabbix_event.objectid,
                            alarm_type=alarm_type,
                            severity=severity,
                            title=zabbix_event.name or "Zabbix Event",
                            description=f"Event from Zabbix: {zabbix_event.name}",
                            status="active" if zabbix_event.value == "1" else "resolved"
                        )
                        
                        AlarmService.create_alarm(db, alarm_data)
                        created_count += 1
                
                synced_count += 1
            
            logger.info(f"Alarm sync completed: {synced_count} synced, {created_count} created, {updated_count} updated")
            
            return {
                "synced": synced_count,
                "created": created_count,
                "updated": updated_count
            }
        
        except Exception as e:
            logger.error(f"Failed to sync alarms with Zabbix: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def get_alarm_stats(db: Session) -> Dict[str, int]:
        """Get alarm statistics"""
        total_active = db.query(Alarm).filter(Alarm.status == "active").count()
        total_acknowledged = db.query(Alarm).filter(Alarm.status == "acknowledged").count()
        total_resolved = db.query(Alarm).filter(Alarm.status == "resolved").count()
        
        critical_active = db.query(Alarm).filter(
            and_(Alarm.status == "active", Alarm.alarm_type == "critical")
        ).count()
        
        warning_active = db.query(Alarm).filter(
            and_(Alarm.status == "active", Alarm.alarm_type == "warning")
        ).count()
        
        # Resolved today
        today = datetime.now().date()
        resolved_today = db.query(Alarm).filter(
            and_(
                Alarm.status == "resolved",
                func.date(Alarm.resolved_at) == today
            )
        ).count()
        
        return {
            "active": total_active,
            "acknowledged": total_acknowledged,
            "resolved": total_resolved,
            "critical_active": critical_active,
            "warning_active": warning_active,
            "resolved_today": resolved_today
        }
    
    @staticmethod
    def get_alarms_by_equipment(db: Session, equipment_id: int, 
                               status: str = None) -> List[Alarm]:
        """Get alarms for specific equipment"""
        query = db.query(Alarm).filter(Alarm.equipment_id == equipment_id)
        
        if status:
            query = query.filter(Alarm.status == status)
        
        return query.order_by(desc(Alarm.created_at)).all()
    
    @staticmethod
    def get_recent_alarms(db: Session, hours: int = 24) -> List[Alarm]:
        """Get recent alarms"""
        since = datetime.now() - timedelta(hours=hours)
        return db.query(Alarm).filter(
            Alarm.created_at >= since
        ).order_by(desc(Alarm.created_at)).all()
    
    @staticmethod
    def get_alarm_trends(db: Session, days: int = 7) -> List[Dict[str, Any]]:
        """Get alarm trends over time"""
        since = datetime.now() - timedelta(days=days)
        
        # Group by date and count alarms
        trends = db.query(
            func.date(Alarm.created_at).label('date'),
            func.count(Alarm.id).label('count'),
            Alarm.alarm_type
        ).filter(
            Alarm.created_at >= since
        ).group_by(
            func.date(Alarm.created_at),
            Alarm.alarm_type
        ).all()
        
        return [
            {
                "date": trend.date,
                "count": trend.count,
                "alarm_type": trend.alarm_type
            }
            for trend in trends
        ] 