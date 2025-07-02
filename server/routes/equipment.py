from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..schemas import Equipment, EquipmentCreate, EquipmentUpdate, EquipmentWithAlarms, PaginatedResponse
from ..services.equipment_service import EquipmentService

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("/", response_model=PaginatedResponse)
def get_equipment(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    client_name: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get equipment with pagination and filtering"""
    equipment = EquipmentService.get_equipment(
        db, skip=skip, limit=limit, 
        client_name=client_name, status=status
    )
    
    # Get total count for pagination
    total = EquipmentService.get_equipment(db, skip=0, limit=10000, 
                                         client_name=client_name, status=status)
    total_count = len(total)
    
    return PaginatedResponse(
        items=equipment,
        total=total_count,
        page=skip // limit + 1,
        size=limit,
        pages=(total_count + limit - 1) // limit
    )


@router.get("/{equipment_id}", response_model=Equipment)
def get_equipment_by_id(equipment_id: int, db: Session = Depends(get_db)):
    """Get equipment by ID"""
    equipment = EquipmentService.get_equipment_by_id(db, equipment_id)
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment


@router.get("/{equipment_id}/with-alarms", response_model=EquipmentWithAlarms)
def get_equipment_with_alarms(equipment_id: int, db: Session = Depends(get_db)):
    """Get equipment with its alarms"""
    equipment = EquipmentService.get_equipment_with_alarms(db, equipment_id)
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment


@router.post("/", response_model=Equipment)
def create_equipment(equipment: EquipmentCreate, db: Session = Depends(get_db)):
    """Create new equipment"""
    # Check if equipment with same Zabbix host ID already exists
    existing = EquipmentService.get_equipment_by_zabbix_id(db, equipment.zabbix_host_id)
    if existing:
        raise HTTPException(status_code=400, detail="Equipment with this Zabbix host ID already exists")
    
    return EquipmentService.create_equipment(db, equipment)


@router.put("/{equipment_id}", response_model=Equipment)
def update_equipment(
    equipment_id: int, 
    equipment_update: EquipmentUpdate, 
    db: Session = Depends(get_db)
):
    """Update equipment"""
    equipment = EquipmentService.update_equipment(db, equipment_id, equipment_update)
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment


@router.delete("/{equipment_id}")
def delete_equipment(equipment_id: int, db: Session = Depends(get_db)):
    """Delete equipment"""
    success = EquipmentService.delete_equipment(db, equipment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {"message": "Equipment deleted successfully"}


@router.post("/sync")
def sync_equipment_with_zabbix(db: Session = Depends(get_db)):
    """Synchronize equipment with Zabbix"""
    result = EquipmentService.sync_with_zabbix(db)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.get("/stats/summary")
def get_equipment_stats(db: Session = Depends(get_db)):
    """Get equipment statistics"""
    return EquipmentService.get_equipment_stats(db)


@router.get("/client/{client_name}", response_model=List[Equipment])
def get_equipment_by_client(client_name: str, db: Session = Depends(get_db)):
    """Get all equipment for a specific client"""
    return EquipmentService.get_equipment_by_client(db, client_name)


@router.get("/{equipment_id}/health")
def get_equipment_health(equipment_id: int, db: Session = Depends(get_db)):
    """Get equipment health status"""
    health = EquipmentService.get_equipment_health(db, equipment_id)
    if not health:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return health


@router.get("/search/{search_term}", response_model=List[Equipment])
def search_equipment(search_term: str, db: Session = Depends(get_db)):
    """Search equipment by name, hostname, IP, or client"""
    return EquipmentService.search_equipment(db, search_term) 