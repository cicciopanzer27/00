# 🚀 Guida Deployment MIA - GitHub Desktop

## 📋 Prerequisiti

1. **GitHub Desktop** installato
2. **Node.js** (versione 18+) installato
3. **Python** (versione 3.8+) installato
4. **Ollama** installato e configurato

## 🔧 Setup con GitHub Desktop

### 1. Clona il Repository
1. Apri GitHub Desktop
2. Clicca "Clone a repository from the Internet"
3. Inserisci: `https://github.com/cicciopanzer27/M.I.A.-simbolic.git`
4. Scegli dove salvare localmente
5. Clicca "Clone"

### 2. Setup Backend
```bash
# Vai nella cartella agi-backend
cd agi-backend

# Installa dipendenze
npm install

# Avvia il server
npm start
```

Il backend sarà disponibile su: `http://localhost:3000`

### 3. Setup Dashboard Python
```bash
# Torna alla cartella principale
cd ..

# Installa dipendenze Python
pip install streamlit plotly requests beautifulsoup4

# Avvia la dashboard
streamlit run mia_symbolic_dashboard.py
```

La dashboard sarà disponibile su: `http://localhost:8501`

## 🎯 Struttura del Progetto

```
M.I.A.-simbolic/
├── agi-backend/          # Backend Node.js (PRINCIPALE)
│   ├── src/
│   ├── package.json
│   └── .gitignore
├── mia_symbolic_dashboard.py  # Dashboard Streamlit
├── mia_symbolic_orchestrator.py  # Orchestratore principale
└── README.md
```

## 🔄 Workflow Completo

### 1. **Backend (Node.js)**
- Gestisce API REST
- Database SQLite
- Sistema di emisferi
- Meta-ignorance

### 2. **Dashboard (Streamlit)**
- Visualizzazione roadmap
- Generazione prompt
- Controllo sistema

### 3. **Orchestratore (Python)**
- Integrazione Ollama
- Web scraping
- Peer review
- Aggiornamento roadmap

## 🚨 Risoluzione Problemi

### Errore "npm start"
```bash
cd agi-backend
npm install
npm start
```

### Errore "streamlit not found"
```bash
pip install streamlit plotly
```

### Errore "metadata missing"
Il file `mia_symbolic_roadmap.json` deve contenere:
```json
{
  "metadata": {
    "total_symbols": 0,
    "last_update": "2025-06-27T00:00:00"
  },
  "focus_symbols": [],
  "open_questions": [],
  "operational_recommendations": []
}
```

## 📊 Monitoraggio

1. **Backend**: `http://localhost:3000/api/v1/health`
2. **Dashboard**: `http://localhost:8501`
3. **Logs**: Controlla la console per errori

## 🔗 Link Utili

- **GitHub Repo**: https://github.com/cicciopanzer27/M.I.A.-simbolic
- **Backend API**: http://localhost:3000
- **Dashboard**: http://localhost:8501 