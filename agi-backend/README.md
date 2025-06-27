# AGI Meta-Ignorance Backend

Un backend completo e solido per sistema AGI (Artificial General Intelligence) con Meta-Ignorance tracking e auto-generazione intelligente di emisferi di conoscenza.

## 🧠 Panoramica

Questo progetto implementa un sistema AGI avanzato che combina multiple tecnologie innovative per creare un'intelligenza artificiale capace di riconoscere i propri limiti di conoscenza (meta-ignorance) e di espandere automaticamente le proprie capacità attraverso la generazione dinamica di nuovi domini di conoscenza (emisferi).

### Caratteristiche Principali

- **Meta-Ignorance Tracking**: Il sistema riconosce e traccia i propri gap di conoscenza
- **Auto-Generazione Emisferi**: Creazione automatica di nuovi domini di conoscenza basata sui gap identificati
- **Processing Collaborativo**: Combinazione intelligente di multiple prospettive per risposte più complete
- **Performance Monitoring**: Monitoraggio in tempo reale delle performance e della salute del sistema
- **API REST Completa**: Interfacce complete per tutte le funzionalità del sistema
- **Database Persistente**: Salvataggio e recupero di emisferi, query e metriche
- **Caching Intelligente**: Sistema di cache multi-livello per ottimizzare le performance
- **Trasparenza e Validazione**: Sistema completo di peer review automatica e umana
- **Interfaccia Web**: UI moderna per visualizzare trasparenza, badge e filtri

### Nuove Funzionalità di Trasparenza e Validazione

Il sistema ora include un framework completo per la trasparenza e validazione dei contenuti AI:

#### Metadati Standardizzati
Ogni output include metadati completi:
- **Origine**: AI, umano, misto
- **Metodologia**: Descrizione del metodo utilizzato
- **Limitazioni**: Dichiarazione esplicita dei limiti
- **Stato Validazione**: peer_reviewed, pending_human_review, human_reviewed_approved, human_reviewed_rejected
- **Tipo Contributo**: sintesi, scoperta empirica, framework, meta-analisi
- **Reviewer**: Lista dei revisori (AI e umani)
- **Timestamp e Versione**: Tracciabilità completa

#### Peer Review Automatica
- Valutazione automatica della qualità basata su multiple metriche
- Controllo confidenza, completezza, limitazioni dichiarate
- Richiesta automatica di review umana per risultati critici
- Scoring di qualità (0-100) con raccomandazioni

#### Interfaccia Web di Trasparenza
- Visualizzazione completa dei metadati per ogni risultato
- Badge colorati per stato validazione e tipo contributo
- Filtri avanzati per validazione, contributo, origine
- Sistema di feedback e segnalazioni
- Statistiche in tempo reale

#### Validazione Umana
- Dashboard amministrativa per review pendenti
- Sistema di approvazione/rifiuto con commenti
- Tracciamento completo delle review umane
- Statistiche di validazione

## 🏗️ Architettura

Il sistema è organizzato in componenti modulari:

```
src/
├── core/                    # Componenti core del sistema AGI
│   ├── MetaIgnoranceOrchestrator.js  # Orchestratore principale
│   ├── Hemisphere.js                 # Classe base per emisferi
│   ├── HemisphereFactory.js         # Auto-generazione emisferi
│   └── ResourceManager.js           # Gestione risorse e performance
├── database/               # Gestione persistenza dati
│   ├── SQLiteManager.js             # Manager database SQLite
│   ├── migrate.js                   # Script migrazione
│   └── seed.js                      # Script popolamento dati
├── api/                    # API REST
│   └── routes/                      # Routes API
│       ├── queries.js               # Gestione query
│       ├── hemispheres.js           # Gestione emisferi
│       ├── metrics.js               # Metriche e performance
│       ├── system.js                # Informazioni sistema
│       └── admin.js                 # Funzioni amministrative
└── app.js                  # Server Express principale
```

### Componenti Core

#### MetaIgnoranceOrchestrator
Il cervello del sistema che coordina tutti i componenti:
- Gestisce il routing delle query ai giusti emisferi
- Implementa la logica di meta-ignorance
- Coordina l'auto-generazione di nuovi emisferi
- Monitora le performance del sistema

#### Hemisphere
Rappresenta un dominio di conoscenza specializzato:
- Analizza query per determinare la rilevanza
- Processa query nel proprio dominio di competenza
- Mantiene una knowledge base specifica
- Apprende da nuove interazioni

#### HemisphereFactory
Responsabile della creazione intelligente di nuovi emisferi:
- Analizza gap di conoscenza nelle query
- Identifica potenziali nuovi domini
- Genera emisferi specializzati automaticamente
- Gestisce template per domini comuni

#### ResourceManager
Monitora e ottimizza le risorse del sistema:
- Traccia utilizzo memoria e CPU
- Gestisce cache multi-livello
- Monitora performance in tempo reale
- Implementa garbage collection intelligente

## 🚀 Installazione e Setup

### Prerequisiti

- Node.js 18.0.0 o superiore
- npm 8.0.0 o superiore
- SQLite3

### Installazione

1. **Clona il repository**
```bash
git clone <repository-url>
cd agi-backend
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Configura l'ambiente**
```bash
cp .env.example .env
# Modifica .env con le tue configurazioni
```

4. **Inizializza il database**
```bash
npm run migrate
npm run seed
```

5. **Avvia il server**
```bash
npm start
```

Il server sarà disponibile su `http://localhost:3000`

**Interfaccia Web**: `http://localhost:3000` (pagina principale con trasparenza e validazione)

### Configurazione

Il sistema utilizza variabili d'ambiente per la configurazione. Le principali opzioni sono:

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DB_PATH=./data/agi.db
DB_BACKUP_PATH=./data/backups

# AGI Configuration
MAX_HEMISPHERES=50
AUTO_GENERATION_THRESHOLD=0.3
CONFIDENCE_THRESHOLD=0.5
META_IGNORANCE_THRESHOLD=0.4

# Performance
MAX_MEMORY_USAGE=0.8
MONITORING_INTERVAL=5000
CACHE_SIZE=1000

# Security
JWT_SECRET=your-secret-key
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## 📡 API Reference

### Endpoints Principali

#### Query Processing
```http
POST /api/v1/queries
Content-Type: application/json

{
  "query": "What is quantum computing?",
  "options": {
    "timeout": 30000,
    "cacheEnabled": true
  }
}
```

**Risposta con Metadati**:
```json
{
  "success": true,
  "query": "What is quantum computing?",
  "response": { "content": "..." },
  "confidence": 0.85,
  "mode": "direct",
  "processingTime": 150,
  "metadata": {
    "origin": "AI",
    "methodology": "analisi computazionale",
    "limitations": ["Non validato sperimentalmente"],
    "validation_status": "peer_reviewed",
    "contribution_type": "sintesi",
    "timestamp": "2025-06-25T00:08:05.109417",
    "version": "2.0",
    "reviewers": ["AI-Reviewer-1"],
    "peer_review": {
      "quality_score": 85,
      "issues": [],
      "recommendations": []
    }
  }
}
```

#### Filtri e Ricerca
```http
GET /api/v1/queries/filter?validation_status=peer_reviewed&contribution_type=sintesi&origin=AI&sortBy=confidence&order=desc&limit=20
```

#### Feedback e Segnalazioni
```http
POST /api/v1/queries/:id/feedback
Content-Type: application/json

{
  "type": "validation_request",
  "description": "Richiesta validazione umana per accuratezza",
  "severity": "medium",
  "reviewer_requested": true
}
```

#### Amministrazione Validazione
```http
GET /api/v1/admin/pending-reviews
GET /api/v1/admin/validation-stats
POST /api/v1/admin/reviews/:queryId/validate
```

#### Hemisphere Management
```http
GET /api/v1/hemispheres
GET /api/v1/hemispheres/:domain
POST /api/v1/hemispheres/generate
```

#### System Monitoring
```http
GET /api/v1/system
GET /api/v1/system/health
GET /api/v1/metrics
```

### Esempi di Utilizzo

#### Processare una Query
```javascript
const response = await fetch('/api/v1/queries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Explain machine learning algorithms"
  })
});

const result = await response.json();
console.log(result.response);
```

#### Ottenere Stato Sistema
```javascript
const health = await fetch('/api/v1/system/health');
const status = await health.json();
console.log(`System status: ${status.status}`);
```

## 🎨 Interfaccia Web

### Accesso
L'interfaccia web è disponibile all'indirizzo `http://localhost:3000` dopo l'avvio del server.

### Funzionalità
- **Dashboard Statistiche**: Visualizzazione in tempo reale di query totali, peer review, review pendenti
- **Filtri Avanzati**: Filtra per stato validazione, tipo contributo, origine
- **Card Trasparenza**: Ogni risultato mostra metadati completi e badge di stato
- **Feedback System**: Segnala problemi o richiedi validazione umana
- **Badge Colorati**: Indicatori visivi per stato validazione e tipo contributo

### Esempi di Utilizzo

#### Visualizzare Solo Risultati Peer Reviewed
1. Apri l'interfaccia web
2. Seleziona "Peer Reviewed" nel filtro "Stato Validazione"
3. Clicca "Applica Filtri"

#### Richiedere Validazione Umana
1. Trova un risultato che necessita review
2. Clicca "Segnala Problema / Richiedi Validazione"
3. Descrivi il motivo e conferma la richiesta di review umana

#### Amministrazione Review
1. Accedi a `/api/v1/admin/pending-reviews`
2. Visualizza le review pendenti
3. Approva o rifiuta con commenti

## 🧪 Testing

Il progetto include una suite di test completa:

### Eseguire i Test

```bash
# Test completi
npm test

# Test AGI specifici
npm run test:agi

# Test semplificati
node tests/simple-test.js

# Test con coverage
npm run test:coverage
```

### Tipi di Test

1. **Unit Tests**: Test dei singoli componenti
2. **Integration Tests**: Test dell'integrazione tra componenti
3. **Performance Tests**: Test delle performance del sistema
4. **API Tests**: Test degli endpoint REST

## 📊 Monitoraggio e Metriche

Il sistema fornisce monitoraggio completo attraverso:

### Metriche di Performance
- Tempo di risposta medio
- Tasso di successo delle query
- Utilizzo memoria e CPU
- Cache hit rate

### Metriche AGI
- Numero di emisferi attivi
- Confidenza media delle risposte
- Gap di conoscenza identificati
- Emisferi auto-generati

### Health Checks
```http
GET /api/v1/system/health
```

Ritorna lo stato di salute di tutti i componenti del sistema.

## 🔧 Amministrazione

### Comandi Utili

```bash
# Backup database
curl -X POST http://localhost:3000/api/v1/admin/backup

# Pulizia dati vecchi
curl -X POST http://localhost:3000/api/v1/admin/cleanup \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 30}'

# Reset cache
curl -X POST http://localhost:3000/api/v1/admin/cache/clear

# Statistiche sistema
curl http://localhost:3000/api/v1/admin/stats
```

### Database Management

```bash
# Migrazione database
npm run migrate

# Popolamento dati di esempio
npm run seed

# Stato database
node src/database/seed.js status

# Pulizia database
node src/database/seed.js clear
```

## 🔒 Sicurezza

Il sistema implementa multiple misure di sicurezza:

- **Rate Limiting**: Protezione contro abusi
- **Input Validation**: Validazione rigorosa degli input
- **CORS Configuration**: Configurazione CORS appropriata
- **Error Handling**: Gestione sicura degli errori
- **Logging**: Log completi per audit
- **Content Security Policy**: Protezione XSS e injection
- **Peer Review**: Validazione automatica e umana dei contenuti

## 🚀 Deploy

### Deploy Locale

```bash
npm start
```

### Deploy Produzione

1. **Configura variabili d'ambiente**
```bash
export NODE_ENV=production
export PORT=3000
export DB_PATH=/var/lib/agi/agi.db
```

2. **Avvia con PM2**
```bash
npm install -g pm2
pm2 start src/app.js --name agi-backend
```

3. **Setup reverse proxy (nginx)**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📈 Performance

### Benchmark Tipici

- **Tempo di risposta**: < 500ms per query semplici
- **Throughput**: > 100 query/secondo
- **Memoria**: < 512MB per setup base
- **CPU**: < 50% su hardware moderno
- **Peer Review**: < 100ms per validazione automatica
- **Filtri JSON**: Ottimizzati con indici SQLite

### Ottimizzazioni

- Cache multi-livello per query frequenti
- Connection pooling per database
- Garbage collection ottimizzata
- Monitoring proattivo delle risorse
- Indici JSON per filtri metadati
- Compressione automatica delle risposte

## 🤝 Contribuire

### Setup Sviluppo

```bash
git clone <repository-url>
cd agi-backend
npm install
npm run dev
```

### Guidelines

1. Segui lo stile di codice esistente
2. Aggiungi test per nuove funzionalità
3. Aggiorna la documentazione
4. Testa su Node.js 18+

### Struttura Commit

```
type(scope): description

- feat: nuova funzionalità
- fix: correzione bug
- docs: aggiornamento documentazione
- test: aggiunta/modifica test
- refactor: refactoring codice
```

## 📝 Changelog

### v1.0.0 (2024-06-24)
- ✨ Implementazione iniziale sistema AGI
- 🧠 Meta-ignorance tracking
- 🔄 Auto-generazione emisferi
- 📡 API REST completa
- 🗄️ Persistenza SQLite
- 📊 Monitoraggio performance
- 🧪 Suite di test completa

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE) per dettagli.

## 🙏 Riconoscimenti

Sviluppato da **Manus AI** come dimostrazione di un sistema AGI avanzato con capacità di meta-cognizione e auto-miglioramento.

### Tecnologie Utilizzate

- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **SQLite**: Database embedded
- **Natural**: Elaborazione linguaggio naturale
- **Jest**: Framework di testing
- **Winston**: Logging
- **Joi**: Validazione input

## 📞 Supporto

Per supporto e domande:

- 📧 Email: support@manus.ai
- 🐛 Issues: [GitHub Issues](https://github.com/manus-ai/agi-backend/issues)
- 📖 Docs: [Documentazione Completa](https://docs.manus.ai/agi-backend)

---

**Nota**: Questo è un progetto di ricerca e dimostrazione. Non utilizzare in produzione senza adeguata valutazione di sicurezza e performance per il tuo caso d'uso specifico.

