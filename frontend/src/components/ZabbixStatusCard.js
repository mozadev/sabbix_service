import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Monitor as MonitorIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ZabbixStatusCard = () => {
  const [status, setStatus] = useState('unknown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkZabbixStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/zabbix/test');
      setStatus(response.data.success ? 'connected' : 'failed');
      setError(null);
    } catch (err) {
      setStatus('failed');
      setError('Error de conexión con Zabbix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkZabbixStatus();
  }, []);

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
        return 'Desconectado';
      default:
        return 'Verificando...';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <MonitorIcon color="warning" />;
    }
  };

  const openZabbix = () => {
    window.open('http://10.232.35.243:8080', '_blank');
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <MonitorIcon color="primary" />
            <Typography variant="h6">
              Estado Zabbix
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Verificar Conexión">
              <IconButton 
                size="small" 
                onClick={checkZabbixStatus}
                disabled={loading}
              >
                {loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Abrir Zabbix">
              <IconButton size="small" onClick={openZabbix}>
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          {getStatusIcon(status)}
          <Chip
            label={getStatusText(status)}
            color={getStatusColor(status)}
            size="small"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="textSecondary">
          URL: http://10.232.35.243:8080
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ZabbixStatusCard; 