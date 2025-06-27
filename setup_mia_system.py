#!/usr/bin/env python3
"""
🚀 Setup Completo Sistema MIA
Script per configurare e avviare tutto il sistema MIA
"""

import os
import sys
import subprocess
import json
import time
from pathlib import Path

class MIASetup:
    def __init__(self):
        self.root_dir = Path.cwd()
        self.backend_dir = self.root_dir / "agi-backend"
        self.roadmap_file = self.root_dir / "mia_symbolic_roadmap.json"
        
    def print_header(self, title):
        print(f"\n{'='*60}")
        print(f"🚀 {title}")
        print(f"{'='*60}")
        
    def run_command(self, command, cwd=None, shell=True):
        """Esegue un comando e mostra l'output"""
        print(f"📋 Eseguendo: {command}")
        try:
            result = subprocess.run(
                command, 
                cwd=cwd, 
                shell=shell, 
                capture_output=True, 
                text=True
            )
            if result.stdout:
                print(f"✅ Output: {result.stdout}")
            if result.stderr:
                print(f"⚠️  Warning: {result.stderr}")
            return result.returncode == 0
        except Exception as e:
            print(f"❌ Errore: {e}")
            return False
    
    def check_prerequisites(self):
        """Verifica i prerequisiti"""
        self.print_header("Verifica Prerequisiti")
        
        # Verifica Python
        print(f"🐍 Python: {sys.version}")
        
        # Verifica Node.js
        if self.run_command("node --version"):
            print("✅ Node.js trovato")
        else:
            print("❌ Node.js non trovato. Installa Node.js 18+")
            return False
            
        # Verifica npm
        if self.run_command("npm --version"):
            print("✅ npm trovato")
        else:
            print("❌ npm non trovato")
            return False
            
        return True
    
    def setup_backend(self):
        """Setup del backend Node.js"""
        self.print_header("Setup Backend Node.js")
        
        if not self.backend_dir.exists():
            print("❌ Cartella agi-backend non trovata")
            return False
            
        # Installa dipendenze
        print("📦 Installando dipendenze Node.js...")
        if not self.run_command("npm install", cwd=self.backend_dir):
            print("❌ Errore nell'installazione delle dipendenze")
            return False
            
        print("✅ Backend configurato")
        return True
    
    def setup_python_dependencies(self):
        """Setup delle dipendenze Python"""
        self.print_header("Setup Dipendenze Python")
        
        dependencies = [
            "streamlit",
            "plotly", 
            "requests",
            "beautifulsoup4",
            "pandas",
            "numpy"
        ]
        
        for dep in dependencies:
            print(f"📦 Installando {dep}...")
            if not self.run_command(f"pip install {dep}"):
                print(f"❌ Errore nell'installazione di {dep}")
                return False
                
        print("✅ Dipendenze Python installate")
        return True
    
    def verify_roadmap(self):
        """Verifica e crea il file roadmap se necessario"""
        self.print_header("Verifica Roadmap")
        
        if not self.roadmap_file.exists():
            print("📝 Creando file roadmap...")
            roadmap = {
                "metadata": {
                    "total_symbols": 0,
                    "last_update": time.strftime("%Y-%m-%dT%H:%M:%S"),
                    "version": "1.0.0",
                    "status": "initialized"
                },
                "focus_symbols": [],
                "open_questions": [],
                "operational_recommendations": [],
                "peer_reviews": [],
                "web_sources": [],
                "generation_history": []
            }
            
            with open(self.roadmap_file, 'w', encoding='utf-8') as f:
                json.dump(roadmap, f, indent=2, ensure_ascii=False)
            print("✅ File roadmap creato")
        else:
            print("✅ File roadmap esistente")
            
        return True
    
    def start_backend(self):
        """Avvia il backend"""
        self.print_header("Avvio Backend")
        
        print("🌐 Avviando backend Node.js...")
        print("📍 Backend sarà disponibile su: http://localhost:3000")
        print("⏹️  Premi Ctrl+C per fermare")
        
        try:
            subprocess.run("npm start", cwd=self.backend_dir, shell=True)
        except KeyboardInterrupt:
            print("\n⏹️  Backend fermato")
    
    def start_dashboard(self):
        """Avvia la dashboard"""
        self.print_header("Avvio Dashboard")
        
        print("📊 Avviando dashboard Streamlit...")
        print("📍 Dashboard sarà disponibile su: http://localhost:8501")
        print("⏹️  Premi Ctrl+C per fermare")
        
        try:
            subprocess.run("streamlit run mia_symbolic_dashboard.py", shell=True)
        except KeyboardInterrupt:
            print("\n⏹️  Dashboard fermata")
    
    def run_setup(self):
        """Esegue il setup completo"""
        self.print_header("Setup Completo Sistema MIA")
        
        # Verifica prerequisiti
        if not self.check_prerequisites():
            print("❌ Prerequisiti non soddisfatti")
            return False
            
        # Setup backend
        if not self.setup_backend():
            print("❌ Errore nel setup del backend")
            return False
            
        # Setup Python
        if not self.setup_python_dependencies():
            print("❌ Errore nel setup delle dipendenze Python")
            return False
            
        # Verifica roadmap
        if not self.verify_roadmap():
            print("❌ Errore nella verifica della roadmap")
            return False
            
        print("\n🎉 Setup completato con successo!")
        print("\n📋 Prossimi passi:")
        print("1. Avvia il backend: python setup_mia_system.py --backend")
        print("2. Avvia la dashboard: python setup_mia_system.py --dashboard")
        print("3. Avvia tutto: python setup_mia_system.py --all")
        
        return True

def main():
    setup = MIASetup()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--backend":
            setup.start_backend()
        elif sys.argv[1] == "--dashboard":
            setup.start_dashboard()
        elif sys.argv[1] == "--all":
            # Avvia backend in background e dashboard
            print("🚀 Avvio completo del sistema...")
            # Questo richiederebbe threading per avviare entrambi
            print("⚠️  Usa --backend o --dashboard separatamente")
        else:
            print("❌ Opzione non valida")
            print("Opzioni: --backend, --dashboard, --all")
    else:
        setup.run_setup()

if __name__ == "__main__":
    main() 