#!/usr/bin/env python3
"""
MIA System Launcher - Avvio automatico completo del sistema
Lancia orchestratore, dashboard e tutti i moduli con un comando
"""

import subprocess
import sys
import time
import os
import json
from datetime import datetime

def check_dependencies():
    """Controlla dipendenze necessarie"""
    required_packages = [
        'streamlit',
        'plotly', 
        'pandas',
        'requests',
        'psutil'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Pacchetti mancanti: {', '.join(missing_packages)}")
        print("Installa con: pip install " + " ".join(missing_packages))
        return False
    
    print("✅ Tutte le dipendenze sono installate")
    return True

def check_ollama():
    """Controlla se Ollama è disponibile"""
    try:
        result = subprocess.run(['ollama', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ Ollama disponibile")
            return True
    except:
        pass
    
    print("⚠️ Ollama non trovato - peer review sarà simulata")
    return False

def create_initial_roadmap():
    """Crea roadmap iniziale se non esiste"""
    if not os.path.exists("mia_symbolic_roadmap.json"):
        print("📝 Creazione roadmap iniziale...")
        
        initial_roadmap = {
            "metadata": {
                "created": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "version": "2.0",
                "total_symbols": 0,
                "total_questions": 0
            },
            "focus_symbols": [],
            "open_questions": [],
            "operational_recommendations": [],
            "symbolic_connections": [],
            "web_sources": [],
            "peer_reviews": []
        }
        
        with open("mia_symbolic_roadmap.json", 'w', encoding='utf-8') as f:
            json.dump(initial_roadmap, f, indent=2, ensure_ascii=False)
        
        print("✅ Roadmap iniziale creata")

def start_orchestrator():
    """Avvia l'orchestratore MIA"""
    print("🚀 Avvio MIA Orchestrator...")
    
    try:
        # Avvia orchestratore in background
        process = subprocess.Popen([
            sys.executable, "mia_orchestrator.py", "start"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Attendi avvio
        time.sleep(3)
        
        if process.poll() is None:
            print("✅ MIA Orchestrator avviato")
            return process
        else:
            print("❌ Errore avvio orchestratore")
            return None
            
    except Exception as e:
        print(f"❌ Errore avvio orchestratore: {e}")
        return None

def start_dashboard():
    """Avvia dashboard Streamlit"""
    print("🌐 Avvio Dashboard Streamlit...")
    
    try:
        # Avvia dashboard in background
        process = subprocess.Popen([
            sys.executable, "-m", "streamlit", "run", "mia_symbolic_dashboard.py",
            "--server.port", "8501",
            "--server.headless", "true"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Attendi avvio
        time.sleep(5)
        
        if process.poll() is None:
            print("✅ Dashboard avviata su http://localhost:8501")
            return process
        else:
            print("❌ Errore avvio dashboard")
            return None
            
    except Exception as e:
        print(f"❌ Errore avvio dashboard: {e}")
        return None

def run_initial_cycle():
    """Esegue ciclo iniziale di generazione"""
    print("🔄 Esecuzione ciclo iniziale...")
    
    try:
        result = subprocess.run([
            sys.executable, "mia_symbolic_generator.py"
        ], capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            print("✅ Ciclo iniziale completato")
            return True
        else:
            print(f"⚠️ Ciclo iniziale con warning: {result.stderr}")
            return True
            
    except Exception as e:
        print(f"❌ Errore ciclo iniziale: {e}")
        return False

def show_status():
    """Mostra status sistema"""
    print("\n" + "="*50)
    print("🎯 MIA SYSTEM STATUS")
    print("="*50)
    
    # Controlla file roadmap
    if os.path.exists("mia_symbolic_roadmap.json"):
        try:
            with open("mia_symbolic_roadmap.json", 'r') as f:
                roadmap = json.load(f)
            
            print(f"📊 Simboli totali: {roadmap['metadata'].get('total_symbols', 0)}")
            print(f"❓ Domande aperte: {roadmap['metadata'].get('total_questions', 0)}")
            print(f"🔍 Peer reviews: {len(roadmap.get('peer_reviews', []))}")
            print(f"🕐 Ultimo aggiornamento: {roadmap['metadata'].get('last_updated', 'N/A')}")
        except:
            print("⚠️ Errore lettura roadmap")
    else:
        print("❌ Roadmap non trovata")
    
    # Controlla health status
    if os.path.exists("mia_health_status.json"):
        try:
            with open("mia_health_status.json", 'r') as f:
                health = json.load(f)
            
            print(f"🏥 Dashboard process: {'🟢' if health.get('dashboard_process') else '🔴'}")
            print(f"🏥 Dashboard responding: {'🟢' if health.get('dashboard_responding') else '🔴'}")
            print(f"🏥 Memory usage: {health.get('memory_usage', 0):.1f}%")
        except:
            print("⚠️ Errore lettura health status")
    
    print("\n🌐 Dashboard: http://localhost:8501")
    print("📝 Logs: mia_orchestrator.log")
    print("="*50)

def main():
    """Funzione principale"""
    print("🧠 MIA SYSTEM LAUNCHER")
    print("="*50)
    
    # Controlla dipendenze
    if not check_dependencies():
        sys.exit(1)
    
    # Controlla Ollama
    check_ollama()
    
    # Crea roadmap iniziale
    create_initial_roadmap()
    
    # Esegui ciclo iniziale
    run_initial_cycle()
    
    # Avvia orchestratore
    orchestrator_process = start_orchestrator()
    
    # Avvia dashboard
    dashboard_process = start_dashboard()
    
    # Mostra status
    show_status()
    
    print("\n🎉 Sistema MIA avviato con successo!")
    print("\nComandi utili:")
    print("  python mia_orchestrator.py status    - Status sistema")
    print("  python mia_orchestrator.py restart   - Riavvia moduli")
    print("  Ctrl+C                               - Ferma tutto")
    
    try:
        # Mantieni script attivo
        while True:
            time.sleep(10)
            
            # Controlla se i processi sono ancora attivi
            if orchestrator_process and orchestrator_process.poll() is not None:
                print("⚠️ Orchestrator terminato inaspettatamente")
                break
            
            if dashboard_process and dashboard_process.poll() is not None:
                print("⚠️ Dashboard terminata inaspettatamente")
                break
                
    except KeyboardInterrupt:
        print("\n🛑 Arresto sistema...")
        
        # Termina processi
        if orchestrator_process:
            orchestrator_process.terminate()
        if dashboard_process:
            dashboard_process.terminate()
        
        print("✅ Sistema arrestato")

if __name__ == "__main__":
    main() 