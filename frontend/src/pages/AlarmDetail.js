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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const alarmTypeColors = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

const statusColors = {
  active: 'error',
  acknowledged: 'warning',
  resolved: 'success',
};

const statusIcons = {
  active: <ErrorIcon />,
  acknowledged: <WarningIcon />,
  resolved: <CheckCircleIcon />,
};

function AlarmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alarm, setAlarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [documentation, setDocumentation] = useState('');

  const fetchAlarm = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/alarms/${id}`);
      setAlarm(response.data);
      setDocumentation(response.data.documentation || '');
      setError(null);
    } catch (err) {
      setError('Error al cargar los detalles de la alarma');
      console.error('Error fetching alarm details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    if (alarm?.equipment_id) {
      try {
        const response = await axios.get(`/api/v1/equipment/${alarm.equipment_id}`);
        setEquipment(response.data);
      } catch (err) {
        console.error('Error fetching equipment details:', err);
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchAlarm();
    }
  }, [id]);

  useEffect(() => {
    if (alarm) {
      fetchEquipment();
    }
  }, [alarm]);

  const handleAcknowledge = async () => {
    try {
      await axios.post(`/api/v1/alarms/${id}/acknowledge`, {
        acknowledged_by: 'Usuario Actual' // Esto debería venir del sistema de autenticación
      });
      fetchAlarm();
    } catch (err) {
      setError('Error al hacer acknowledgment de la alarma');
      console.error('Error acknowledging alarm:', err);
    }
  };

  const handleResolve = async () => {
    try {
      await axios.post(`/api/v1/alarms/${id}/resolve`);
      fetchAlarm();
    } catch (err) {
      setError('Error al resolver la alarma');
      console.error('Error resolving alarm:', err);
    }
  };

  const handleSaveDocumentation = async () => {
    try {
      await axios.put(`/api/v1/alarms/${id}`, {
        documentation: documentation
      });
      setEditDialog(false);
      fetchAlarm();
    } catch (err) {
      setError('Error al guardar la documentación');
      console.error('Error saving documentation:', err);
    }
  };

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
        <Button color="inherit" size="small" onClick={fetchAlarm}>
          Reintentar
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!alarm) {
    return <Alert severity="info">Alarma no encontrada</Alert>;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/alarms')}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          Detalles de la Alarma
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Información Principal */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <WarningIcon 
                  color={alarmTypeColors[alarm.alarm_type]} 
                  sx={{ fontSize: 40 }} 
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" gutterBottom>
                    {alarm.title}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    {alarm.description}
                  </Typography>
                </Box>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Chip
                    icon={statusIcons[alarm.status]}
                    label={alarm.status}
                    color={statusColors[alarm.status]}
                    size="large"
                  />
                  <Chip
                    label={alarm.alarm_type}
                    color={alarmTypeColors[alarm.alarm_type]}
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Creada"
                        secondary={new Date(alarm.created_at).toLocaleString('es-ES')}
                      />
                    </ListItem>
                    {alarm.acknowledged_at && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Acknowledged"
                          secondary={`${alarm.acknowledged_by} - ${new Date(alarm.acknowledged_at).toLocaleString('es-ES')}`}
                        />
                      </ListItem>
                    )}
                    {alarm.resolved_at && (
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Resuelta"
                          secondary={new Date(alarm.resolved_at).toLocaleString('es-ES')}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Severidad"
                        secondary={alarm.severity}
                      />
                    </ListItem>
                    {equipment && (
                      <ListItem>
                        <ListItemIcon>
                          <ComputerIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Equipo"
                          secondary={equipment.name}
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Tipo"
                        secondary={alarm.alarm_type}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Documentación */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Documentación
                </Typography>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setEditDialog(true)}
                >
                  Editar
                </Button>
              </Box>
              
              <Typography variant="body1" color="textSecondary">
                {alarm.documentation || 'No hay documentación disponible para esta alarma.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel de Acciones */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Acciones
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                {alarm.status === 'active' && (
                  <>
                    <Button
                      variant="contained"
                      color="warning"
                      fullWidth
                      onClick={handleAcknowledge}
                    >
                      Hacer Acknowledgment
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={handleResolve}
                    >
                      Resolver Alarma
                    </Button>
                  </>
                )}
                
                {equipment && (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate(`/equipment/${equipment.id}`)}
                  >
                    Ver Equipo
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => window.open(`http://10.232.35.243:8080`, '_blank')}
                >
                  Abrir en Zabbix
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Información del Sistema
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">ID:</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {alarm.id}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Estado:</Typography>
                  <Chip
                    label={alarm.status}
                    color={statusColors[alarm.status]}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Tipo:</Typography>
                  <Chip
                    label={alarm.alarm_type}
                    color={alarmTypeColors[alarm.alarm_type]}
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog para editar documentación */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Documentación</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Documentación"
            fullWidth
            multiline
            rows={6}
            value={documentation}
            onChange={(e) => setDocumentation(e.target.value)}
            placeholder="Describe los pasos tomados para resolver esta alarma..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveDocumentation} startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AlarmDetail; 