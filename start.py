#!/usr/bin/env python3
"""
Script de inicio para Zabbix Monitor
Ejecuta tanto el backend como el frontend
"""

import os
import sys
import subprocess
import time
import signal
import threading
from pathlib import Path

def print_banner():
    """Imprime el banner de inicio"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                    ZABBIX MONITOR                            ║
    ║              Sistema de Monitoreo de Redes                   ║
    ║                    Claro Global Hitss                        ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def check_requirements():
    """Verifica que los requisitos estén instalados"""
    print("🔍 Verificando requisitos...")
    
    # Verificar Python
    if sys.version_info < (3, 8):
        print("❌ Error: Se requiere Python 3.8 o superior")
        return False
    
    # Verificar Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Error: Node.js no está instalado")
            return False
        print(f"✅ Node.js: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ Error: Node.js no está instalado")
        return False
    
    # Verificar npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Error: npm no está disponible")
            return False
        print(f"✅ npm: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ Error: npm no está disponible")
        return False
    
    return True

def install_dependencies():
    """Instala las dependencias si es necesario"""
    print("\n📦 Instalando dependencias...")
    
    # Instalar dependencias Python
    print("Instalando dependencias Python...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                      check=True, capture_output=True)
        print("✅ Dependencias Python instaladas")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando dependencias Python: {e}")
        return False
    
    # Instalar dependencias Node.js
    print("Instalando dependencias Node.js...")
    frontend_path = Path("frontend")
    if frontend_path.exists():
        try:
            subprocess.run(['npm', 'install'], cwd=frontend_path, check=True, capture_output=True)
            print("✅ Dependencias Node.js instaladas")
        except subprocess.CalledProcessError as e:
            print(f"❌ Error instalando dependencias Node.js: {e}")
            return False
    else:
        print("⚠️  Directorio frontend no encontrado")
    
    return True

def start_backend():
    """Inicia el servidor backend"""
    print("\n🚀 Iniciando servidor backend...")
    try:
        # Cambiar al directorio server
        os.chdir("server")
        
        # Iniciar uvicorn
        process = subprocess.Popen([
            sys.executable, '-m', 'uvicorn', 'main:app',
            '--reload', '--host', '0.0.0.0', '--port', '8000'
        ])
        
        print("✅ Servidor backend iniciado en http://localhost:8000")
        return process
    except Exception as e:
        print(f"❌ Error iniciando backend: {e}")
        return None

def start_frontend():
    """Inicia el servidor frontend"""
    print("\n🌐 Iniciando servidor frontend...")
    try:
        # Cambiar al directorio frontend
        os.chdir("frontend")
        
        # Iniciar React
        process = subprocess.Popen(['npm', 'start'])
        
        print("✅ Servidor frontend iniciado en http://localhost:3000")
        return process
    except Exception as e:
        print(f"❌ Error iniciando frontend: {e}")
        return None

def main():
    """Función principal"""
    print_banner()
    
    # Verificar requisitos
    if not check_requirements():
        sys.exit(1)
    
    # Instalar dependencias
    if not install_dependencies():
        sys.exit(1)
    
    # Procesos para manejar
    processes = []
    
    def signal_handler(signum, frame):
        """Maneja la señal de interrupción"""
        print("\n\n🛑 Deteniendo servicios...")
        for process in processes:
            if process:
                process.terminate()
        sys.exit(0)
    
    # Registrar manejador de señal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Iniciar backend
        backend_process = start_backend()
        if backend_process:
            processes.append(backend_process)
        
        # Esperar un poco para que el backend se inicie
        time.sleep(3)
        
        # Iniciar frontend
        frontend_process = start_frontend()
        if frontend_process:
            processes.append(frontend_process)
        
        print("\n" + "="*60)
        print("🎉 ¡Zabbix Monitor iniciado exitosamente!")
        print("="*60)
        print("📊 Dashboard: http://localhost:3000")
        print("🔧 API Docs: http://localhost:8000/docs")
        print("🔍 Health Check: http://localhost:8000/health")
        print("="*60)
        print("Presiona Ctrl+C para detener los servicios")
        print("="*60)
        
        # Mantener el script ejecutándose
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Deteniendo servicios...")
        for process in processes:
            if process:
                process.terminate()
        print("✅ Servicios detenidos")

if __name__ == "__main__":
    main() 