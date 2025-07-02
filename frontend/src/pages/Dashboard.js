import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import ZabbixStatusCard from '../components/ZabbixStatusCard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/dashboard/stats');
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las estadísticas del dashboard');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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
        <Button color="inherit" size="small" onClick={fetchStats}>
          Reintentar
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return <Alert severity="info">No hay datos disponibles</Alert>;
  }

  const equipmentData = [
    { name: 'Online', value: stats.equipment.online, color: '#4caf50' },
    { name: 'Offline', value: stats.equipment.offline, color: '#f44336' },
    { name: 'Mantenimiento', value: stats.equipment.maintenance, color: '#ff9800' },
  ];

  const alarmData = [
    { name: 'Críticas', value: stats.alarms.critical_active, color: '#f44336' },
    { name: 'Advertencias', value: stats.alarms.warning_active, color: '#ff9800' },
    { name: 'Acknowledged', value: stats.alarms.acknowledged, color: '#2196f3' },
  ];

  const chartData = [
    { name: 'Equipos Online', value: stats.equipment.online },
    { name: 'Equipos Offline', value: stats.equipment.offline },
    { name: 'Alarmas Críticas', value: stats.alarms.critical_active },
    { name: 'Alarmas Warning', value: stats.alarms.warning_active },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchStats}
        >
          Actualizar
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Equipos
                  </Typography>
                  <Typography variant="h4">
                    {stats.equipment.total}
                  </Typography>
                </Box>
                <ComputerIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Equipos Online
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.equipment.online}
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Alarmas Activas
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.alarms.active}
                  </Typography>
                </Box>
                <WarningIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Alarmas Críticas
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.alarms.critical_active}
                  </Typography>
                </Box>
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado de Equipos
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={equipmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {equipmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado de Alarmas
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={alarmData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {alarmData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen General
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Info */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} md={4}>
          <ZabbixStatusCard />
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información Adicional
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Equipos en Mantenimiento:</Typography>
                  <Chip label={stats.equipment.maintenance} color="warning" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Alarmas Resueltas Hoy:</Typography>
                  <Chip label={stats.alarms.resolved_today} color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Alarmas Acknowledged:</Typography>
                  <Chip label={stats.alarms.acknowledged} color="info" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Última Actualización
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {format(new Date(stats.timestamp), 'PPP p', { locale: es })}
              </Typography>
              <Box mt={2}>
                <Chip
                  label="Sistema Operativo"
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label="Zabbix Conectado"
                  color="success"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 