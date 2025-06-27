/**
 * SQLiteManager - Gestione database SQLite per il sistema AGI
 * Gestisce persistenza di emisferi, query, metriche e meta-ignorance
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class SQLiteManager {
  constructor(config = {}) {
    this.config = {
      dbPath: config.dbPath || './data/agi.db',
      backupPath: config.backupPath || './data/backups',
      enableWAL: config.enableWAL !== false,
      busyTimeout: config.busyTimeout || 30000,
      maxConnections: config.maxConnections || 10,
      ...config
    };

    this.db = null;
    this.isInitialized = false;
    this.connectionPool = [];
    this.activeConnections = 0;
  }

  /**
   * Inizializza il database
   */
  async initialize() {
    try {
      // Crea directory se non esiste
      const dbDir = path.dirname(this.config.dbPath);
      await fs.mkdir(dbDir, { recursive: true });
      await fs.mkdir(this.config.backupPath, { recursive: true });

      // Connetti al database
      await this.connect();
      
      // Crea schema
      await this.createSchema();
      
      // Configura database
      await this.configureDatabase();
      
      this.isInitialized = true;
      console.log('✅ Database SQLite inizializzato:', this.config.dbPath);
      
    } catch (error) {
      console.error('❌ Errore inizializzazione database:', error);
      throw error;
    }
  }

  /**
   * Connette al database
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.config.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Configura il database
   */
  async configureDatabase() {
    const configurations = [
      'PRAGMA busy_timeout = ' + this.config.busyTimeout,
      'PRAGMA foreign_keys = ON',
      'PRAGMA synchronous = NORMAL',
      'PRAGMA cache_size = -64000', // 64MB cache
      'PRAGMA temp_store = MEMORY'
    ];

    if (this.config.enableWAL) {
      configurations.push('PRAGMA journal_mode = WAL');
    }

    for (const config of configurations) {
      await this.run(config);
    }
  }

  /**
   * Crea schema del database
   */
  async createSchema() {
    const schemas = [
      // Tabella emisferi
      `CREATE TABLE IF NOT EXISTS hemispheres (
        id TEXT PRIMARY KEY,
        domain TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
        usage_count INTEGER DEFAULT 0,
        confidence REAL DEFAULT 0.5,
        knowledge_base TEXT, -- JSON
        patterns TEXT, -- JSON array
        metadata TEXT, -- JSON
        config TEXT, -- JSON
        serialized_data TEXT -- JSON completo
      )`,

      // Tabella query
      `CREATE TABLE IF NOT EXISTS queries (
        id TEXT PRIMARY KEY,
        query_text TEXT NOT NULL,
        query_hash TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        processing_time INTEGER,
        success BOOLEAN,
        confidence REAL,
        processing_mode TEXT,
        primary_hemisphere TEXT,
        collaborating_hemispheres TEXT, -- JSON array
        response TEXT, -- JSON
        metadata TEXT -- JSON
      )`,

      // Tabella metriche performance
      `CREATE TABLE IF NOT EXISTS performance_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        operation TEXT NOT NULL,
        duration INTEGER NOT NULL,
        success BOOLEAN NOT NULL,
        metadata TEXT, -- JSON
        hemisphere_id TEXT,
        query_id TEXT,
        FOREIGN KEY (hemisphere_id) REFERENCES hemispheres(id),
        FOREIGN KEY (query_id) REFERENCES queries(id)
      )`,

      // Tabella knowledge gaps (meta-ignorance)
      `CREATE TABLE IF NOT EXISTS knowledge_gaps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_text TEXT NOT NULL,
        query_hash TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        gap_type TEXT NOT NULL,
        severity REAL,
        tokens TEXT, -- JSON array
        hemisphere_confidences TEXT, -- JSON
        suggestions TEXT, -- JSON array
        resolved BOOLEAN DEFAULT FALSE,
        resolution_date DATETIME
      )`,

      // Tabella ignorance patterns
      `CREATE TABLE IF NOT EXISTS ignorance_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_hash TEXT NOT NULL,
        pattern_type TEXT,
        frequency INTEGER DEFAULT 1,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        avg_confidence REAL,
        pattern_data TEXT -- JSON
      )`,

      // Tabella system events
      `CREATE TABLE IF NOT EXISTS system_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        event_type TEXT NOT NULL,
        severity TEXT DEFAULT 'info',
        message TEXT,
        data TEXT, -- JSON
        source TEXT
      )`,

      // Tabella hemisphere generations
      `CREATE TABLE IF NOT EXISTS hemisphere_generations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hemisphere_id TEXT NOT NULL,
        source_query TEXT,
        generation_reason TEXT,
        template_used TEXT,
        confidence REAL,
        success BOOLEAN,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT, -- JSON
        FOREIGN KEY (hemisphere_id) REFERENCES hemispheres(id)
      )`
    ];

    for (const schema of schemas) {
      await this.run(schema);
    }

    // Crea indici
    await this.createIndexes();
  }

  /**
   * Crea indici per performance
   */
  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_hemispheres_domain ON hemispheres(domain)',
      'CREATE INDEX IF NOT EXISTS idx_hemispheres_last_used ON hemispheres(last_used)',
      'CREATE INDEX IF NOT EXISTS idx_queries_timestamp ON queries(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_queries_hash ON queries(query_hash)',
      'CREATE INDEX IF NOT EXISTS idx_queries_success ON queries(success)',
      'CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_performance_operation ON performance_metrics(operation)',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_timestamp ON knowledge_gaps(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_type ON knowledge_gaps(gap_type)',
      'CREATE INDEX IF NOT EXISTS idx_ignorance_patterns_hash ON ignorance_patterns(query_hash)',
      'CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }
  }

  /**
   * Salva un emisfero
   */
  async saveHemisphere(hemisphereData) {
    const sql = `INSERT OR REPLACE INTO hemispheres 
      (id, domain, created_at, last_used, usage_count, confidence, 
       knowledge_base, patterns, metadata, config, serialized_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      hemisphereData.id,
      hemisphereData.domain,
      hemisphereData.createdAt,
      hemisphereData.lastUsed,
      hemisphereData.usageCount,
      hemisphereData.confidence,
      JSON.stringify(hemisphereData.knowledgeBase),
      JSON.stringify(hemisphereData.patterns),
      JSON.stringify(hemisphereData.metadata),
      JSON.stringify(hemisphereData.config),
      JSON.stringify(hemisphereData)
    ];

    await this.run(sql, params);
  }

  /**
   * Carica tutti gli emisferi
   */
  async getAllHemispheres() {
    const sql = 'SELECT * FROM hemispheres ORDER BY last_used DESC';
    const rows = await this.all(sql);
    
    return rows.map(row => {
      try {
        return JSON.parse(row.serialized_data);
      } catch (error) {
        console.warn('⚠️ Errore parsing emisfero:', row.id, error);
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * Carica emisfero per dominio
   */
  async getHemisphereByDomain(domain) {
    const sql = 'SELECT * FROM hemispheres WHERE domain = ?';
    const row = await this.get(sql, [domain]);
    
    if (row) {
      try {
        return JSON.parse(row.serialized_data);
      } catch (error) {
        console.warn('⚠️ Errore parsing emisfero:', domain, error);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Aggiorna statistiche emisfero
   */
  async updateHemisphereStats(hemisphereId, usageCount, lastUsed, confidence) {
    const sql = `UPDATE hemispheres 
      SET usage_count = ?, last_used = ?, confidence = ?
      WHERE id = ?`;
    
    await this.run(sql, [usageCount, lastUsed, confidence, hemisphereId]);
  }

  /**
   * Salva query
   */
  async saveQuery(queryData) {
    const sql = `INSERT INTO queries 
      (id, query_text, query_hash, timestamp, processing_time, success, 
       confidence, processing_mode, primary_hemisphere, collaborating_hemispheres, 
       response, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      queryData.id,
      queryData.query,
      queryData.hash,
      queryData.timestamp,
      queryData.processingTime,
      queryData.success,
      queryData.confidence,
      queryData.mode,
      queryData.primaryHemisphere,
      JSON.stringify(queryData.collaboratingHemispheres || []),
      JSON.stringify(queryData.response),
      JSON.stringify(queryData.metadata || {})
    ];

    await this.run(sql, params);
  }

  /**
   * Ottieni query recenti
   */
  async getRecentQueries(limit = 100) {
    const sql = `SELECT * FROM queries 
      ORDER BY timestamp DESC 
      LIMIT ?`;
    
    return await this.all(sql, [limit]);
  }

  /**
   * Ottieni statistiche query
   */
  async getQueryStats() {
    const stats = {};
    
    // Conteggi base
    const countSql = `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
      AVG(processing_time) as avg_processing_time,
      AVG(confidence) as avg_confidence
      FROM queries`;
    
    const countResult = await this.get(countSql);
    stats.basic = countResult;
    
    // Distribuzione per modalità
    const modeSql = `SELECT processing_mode, COUNT(*) as count 
      FROM queries 
      GROUP BY processing_mode`;
    
    stats.byMode = await this.all(modeSql);
    
    // Query per ora (ultime 24 ore)
    const hourlySql = `SELECT 
      strftime('%H', timestamp) as hour,
      COUNT(*) as count
      FROM queries 
      WHERE timestamp > datetime('now', '-24 hours')
      GROUP BY hour
      ORDER BY hour`;
    
    stats.hourly = await this.all(hourlySql);
    
    return stats;
  }

  /**
   * Salva metrica performance
   */
  async savePerformanceMetric(metric) {
    const sql = `INSERT INTO performance_metrics 
      (timestamp, operation, duration, success, metadata, hemisphere_id, query_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      metric.timestamp,
      metric.operation,
      metric.duration,
      metric.success,
      JSON.stringify(metric.metadata || {}),
      metric.hemisphereId || null,
      metric.queryId || null
    ];

    await this.run(sql, params);
  }

  /**
   * Ottieni metriche performance
   */
  async getPerformanceMetrics(operation = null, limit = 1000) {
    let sql = `SELECT * FROM performance_metrics`;
    let params = [];
    
    if (operation) {
      sql += ` WHERE operation = ?`;
      params.push(operation);
    }
    
    sql += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(limit);
    
    return await this.all(sql, params);
  }

  /**
   * Salva knowledge gap
   */
  async saveKnowledgeGap(gapData) {
    const sql = `INSERT INTO knowledge_gaps 
      (query_text, query_hash, gap_type, severity, tokens, 
       hemisphere_confidences, suggestions)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      gapData.query,
      gapData.hash,
      gapData.type,
      gapData.severity,
      JSON.stringify(gapData.tokens || []),
      JSON.stringify(gapData.hemisphereConfidences || []),
      JSON.stringify(gapData.suggestions || [])
    ];

    await this.run(sql, params);
  }

  /**
   * Ottieni knowledge gaps
   */
  async getKnowledgeGaps(resolved = false, limit = 100) {
    const sql = `SELECT * FROM knowledge_gaps 
      WHERE resolved = ? 
      ORDER BY timestamp DESC 
      LIMIT ?`;
    
    return await this.all(sql, [resolved, limit]);
  }

  /**
   * Salva ignorance pattern
   */
  async saveIgnorancePattern(patternData) {
    // Verifica se pattern esiste già
    const existingSql = 'SELECT id, frequency FROM ignorance_patterns WHERE query_hash = ?';
    const existing = await this.get(existingSql, [patternData.hash]);
    
    if (existing) {
      // Aggiorna pattern esistente
      const updateSql = `UPDATE ignorance_patterns 
        SET frequency = frequency + 1, last_seen = CURRENT_TIMESTAMP,
            avg_confidence = ?, pattern_data = ?
        WHERE id = ?`;
      
      await this.run(updateSql, [
        patternData.avgConfidence,
        JSON.stringify(patternData.data),
        existing.id
      ]);
    } else {
      // Crea nuovo pattern
      const insertSql = `INSERT INTO ignorance_patterns 
        (query_hash, pattern_type, avg_confidence, pattern_data)
        VALUES (?, ?, ?, ?)`;
      
      await this.run(insertSql, [
        patternData.hash,
        patternData.type,
        patternData.avgConfidence,
        JSON.stringify(patternData.data)
      ]);
    }
  }

  /**
   * Ottieni ignorance patterns
   */
  async getIgnorancePatterns(limit = 100) {
    const sql = `SELECT * FROM ignorance_patterns 
      ORDER BY frequency DESC, last_seen DESC 
      LIMIT ?`;
    
    return await this.all(sql, [limit]);
  }

  /**
   * Salva evento di sistema
   */
  async saveSystemEvent(eventData) {
    const sql = `INSERT INTO system_events 
      (event_type, severity, message, data, source)
      VALUES (?, ?, ?, ?, ?)`;

    const params = [
      eventData.type,
      eventData.severity || 'info',
      eventData.message,
      JSON.stringify(eventData.data || {}),
      eventData.source
    ];

    await this.run(sql, params);
  }

  /**
   * Salva generazione emisfero
   */
  async saveHemisphereGeneration(generationData) {
    const sql = `INSERT INTO hemisphere_generations 
      (hemisphere_id, source_query, generation_reason, template_used, 
       confidence, success, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      generationData.hemisphereId,
      generationData.sourceQuery,
      generationData.reason,
      generationData.template,
      generationData.confidence,
      generationData.success,
      JSON.stringify(generationData.metadata || {})
    ];

    await this.run(sql, params);
  }

  /**
   * Backup del database
   */
  async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.config.backupPath, `agi-backup-${timestamp}.db`);
    
    try {
      await fs.copyFile(this.config.dbPath, backupPath);
      console.log('✅ Backup creato:', backupPath);
      return backupPath;
    } catch (error) {
      console.error('❌ Errore backup:', error);
      throw error;
    }
  }

  /**
   * Cleanup dati vecchi
   */
  async cleanup(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoff = cutoffDate.toISOString();
    
    const cleanupQueries = [
      `DELETE FROM queries WHERE timestamp < '${cutoff}'`,
      `DELETE FROM performance_metrics WHERE timestamp < '${cutoff}'`,
      `DELETE FROM knowledge_gaps WHERE timestamp < '${cutoff}' AND resolved = 1`,
      `DELETE FROM system_events WHERE timestamp < '${cutoff}' AND severity = 'info'`
    ];
    
    let totalDeleted = 0;
    
    for (const query of cleanupQueries) {
      const result = await this.run(query);
      totalDeleted += result.changes || 0;
    }
    
    // Vacuum per recuperare spazio
    await this.run('VACUUM');
    
    console.log(`🧹 Cleanup completato: ${totalDeleted} record rimossi`);
    return totalDeleted;
  }

  /**
   * Ottieni statistiche database
   */
  async getDatabaseStats() {
    const stats = {};
    
    const tables = [
      'hemispheres', 'queries', 'performance_metrics', 
      'knowledge_gaps', 'ignorance_patterns', 'system_events', 
      'hemisphere_generations'
    ];
    
    for (const table of tables) {
      const countSql = `SELECT COUNT(*) as count FROM ${table}`;
      const result = await this.get(countSql);
      stats[table] = result.count;
    }
    
    // Dimensione database
    const sizeSql = `SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`;
    const sizeResult = await this.get(sizeSql);
    stats.databaseSize = sizeResult.size;
    
    return stats;
  }

  /**
   * Wrapper per run query
   */
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Wrapper per get query
   */
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Wrapper per all query
   */
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Chiude la connessione
   */
  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Database chiuso');
            resolve();
          }
        });
      });
    }
  }
}

module.exports = SQLiteManager;

