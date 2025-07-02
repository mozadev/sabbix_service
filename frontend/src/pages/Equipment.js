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
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const statusColors = {
  online: 'success',
  offline: 'error',
  maintenance: 'warning',
};

function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [totalRows, setTotalRows] = useState(0);
  const navigate = useNavigate();

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = {
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await axios.get('/api/v1/equipment/', { params });
      setEquipment(response.data.items);
      setTotalRows(response.data.total);
      setError(null);
    } catch (err) {
      setError('Error al cargar los equipos');
      console.error('Error fetching equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncWithZabbix = async () => {
    try {
      await axios.post('/api/v1/equipment/sync');
      fetchEquipment();
    } catch (err) {
      setError('Error al sincronizar con Zabbix');
      console.error('Error syncing with Zabbix:', err);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [paginationModel, searchTerm, statusFilter]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'hostname',
      headerName: 'Hostname',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'ip_address',
      headerName: 'IP',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'equipment_type',
      headerName: 'Tipo',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'client_name',
      headerName: 'Cliente',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'location',
      headerName: 'Ubicación',
      flex: 1,
      minWidth: 120,
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
      field: 'last_seen',
      headerName: 'Última Vez',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => {
        if (!params.value) return 'N/A';
        return new Date(params.value).toLocaleString('es-ES');
      },
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 1,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Ver detalles">
          <IconButton
            onClick={() => navigate(`/equipment/${params.row.id}`)}
            size="small"
          >
            <ViewIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (loading && equipment.length === 0) {
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
          Equipos
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
            onClick={fetchEquipment}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Buscar equipos"
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                placeholder="Buscar por nombre, hostname, IP o cliente..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filtrar por estado"
                  onChange={handleStatusFilter}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="maintenance">Mantenimiento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display="flex" alignItems="center" height="100%">
                <Typography variant="body2" color="text.secondary">
                  Total: {totalRows} equipos
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={equipment}
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

export default Equipment; 