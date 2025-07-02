import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Divider,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ZabbixIntegration = () => {
  const [zabbixUrl, setZabbixUrl] = useState('http://10.232.35.243:8080');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  // Verificar conexión con Zabbix
  const checkZabbixConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/zabbix/test');
      setConnectionStatus(response.data.success ? 'connected' : 'failed');
      setError(null);
    } catch (err) {
      setConnectionStatus('failed');
      setError('No se pudo conectar con Zabbix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkZabbixConnection();
  }, []);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openZabbixInNewTab = () => {
    window.open(zabbixUrl, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'failed':
        return 'Error de Conexión';
      default:
        return 'Verificando...';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard de Zabbix
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Verificar Conexión">
            <IconButton 
              onClick={checkZabbixConnection}
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Salir Pantalla Completa" : "Pantalla Completa"}>
            <IconButton onClick={handleFullscreen}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<OpenInNewIcon />}
            onClick={openZabbixInNewTab}
          >
            Abrir en Nueva Pestaña
          </Button>
        </Box>
      </Box>

      {/* Estado de Conexión */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h6">
                Estado de Conexión Zabbix
              </Typography>
              <Chip
                label={getStatusText(connectionStatus)}
                color={getStatusColor(connectionStatus)}
                size="small"
              />
            </Box>
            {loading && <CircularProgress size={20} />}
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Contenedor de Zabbix */}
      <Card 
        sx={{ 
          height: isFullscreen ? 'calc(100vh - 200px)' : '600px',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 0, height: '100%' }}>
          {connectionStatus === 'connected' ? (
            <iframe
              src={zabbixUrl}
              title="Zabbix Dashboard"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px'
              }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setError('Error al cargar Zabbix');
                setLoading(false);
              }}
            />
          ) : (
            <Box 
              display="flex" 
              flexDirection="column"
              alignItems="center" 
              justifyContent="center" 
              height="100%"
              gap={2}
            >
              <Typography variant="h6" color="textSecondary">
                No se puede conectar con Zabbix
              </Typography>
              <Button
                variant="outlined"
                onClick={checkZabbixConnection}
                disabled={loading}
              >
                Reintentar Conexión
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Acceso Directo a Zabbix
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                URL: {zabbixUrl}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={openZabbixInNewTab}
                fullWidth
              >
                Abrir Zabbix Completo
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Funcionalidades Disponibles
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip label="Monitoreo en Tiempo Real" size="small" />
                <Chip label="Gestión de Alarmas" size="small" />
                <Chip label="Configuración de Equipos" size="small" />
                <Chip label="Reportes Avanzados" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ZabbixIntegration; 