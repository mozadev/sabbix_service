import requests
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from ..config import settings
from ..schemas import ZabbixHost, ZabbixTrigger, ZabbixEvent

logger = logging.getLogger(__name__)


class ZabbixService:
    def __init__(self):
        self.url = settings.zabbix_url
        self.username = settings.zabbix_user
        self.password = settings.zabbix_password
        self.auth_token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json-rpc',
            'User-Agent': 'ZabbixMonitor/1.0'
        })
    
    def _make_request(self, method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Make a request to Zabbix API"""
        if params is None:
            params = {}
        
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1
        }
        
        if self.auth_token:
            payload["auth"] = self.auth_token
        
        try:
            response = self.session.post(self.url, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            if "error" in result:
                logger.error(f"Zabbix API error: {result['error']}")
                raise Exception(f"Zabbix API error: {result['error']}")
            
            return result.get("result", {})
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Request to Zabbix API failed: {e}")
            raise Exception(f"Failed to connect to Zabbix API: {e}")
    
    def authenticate(self) -> bool:
        """Authenticate with Zabbix API"""
        try:
            params = {
                "user": self.username,
                "password": self.password
            }
            
            result = self._make_request("user.login", params)
            self.auth_token = result
            logger.info("Successfully authenticated with Zabbix API")
            return True
        
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False
    
    def get_hosts(self, filter_params: Dict[str, Any] = None) -> List[ZabbixHost]:
        """Get all hosts from Zabbix"""
        try:
            if not self.auth_token:
                if not self.authenticate():
                    raise Exception("Authentication failed")
            
            params = {
                "output": ["hostid", "host", "name", "status", "available"],
                "selectInterfaces": ["ip"],
                "selectGroups": ["name"],
                "selectTags": ["tag", "value"]
            }
            
            if filter_params:
                params.update(filter_params)
            
            result = self._make_request("host.get", params)
            
            hosts = []
            for host_data in result:
                host = ZabbixHost(
                    hostid=host_data["hostid"],
                    host=host_data["host"],
                    name=host_data["name"],
                    status=host_data["status"],
                    available=host_data["available"]
                )
                hosts.append(host)
            
            return hosts
        
        except Exception as e:
            logger.error(f"Failed to get hosts: {e}")
            return []
    
    def get_triggers(self, hostids: List[str] = None, only_active: bool = True) -> List[ZabbixTrigger]:
        """Get triggers from Zabbix"""
        try:
            if not self.auth_token:
                if not self.authenticate():
                    raise Exception("Authentication failed")
            
            params = {
                "output": ["triggerid", "description", "expression", "priority", "value", "lastchange"],
                "expandDescription": True,
                "selectHosts": ["hostid", "name"],
                "selectItems": ["itemid", "name"]
            }
            
            if hostids:
                params["hostids"] = hostids
            
            if only_active:
                params["only_true"] = True
                params["active"] = True
            
            result = self._make_request("trigger.get", params)
            
            triggers = []
            for trigger_data in result:
                trigger = ZabbixTrigger(
                    triggerid=trigger_data["triggerid"],
                    description=trigger_data["description"],
                    expression=trigger_data["expression"],
                    priority=trigger_data["priority"],
                    value=trigger_data["value"],
                    lastchange=trigger_data["lastchange"]
                )
                triggers.append(trigger)
            
            return triggers
        
        except Exception as e:
            logger.error(f"Failed to get triggers: {e}")
            return []
    
    def get_events(self, time_from: datetime = None, time_till: datetime = None, 
                   objectids: List[str] = None) -> List[ZabbixEvent]:
        """Get events from Zabbix"""
        try:
            if not self.auth_token:
                if not self.authenticate():
                    raise Exception("Authentication failed")
            
            if time_from is None:
                time_from = datetime.now() - timedelta(hours=24)
            
            if time_till is None:
                time_till = datetime.now()
            
            params = {
                "output": ["eventid", "source", "object", "objectid", "clock", "value", "acknowledged", "name"],
                "time_from": int(time_from.timestamp()),
                "time_till": int(time_till.timestamp()),
                "sortfield": "clock",
                "sortorder": "DESC"
            }
            
            if objectids:
                params["objectids"] = objectids
            
            result = self._make_request("event.get", params)
            
            events = []
            for event_data in result:
                event = ZabbixEvent(
                    eventid=event_data["eventid"],
                    source=event_data["source"],
                    object=event_data["object"],
                    objectid=event_data["objectid"],
                    clock=event_data["clock"],
                    value=event_data["value"],
                    acknowledged=event_data["acknowledged"],
                    name=event_data["name"]
                )
                events.append(event)
            
            return events
        
        except Exception as e:
            logger.error(f"Failed to get events: {e}")
            return []
    
    def get_host_metrics(self, hostid: str, item_keys: List[str] = None, 
                        time_from: datetime = None, time_till: datetime = None) -> List[Dict[str, Any]]:
        """Get metrics for a specific host"""
        try:
            if not self.auth_token:
                if not self.authenticate():
                    raise Exception("Authentication failed")
            
            if time_from is None:
                time_from = datetime.now() - timedelta(hours=1)
            
            if time_till is None:
                time_till = datetime.now()
            
            # First get items
            item_params = {
                "output": ["itemid", "name", "key_", "value_type"],
                "hostids": [hostid],
                "sortfield": "name"
            }
            
            if item_keys:
                item_params["search"] = {"key_": item_keys}
            
            items = self._make_request("item.get", item_params)
            
            if not items:
                return []
            
            # Get history for items
            itemids = [item["itemid"] for item in items]
            history_params = {
                "output": "extend",
                "itemids": itemids,
                "time_from": int(time_from.timestamp()),
                "time_till": int(time_till.timestamp()),
                "sortfield": "clock",
                "sortorder": "DESC",
                "limit": 100
            }
            
            history = self._make_request("item.get", history_params)
            
            return history
        
        except Exception as e:
            logger.error(f"Failed to get host metrics: {e}")
            return []
    
    def acknowledge_event(self, eventid: str, message: str = "") -> bool:
        """Acknowledge an event in Zabbix"""
        try:
            if not self.auth_token:
                if not self.authenticate():
                    raise Exception("Authentication failed")
            
            params = {
                "eventids": [eventid],
                "message": message,
                "action": 6  # Acknowledge
            }
            
            result = self._make_request("event.acknowledge", params)
            logger.info(f"Successfully acknowledged event {eventid}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to acknowledge event {eventid}: {e}")
            return False
    
    def get_host_status(self, hostid: str) -> Dict[str, Any]:
        """Get detailed status of a host"""
        try:
            if not self.auth_token:
                if not self.authenticate():
                    raise Exception("Authentication failed")
            
            params = {
                "output": ["hostid", "host", "name", "status", "available"],
                "hostids": [hostid],
                "selectInterfaces": ["ip", "port", "type"],
                "selectItems": ["itemid", "name", "key_", "status", "lastvalue", "lastclock"],
                "selectTriggers": ["triggerid", "description", "priority", "value"]
            }
            
            result = self._make_request("host.get", params)
            
            if result:
                return result[0]
            return {}
        
        except Exception as e:
            logger.error(f"Failed to get host status: {e}")
            return {}
    
    def test_connection(self) -> bool:
        """Test connection to Zabbix API"""
        try:
            return self.authenticate()
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False


# Global instance
zabbix_service = ZabbixService() 