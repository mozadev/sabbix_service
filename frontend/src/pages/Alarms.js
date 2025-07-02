import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Sync as SyncIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
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

function Alarms() {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [totalRows, setTotalRows] = useState(0);
  const navigate = useNavigate();

  const fetchAlarms = async () => {
    try {
      setLoading(true);
      const params = {
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (typeFilter) {
        params.alarm_type = typeFilter;
      }

      const response = await axios.get('/api/v1/alarms/', { params });
      setAlarms(response.data.items);
      setTotalRows(response.data.total);
      setError(null);
    } catch (err) {
      setError('Error al cargar las alarmas');
      console.error('Error fetching alarms:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncWithZabbix = async () => {
    try {
      await axios.post('/api/v1/alarms/sync');
      fetchAlarms();
    } catch (err) {
      setError('Error al sincronizar con Zabbix');
      console.error('Error syncing with Zabbix:', err);
    }
  };

  useEffect(() => {
    fetchAlarms();
  }, [paginationModel, statusFilter, typeFilter]);

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const handleTypeFilter = (event) => {
    setTypeFilter(event.target.value);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const columns = [
    {
      field: 'title',
      headerName: 'Título',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'alarm_type',
      headerName: 'Tipo',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={alarmTypeColors[params.value] || 'default'}
          size="small"
          icon={params.value === 'critical' ? <WarningIcon /> : undefined}
        />
      ),
    },
    {
      field: 'severity',
      headerName: 'Severidad',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'high' ? 'error' : params.value === 'medium' ? 'warning' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Estado',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={statusColors[params.value] || 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'equipment_id',
      headerName: 'Equipo',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        // This would need to be enhanced to show equipment name
        return `Equipo ${params.value}`;
      },
    },
    {
      field: 'created_at',
      headerName: 'Creada',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => {
        if (!params.value) return 'N/A';
        return new Date(params.value).toLocaleString('es-ES');
      },
    },
    {
      field: 'acknowledged_by',
      headerName: 'Acknowledged Por',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => {
        return params.value || 'N/A';
      },
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Tooltip title="Ver detalles">
            <IconButton
              onClick={() => navigate(`/alarms/${params.row.id}`)}
              size="small"
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          {params.row.status === 'active' && (
            <Tooltip title="Acknowledgment">
              <IconButton
                onClick={() => handleAcknowledge(params.row.id)}
                size="small"
                color="warning"
              >
                <CheckCircleIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const handleAcknowledge = async (alarmId) => {
    try {
      await axios.post(`/api/v1/alarms/${alarmId}/acknowledge`, {
        acknowledged_by: 'Usuario Actual', // This should come from auth context
      });
      fetchAlarms();
    } catch (err) {
      setError('Error al hacer acknowledgment de la alarma');
      console.error('Error acknowledging alarm:', err);
    }
  };

  if (loading && alarms.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Alarmas
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={syncWithZabbix}
          >
            Sincronizar con Zabbix
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAlarms}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filtrar por estado"
                  onChange={handleStatusFilter}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="active">Activas</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="resolved">Resueltas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por tipo</InputLabel>
                <Select
                  value={typeFilter}
                  label="Filtrar por tipo"
                  onChange={handleTypeFilter}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="critical">Críticas</MenuItem>
                  <MenuItem value="warning">Advertencias</MenuItem>
                  <MenuItem value="info">Información</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" height="100%">
                <Typography variant="body2" color="text.secondary">
                  Total: {totalRows} alarmas
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={alarms}
              columns={columns}
              pagination
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50, 100]}
              rowCount={totalRows}
              paginationMode="server"
              loading={loading}
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Alarms; 