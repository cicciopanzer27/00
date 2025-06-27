#!/usr/bin/env node

/**
 * Script di migrazione database per AGI Meta-Ignorance
 */

const SQLiteManager = require('./SQLiteManager');
const path = require('path');
require('dotenv').config();

class DatabaseMigrator {
  constructor() {
    this.dbManager = new SQLiteManager({
      dbPath: process.env.DB_PATH || './data/agi.db',
      backupPath: process.env.DB_BACKUP_PATH || './data/backups'
    });
  }

  async migrate() {
    console.log('🔄 Avvio migrazione database...');
    
    try {
      // Backup del database esistente se presente
      try {
        await this.dbManager.backup();
        console.log('✅ Backup database esistente creato');
      } catch (error) {
        console.log('ℹ️ Nessun database esistente da backuppare');
      }

      // Inizializza database
      await this.dbManager.initialize();
      
      // Verifica schema
      await this.verifySchema();
      
      // Applica eventuali migrazioni specifiche
      await this.applyMigrations();
      
      console.log('✅ Migrazione completata con successo');
      
    } catch (error) {
      console.error('❌ Errore durante la migrazione:', error);
      process.exit(1);
    } finally {
      await this.dbManager.close();
    }
  }

  async verifySchema() {
    console.log('🔍 Verifica schema database...');
    
    const tables = [
      'hemispheres',
      'queries', 
      'performance_metrics',
      'knowledge_gaps',
      'ignorance_patterns',
      'system_events',
      'hemisphere_generations'
    ];

    for (const table of tables) {
      const result = await this.dbManager.get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [table]
      );
      
      if (result) {
        console.log(`✅ Tabella ${table} presente`);
      } else {
        throw new Error(`❌ Tabella ${table} mancante`);
      }
    }
  }

  async applyMigrations() {
    console.log('🔄 Applicazione migrazioni...');
    
    // Migrazione 1: Aggiungi colonne se mancanti
    await this.migration001_AddMissingColumns();
    
    // Migrazione 2: Ottimizza indici
    await this.migration002_OptimizeIndexes();
    
    // Migrazione 3: Aggiungi trigger per audit
    await this.migration003_AddAuditTriggers();
    
    // Migrazione 4: Indici per metadati JSON
    await this.migration004_MetadataIndexes();
    
    console.log('✅ Tutte le migrazioni applicate');
  }

  async migration001_AddMissingColumns() {
    console.log('📝 Migrazione 001: Aggiunta colonne mancanti...');
    
    try {
      // Verifica e aggiungi colonne se necessario
      const alterQueries = [
        `ALTER TABLE hemispheres ADD COLUMN version TEXT DEFAULT '1.0.0'`,
        `ALTER TABLE queries ADD COLUMN cached BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE performance_metrics ADD COLUMN memory_usage INTEGER`,
        `ALTER TABLE knowledge_gaps ADD COLUMN auto_resolved BOOLEAN DEFAULT FALSE`
      ];

      for (const query of alterQueries) {
        try {
          await this.dbManager.run(query);
          console.log(`✅ ${query.split(' ')[3]} aggiunta`);
        } catch (error) {
          if (error.message.includes('duplicate column')) {
            console.log(`ℹ️ Colonna già presente: ${query.split(' ')[3]}`);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Errore migrazione 001:', error.message);
    }
  }

  async migration002_OptimizeIndexes() {
    console.log('📝 Migrazione 002: Ottimizzazione indici...');
    
    const optimizedIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_queries_mode_success ON queries(processing_mode, success)',
      'CREATE INDEX IF NOT EXISTS idx_performance_operation_success ON performance_metrics(operation, success)',
      'CREATE INDEX IF NOT EXISTS idx_hemispheres_confidence ON hemispheres(confidence)',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_severity ON knowledge_gaps(severity)',
      'CREATE INDEX IF NOT EXISTS idx_ignorance_patterns_frequency ON ignorance_patterns(frequency)'
    ];

    for (const index of optimizedIndexes) {
      await this.dbManager.run(index);
      console.log(`✅ Indice creato: ${index.split(' ')[5]}`);
    }
  }

  async migration003_AddAuditTriggers() {
    console.log('📝 Migrazione 003: Aggiunta trigger di audit...');
    
    // Trigger per log modifiche emisferi
    const hemisphereAuditTrigger = `
      CREATE TRIGGER IF NOT EXISTS hemisphere_update_audit
      AFTER UPDATE ON hemispheres
      BEGIN
        INSERT INTO system_events (event_type, severity, message, data, source)
        VALUES (
          'hemisphere_updated',
          'info',
          'Emisfero aggiornato: ' || NEW.domain,
          json_object(
            'hemisphere_id', NEW.id,
            'domain', NEW.domain,
            'old_confidence', OLD.confidence,
            'new_confidence', NEW.confidence,
            'usage_count', NEW.usage_count
          ),
          'database_trigger'
        );
      END;
    `;

    await this.dbManager.run(hemisphereAuditTrigger);
    console.log('✅ Trigger audit emisferi creato');

    // Trigger per log query fallite
    const queryFailureTrigger = `
      CREATE TRIGGER IF NOT EXISTS query_failure_audit
      AFTER INSERT ON queries
      WHEN NEW.success = 0
      BEGIN
        INSERT INTO system_events (event_type, severity, message, data, source)
        VALUES (
          'query_failed',
          'warning',
          'Query fallita: ' || substr(NEW.query_text, 1, 100),
          json_object(
            'query_id', NEW.id,
            'processing_time', NEW.processing_time,
            'confidence', NEW.confidence,
            'mode', NEW.processing_mode
          ),
          'database_trigger'
        );
      END;
    `;

    await this.dbManager.run(queryFailureTrigger);
    console.log('✅ Trigger audit query fallite creato');
  }

  async migration004_MetadataIndexes() {
    console.log('📝 Migrazione 004: Indici per metadati JSON...');
    
    const metadataIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_queries_validation_status ON queries(json_extract(metadata, "$.validation_status"))',
      'CREATE INDEX IF NOT EXISTS idx_queries_contribution_type ON queries(json_extract(metadata, "$.contribution_type"))',
      'CREATE INDEX IF NOT EXISTS idx_queries_origin ON queries(json_extract(metadata, "$.origin"))',
      'CREATE INDEX IF NOT EXISTS idx_queries_reviewers ON queries(json_extract(metadata, "$.reviewers"))',
      'CREATE INDEX IF NOT EXISTS idx_hemispheres_validation_status ON hemispheres(json_extract(metadata, "$.validation_status"))',
      'CREATE INDEX IF NOT EXISTS idx_hemispheres_contribution_type ON hemispheres(json_extract(metadata, "$.contribution_type"))'
    ];

    for (const index of metadataIndexes) {
      try {
        await this.dbManager.run(index);
        console.log(`✅ Indice metadati creato: ${index.split(' ')[5]}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️ Indice già presente: ${index.split(' ')[5]}`);
        } else {
          console.warn(`⚠️ Errore creazione indice: ${error.message}`);
        }
      }
    }
  }

  async rollback() {
    console.log('🔄 Rollback database...');
    
    // Implementa logica di rollback se necessario
    console.log('⚠️ Rollback non implementato - usa backup manuale');
  }
}

// Esegui migrazione se chiamato direttamente
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      migrator.migrate();
      break;
    case 'rollback':
      migrator.rollback();
      break;
    default:
      console.log('Uso: node migrate.js [migrate|rollback]');
      process.exit(1);
  }
}

module.exports = DatabaseMigrator;

