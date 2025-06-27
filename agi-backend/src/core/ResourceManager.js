/**
 * ResourceManager - Gestisce risorse di sistema e performance
 * Monitora utilizzo memoria, CPU e ottimizza le performance del sistema AGI
 */

const os = require('os');
const { EventEmitter } = require('events');

class ResourceManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxMemoryUsage: config.maxMemoryUsage || 0.8, // 80% della memoria disponibile
      maxCpuUsage: config.maxCpuUsage || 0.9, // 90% CPU
      monitoringInterval: config.monitoringInterval || 5000, // 5 secondi
      performanceHistorySize: config.performanceHistorySize || 100,
      cacheSize: config.cacheSize || 1000,
      gcThreshold: config.gcThreshold || 0.7, // Soglia per garbage collection
      ...config
    };

    // Metriche di performance
    this.performanceMetrics = [];
    this.systemMetrics = {
      memory: [],
      cpu: [],
      hemispheres: [],
      queries: []
    };

    // Cache per ottimizzare le performance
    this.queryCache = new Map();
    this.hemisphereCache = new Map();
    
    // Stato del sistema
    this.systemHealth = {
      status: 'healthy',
      lastCheck: new Date(),
      warnings: [],
      errors: []
    };

    // Contatori
    this.counters = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      gcRuns: 0,
      hemisphereCreations: 0
    };

    this.startMonitoring();
  }

  /**
   * Avvia il monitoraggio delle risorse
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkSystemHealth();
      this.optimizeResources();
    }, this.config.monitoringInterval);

    console.log('ResourceManager: Monitoraggio avviato');
  }

  /**
   * Ferma il monitoraggio
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('ResourceManager: Monitoraggio fermato');
  }

  /**
   * Raccoglie metriche di sistema
   */
  collectMetrics() {
    const timestamp = new Date();
    
    // Metriche memoria
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    const memoryMetric = {
      timestamp,
      heap: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      system: {
        used: usedMemory,
        total: totalMemory,
        free: freeMemory,
        percentage: (usedMemory / totalMemory) * 100
      },
      external: memoryUsage.external,
      rss: memoryUsage.rss
    };

    // Metriche CPU
    const cpuUsage = process.cpuUsage();
    const cpuMetric = {
      timestamp,
      user: cpuUsage.user,
      system: cpuUsage.system,
      cores: os.cpus().length,
      loadAverage: os.loadavg()
    };

    // Aggiungi alle metriche
    this.systemMetrics.memory.push(memoryMetric);
    this.systemMetrics.cpu.push(cpuMetric);

    // Mantieni solo le ultime N metriche
    if (this.systemMetrics.memory.length > this.config.performanceHistorySize) {
      this.systemMetrics.memory.shift();
    }
    if (this.systemMetrics.cpu.length > this.config.performanceHistorySize) {
      this.systemMetrics.cpu.shift();
    }

    // Emetti evento per le metriche
    this.emit('metrics', {
      memory: memoryMetric,
      cpu: cpuMetric,
      timestamp
    });
  }

  /**
   * Controlla la salute del sistema
   */
  checkSystemHealth() {
    const warnings = [];
    const errors = [];
    let status = 'healthy';

    // Controlla memoria
    const latestMemory = this.systemMetrics.memory[this.systemMetrics.memory.length - 1];
    if (latestMemory) {
      if (latestMemory.system.percentage > this.config.maxMemoryUsage * 100) {
        errors.push(`Utilizzo memoria critico: ${latestMemory.system.percentage.toFixed(1)}%`);
        status = 'critical';
      } else if (latestMemory.system.percentage > (this.config.maxMemoryUsage * 0.8) * 100) {
        warnings.push(`Utilizzo memoria elevato: ${latestMemory.system.percentage.toFixed(1)}%`);
        if (status === 'healthy') status = 'warning';
      }
    }

    // Controlla CPU
    const latestCpu = this.systemMetrics.cpu[this.systemMetrics.cpu.length - 1];
    if (latestCpu && latestCpu.loadAverage[0] > this.config.maxCpuUsage) {
      warnings.push(`Carico CPU elevato: ${latestCpu.loadAverage[0].toFixed(2)}`);
      if (status === 'healthy') status = 'warning';
    }

    // Controlla cache
    const cacheHitRate = this.counters.totalQueries > 0 ? 
      (this.counters.cacheHits / this.counters.totalQueries) * 100 : 0;
    
    if (cacheHitRate < 20 && this.counters.totalQueries > 10) {
      warnings.push(`Cache hit rate basso: ${cacheHitRate.toFixed(1)}%`);
    }

    this.systemHealth = {
      status,
      lastCheck: new Date(),
      warnings,
      errors,
      metrics: {
        memoryUsage: latestMemory?.system.percentage || 0,
        cpuLoad: latestCpu?.loadAverage[0] || 0,
        cacheHitRate,
        totalQueries: this.counters.totalQueries
      }
    };

    // Emetti eventi per cambi di stato
    if (status !== 'healthy') {
      this.emit('healthWarning', this.systemHealth);
    }
  }

  /**
   * Ottimizza le risorse del sistema
   */
  optimizeResources() {
    // Garbage collection se necessario
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage.heap.percentage > this.config.gcThreshold * 100) {
      this.runGarbageCollection();
    }

    // Pulisci cache se troppo grande
    if (this.queryCache.size > this.config.cacheSize) {
      this.cleanupCache();
    }

    // Ottimizza hemisphere cache
    if (this.hemisphereCache.size > this.config.cacheSize / 2) {
      this.optimizeHemisphereCache();
    }
  }

  /**
   * Esegue garbage collection
   */
  runGarbageCollection() {
    if (global.gc) {
      const before = process.memoryUsage().heapUsed;
      global.gc();
      const after = process.memoryUsage().heapUsed;
      const freed = before - after;
      
      this.counters.gcRuns++;
      
      console.log(`GC eseguito: liberati ${(freed / 1024 / 1024).toFixed(2)} MB`);
      this.emit('garbageCollection', { before, after, freed });
    }
  }

  /**
   * Pulisce la cache delle query
   */
  cleanupCache() {
    const entries = Array.from(this.queryCache.entries());
    
    // Ordina per timestamp (più vecchi prima)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Rimuovi il 25% più vecchio
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.queryCache.delete(entries[i][0]);
    }
    
    console.log(`Cache pulita: rimossi ${toRemove} elementi`);
  }

  /**
   * Ottimizza la cache degli emisferi
   */
  optimizeHemisphereCache() {
    const entries = Array.from(this.hemisphereCache.entries());
    
    // Ordina per ultimo utilizzo
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    // Rimuovi il 30% meno utilizzato
    const toRemove = Math.floor(entries.length * 0.3);
    for (let i = 0; i < toRemove; i++) {
      this.hemisphereCache.delete(entries[i][0]);
    }
    
    console.log(`Hemisphere cache ottimizzata: rimossi ${toRemove} elementi`);
  }

  /**
   * Registra una metrica di performance
   */
  recordPerformanceMetric(operation, duration, success = true, metadata = {}) {
    const metric = {
      timestamp: new Date(),
      operation,
      duration,
      success,
      metadata
    };

    this.performanceMetrics.push(metric);
    
    // Mantieni solo le ultime N metriche
    if (this.performanceMetrics.length > this.config.performanceHistorySize) {
      this.performanceMetrics.shift();
    }

    this.emit('performanceMetric', metric);
  }

  /**
   * Calcola tempo di risposta medio
   */
  calculateAverageResponseTime() {
    if (this.performanceMetrics.length === 0) return 0;
    
    const total = this.performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return Math.round(total / this.performanceMetrics.length);
  }

  /**
   * Ottieni statistiche di performance
   */
  getPerformanceStats() {
    const successfulMetrics = this.performanceMetrics.filter(m => m.success);
    const failedMetrics = this.performanceMetrics.filter(m => !m.success);
    
    return {
      total: this.performanceMetrics.length,
      successful: successfulMetrics.length,
      failed: failedMetrics.length,
      successRate: this.performanceMetrics.length > 0 ? 
        (successfulMetrics.length / this.performanceMetrics.length) * 100 : 0,
      averageResponseTime: this.calculateAverageResponseTime(),
      minResponseTime: this.performanceMetrics.length > 0 ? 
        Math.min(...this.performanceMetrics.map(m => m.duration)) : 0,
      maxResponseTime: this.performanceMetrics.length > 0 ? 
        Math.max(...this.performanceMetrics.map(m => m.duration)) : 0
    };
  }

  /**
   * Cache per query
   */
  cacheQuery(queryHash, result) {
    this.queryCache.set(queryHash, {
      result,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Recupera dalla cache
   */
  getCachedQuery(queryHash) {
    const cached = this.queryCache.get(queryHash);
    if (cached) {
      cached.hits++;
      cached.lastAccess = Date.now();
      this.counters.cacheHits++;
      return cached.result;
    }
    this.counters.cacheMisses++;
    return null;
  }

  /**
   * Cache per emisferi
   */
  cacheHemisphere(hemisphereId, hemisphere) {
    this.hemisphereCache.set(hemisphereId, {
      hemisphere,
      lastUsed: Date.now(),
      accessCount: 0
    });
  }

  /**
   * Recupera emisfero dalla cache
   */
  getCachedHemisphere(hemisphereId) {
    const cached = this.hemisphereCache.get(hemisphereId);
    if (cached) {
      cached.accessCount++;
      cached.lastUsed = Date.now();
      return cached.hemisphere;
    }
    return null;
  }

  /**
   * Ottieni utilizzo memoria corrente
   */
  getMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    
    return {
      heap: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      system: {
        used: totalMemory - freeMemory,
        total: totalMemory,
        free: freeMemory,
        percentage: ((totalMemory - freeMemory) / totalMemory) * 100
      },
      external: memoryUsage.external,
      rss: memoryUsage.rss
    };
  }

  /**
   * Ottieni stato completo del sistema
   */
  getSystemStatus() {
    return {
      health: this.systemHealth,
      performance: this.getPerformanceStats(),
      memory: this.getMemoryUsage(),
      counters: this.counters,
      cache: {
        queryCache: this.queryCache.size,
        hemisphereCache: this.hemisphereCache.size
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch()
    };
  }

  /**
   * Incrementa contatore
   */
  incrementCounter(name) {
    if (this.counters.hasOwnProperty(name)) {
      this.counters[name]++;
    }
  }

  /**
   * Reset delle metriche
   */
  resetMetrics() {
    this.performanceMetrics = [];
    this.systemMetrics = {
      memory: [],
      cpu: [],
      hemispheres: [],
      queries: []
    };
    this.counters = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      gcRuns: 0,
      hemisphereCreations: 0
    };
    
    console.log('ResourceManager: Metriche resettate');
  }

  /**
   * Cleanup delle risorse
   */
  cleanup() {
    this.stopMonitoring();
    this.queryCache.clear();
    this.hemisphereCache.clear();
    this.removeAllListeners();
    
    console.log('ResourceManager: Cleanup completato');
  }
}

module.exports = ResourceManager;

