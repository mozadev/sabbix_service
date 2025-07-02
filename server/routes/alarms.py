from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..schemas import Alarm, AlarmCreate, AlarmUpdate, PaginatedResponse
from ..services.alarm_service import AlarmService

router = APIRouter(prefix="/alarms", tags=["alarms"])


@router.get("/", response_model=PaginatedResponse)
def get_alarms(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    alarm_type: Optional[str] = None,
    equipment_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get alarms with pagination and filtering"""
    alarms = AlarmService.get_alarms(
        db, skip=skip, limit=limit,
        status=status, alarm_type=alarm_type, equipment_id=equipment_id
    )
    
    # Get total count for pagination
    total = AlarmService.get_alarms(db, skip=0, limit=10000,
                                  status=status, alarm_type=alarm_type, equipment_id=equipment_id)
    total_count = len(total)
    
    return PaginatedResponse(
        items=alarms,
        total=total_count,
        page=skip // limit + 1,
        size=limit,
        pages=(total_count + limit - 1) // limit
    )


@router.get("/{alarm_id}", response_model=Alarm)
def get_alarm_by_id(alarm_id: int, db: Session = Depends(get_db)):
    """Get alarm by ID"""
    alarm = AlarmService.get_alarm_by_id(db, alarm_id)
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    return alarm


@router.post("/", response_model=Alarm)
def create_alarm(alarm: AlarmCreate, db: Session = Depends(get_db)):
    """Create new alarm"""
    # Check if alarm with same Zabbix event ID already exists
    existing = AlarmService.get_alarm_by_zabbix_event_id(db, alarm.zabbix_event_id)
    if existing:
        raise HTTPException(status_code=400, detail="Alarm with this Zabbix event ID already exists")
    
    return AlarmService.create_alarm(db, alarm)


@router.put("/{alarm_id}", response_model=Alarm)
def update_alarm(
    alarm_id: int,
    alarm_update: AlarmUpdate,
    db: Session = Depends(get_db)
):
    """Update alarm"""
    alarm = AlarmService.update_alarm(db, alarm_id, alarm_update)
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    return alarm


@router.delete("/{alarm_id}")
def delete_alarm(alarm_id: int, db: Session = Depends(get_db)):
    """Delete alarm"""
    success = AlarmService.delete_alarm(db, alarm_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alarm not found")
    return {"message": "Alarm deleted successfully"}


@router.post("/{alarm_id}/acknowledge", response_model=Alarm)
def acknowledge_alarm(
    alarm_id: int,
    acknowledged_by: str,
    db: Session = Depends(get_db)
):
    """Acknowledge an alarm"""
    alarm = AlarmService.acknowledge_alarm(db, alarm_id, acknowledged_by)
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    return alarm


@router.post("/{alarm_id}/resolve", response_model=Alarm)
def resolve_alarm(alarm_id: int, db: Session = Depends(get_db)):
    """Resolve an alarm"""
    alarm = AlarmService.resolve_alarm(db, alarm_id)
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    return alarm


@router.post("/sync")
def sync_alarms_with_zabbix(db: Session = Depends(get_db)):
    """Synchronize alarms with Zabbix"""
    result = AlarmService.sync_alarms_with_zabbix(db)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.get("/stats/summary")
def get_alarm_stats(db: Session = Depends(get_db)):
    """Get alarm statistics"""
    return AlarmService.get_alarm_stats(db)


@router.get("/equipment/{equipment_id}", response_model=List[Alarm])
def get_alarms_by_equipment(
    equipment_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get alarms for specific equipment"""
    return AlarmService.get_alarms_by_equipment(db, equipment_id, status)


@router.get("/recent/{hours}", response_model=List[Alarm])
def get_recent_alarms(hours: int = 24, db: Session = Depends(get_db)):
    """Get recent alarms"""
    if hours < 1 or hours > 168:  # Max 1 week
        raise HTTPException(status_code=400, detail="Hours must be between 1 and 168")
    
    return AlarmService.get_recent_alarms(db, hours)


@router.get("/trends/{days}")
def get_alarm_trends(days: int = 7, db: Session = Depends(get_db)):
    """Get alarm trends over time"""
    if days < 1 or days > 30:  # Max 30 days
        raise HTTPException(status_code=400, detail="Days must be between 1 and 30")
    
    return AlarmService.get_alarm_trends(db, days)


@router.get("/active/critical", response_model=List[Alarm])
def get_critical_active_alarms(db: Session = Depends(get_db)):
    """Get all critical active alarms"""
    return AlarmService.get_alarms(db, status="active", alarm_type="critical")


@router.get("/active/warning", response_model=List[Alarm])
def get_warning_active_alarms(db: Session = Depends(get_db)):
    """Get all warning active alarms"""
    return AlarmService.get_alarms(db, status="active", alarm_type="warning") 