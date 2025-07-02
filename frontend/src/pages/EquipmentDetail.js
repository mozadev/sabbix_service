import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Computer as ComputerIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  NetworkCheck as NetworkIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const statusColors = {
  online: 'success',
  offline: 'error',
  maintenance: 'warning',
};

const statusIcons = {
  online: <CheckCircleIcon />,
  offline: <ErrorIcon />,
  maintenance: <WarningIcon />,
};

function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alarms, setAlarms] = useState([]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/equipment/${id}`);
      setEquipment(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los detalles del equipo');
      console.error('Error fetching equipment details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlarms = async () => {
    try {
      const response = await axios.get(`/api/v1/alarms/equipment/${id}`);
      setAlarms(response.data);
    } catch (err) {
      console.error('Error fetching equipment alarms:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEquipment();
      fetchAlarms();
    }
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={fetchEquipment}>
          Reintentar
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!equipment) {
    return <Alert severity="info">Equipo no encontrado</Alert>;
  }

  const activeAlarms = alarms.filter(alarm => alarm.status === 'active');
  const criticalAlarms = activeAlarms.filter(alarm => alarm.alarm_type === 'critical');

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/equipment')}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          Detalles del Equipo
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Información Principal */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <ComputerIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {equipment.name}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    {equipment.hostname}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    icon={statusIcons[equipment.status]}
                    label={equipment.status}
                    color={statusColors[equipment.status]}
                    size="large"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <NetworkIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Dirección IP"
                        secondary={equipment.ip_address}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Cliente"
                        secondary={equipment.client_name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Ubicación"
                        secondary={equipment.location}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <ComputerIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Tipo de Equipo"
                        secondary={equipment.equipment_type}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Última Vez Visto"
                        secondary={equipment.last_seen ? 
                          new Date(equipment.last_seen).toLocaleString('es-ES') : 
                          'N/A'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Alarmas Activas"
                        secondary={`${activeAlarms.length} alarmas`}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel de Estado */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado del Sistema
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Estado:</Typography>
                  <Chip
                    label={equipment.status}
                    color={statusColors[equipment.status]}
                    size="small"
                  />
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Alarmas Críticas:</Typography>
                  <Chip
                    label={criticalAlarms.length}
                    color="error"
                    size="small"
                  />
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Alarmas Activas:</Typography>
                  <Chip
                    label={activeAlarms.length}
                    color="warning"
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Acciones Rápidas
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(`/alarms?equipment=${id}`)}
                >
                  Ver Alarmas
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => window.open(`http://10.232.35.243:8080`, '_blank')}
                >
                  Abrir en Zabbix
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Alarmas Recientes */}
        {activeAlarms.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alarmas Activas
                </Typography>
                
                <List>
                  {activeAlarms.slice(0, 5).map((alarm) => (
                    <ListItem key={alarm.id} divider>
                      <ListItemIcon>
                        <WarningIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={alarm.title}
                        secondary={`${alarm.alarm_type} - ${new Date(alarm.created_at).toLocaleString('es-ES')}`}
                      />
                      <Chip
                        label={alarm.alarm_type}
                        color={alarm.alarm_type === 'critical' ? 'error' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
                
                {activeAlarms.length > 5 && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/alarms?equipment=${id}`)}
                    >
                      Ver Todas las Alarmas
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default EquipmentDetail; 