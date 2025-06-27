/**
 * Server Express principale per AGI Meta-Ignorance Backend
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('rate-limiter-flexible');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// Import componenti AGI
const MetaIgnoranceOrchestrator = require('./core/MetaIgnoranceOrchestrator');
const SQLiteManager = require('./database/SQLiteManager');
const ResourceManager = require('./core/ResourceManager');

// Import routes
const queryRoutes = require('./api/routes/queries');
const hemisphereRoutes = require('./api/routes/hemispheres');
const metricsRoutes = require('./api/routes/metrics');
const systemRoutes = require('./api/routes/system');
const adminRoutes = require('./api/routes/admin');

class AGIServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.host = process.env.HOST || '0.0.0.0';
    
    // Componenti AGI
    this.database = null;
    this.resourceManager = null;
    this.orchestrator = null;
    
    // Rate limiter
    this.rateLimiter = new rateLimit.RateLimiterMemory({
      keyGenerator: (req) => req.ip,
      points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900, // 15 minuti
    });
    
    this.isInitialized = false;
  }

  /**
   * Inizializza il server
   */
  async initialize() {
    console.log('🚀 Inizializzazione AGI Server...');
    
    try {
      // Inizializza componenti AGI
      await this.initializeAGIComponents();
      
      // Configura middleware
      this.setupMiddleware();
      
      // Configura routes
      this.setupRoutes();
      
      // Configura error handling
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('✅ Server AGI inizializzato');
      
    } catch (error) {
      console.error('❌ Errore inizializzazione server:', error);
      throw error;
    }
  }

  /**
   * Inizializza componenti AGI
   */
  async initializeAGIComponents() {
    console.log('🧠 Inizializzazione componenti AGI...');
    
    // Database
    this.database = new SQLiteManager({
      dbPath: process.env.DB_PATH || './data/agi.db',
      backupPath: process.env.DB_BACKUP_PATH || './data/backups'
    });
    await this.database.initialize();
    
    // Resource Manager
    this.resourceManager = new ResourceManager({
      maxMemoryUsage: parseFloat(process.env.MAX_MEMORY_USAGE) || 0.8,
      monitoringInterval: parseInt(process.env.MONITORING_INTERVAL) || 5000,
      cacheSize: parseInt(process.env.CACHE_SIZE) || 1000
    });
    
    // Orchestrator
    this.orchestrator = new MetaIgnoranceOrchestrator(
      this.database,
      this.resourceManager,
      {
        confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.5,
        autoGenerationEnabled: process.env.AUTO_GENERATION_ENABLED !== 'false',
        maxHemispheres: parseInt(process.env.MAX_HEMISPHERES) || 50
      }
    );
    
    // Rendi disponibili i componenti nelle routes
    this.app.locals.database = this.database;
    this.app.locals.resourceManager = this.resourceManager;
    this.app.locals.orchestrator = this.orchestrator;
    
    console.log('✅ Componenti AGI inizializzati');
  }

  /**
   * Configura middleware
   */
  setupMiddleware() {
    console.log('⚙️ Configurazione middleware...');
    
    // Middleware di sicurezza
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
    
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }));
    
    // Rate limiting
    this.app.use('/api/', async (req, res, next) => {
      try {
        await this.rateLimiter.consume(req.ip);
        next();
      } catch (error) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(error.msBeforeNext / 1000)
        });
      }
    });
    
    // Compression
    this.app.use(compression());
    
    // Logging
    this.app.use(morgan('combined'));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Servi file statici dalla directory public
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // Request ID per tracking
    this.app.use((req, res, next) => {
      req.id = crypto.randomUUID();
      next();
    });
    
    // Health check middleware
    this.app.use((req, res, next) => {
      if (!this.isInitialized && req.path !== '/health') {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Server is still initializing'
        });
      }
      next();
    });
  }

  /**
   * Configura routes
   */
  setupRoutes() {
    console.log('🛣️ Configurazione routes...');
    
    // Health check
    this.app.get('/health', (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: require('../package.json').version,
        environment: process.env.NODE_ENV || 'development'
      };
      
      if (this.isInitialized && this.resourceManager) {
        health.system = this.resourceManager.getSystemStatus();
      }
      
      res.json(health);
    });
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'AGI Meta-Ignorance Backend',
        version: require('../package.json').version,
        description: 'Backend completo per sistema AGI con Meta-Ignorance e auto-generazione emisferi',
        endpoints: {
          health: '/health',
          api: '/api/v1',
          docs: '/api/docs'
        },
        features: [
          'Meta-Ignorance Tracking',
          'Auto-Generation Hemispheres',
          'Performance Monitoring',
          'Knowledge Gap Analysis',
          'Collaborative Processing'
        ]
      });
    });
    
    // API Routes
    const apiRouter = express.Router();
    
    // Mount route modules
    apiRouter.use('/queries', queryRoutes);
    apiRouter.use('/hemispheres', hemisphereRoutes);
    apiRouter.use('/metrics', metricsRoutes);
    apiRouter.use('/system', systemRoutes);
    apiRouter.use('/admin', adminRoutes);
    
    // API info endpoint
    apiRouter.get('/', (req, res) => {
      res.json({
        name: 'AGI Meta-Ignorance API',
        version: 'v1',
        endpoints: {
          queries: '/api/v1/queries',
          hemispheres: '/api/v1/hemispheres',
          metrics: '/api/v1/metrics',
          system: '/api/v1/system',
          admin: '/api/v1/admin'
        }
      });
    });
    
    this.app.use('/api/v1', apiRouter);
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        availableEndpoints: [
          'GET /',
          'GET /health',
          'GET /api/v1',
          'POST /api/v1/queries',
          'GET /api/v1/hemispheres',
          'GET /api/v1/metrics',
          'GET /api/v1/system'
        ]
      });
    });
  }

  /**
   * Configura error handling
   */
  setupErrorHandling() {
    console.log('🛡️ Configurazione error handling...');
    
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('❌ Errore server:', error);
      
      // Log error nel database se possibile
      if (this.database) {
        this.database.saveSystemEvent({
          type: 'server_error',
          severity: 'error',
          message: error.message,
          data: {
            stack: error.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          },
          source: 'express_server'
        }).catch(console.error);
      }
      
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
        requestId: req.id,
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: error.stack })
      });
    });
    
    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Promise Rejection:', reason);
      
      if (this.database) {
        this.database.saveSystemEvent({
          type: 'unhandled_rejection',
          severity: 'error',
          message: 'Unhandled Promise Rejection',
          data: { reason: reason.toString() },
          source: 'process'
        }).catch(console.error);
      }
    });
    
    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      
      if (this.database) {
        this.database.saveSystemEvent({
          type: 'uncaught_exception',
          severity: 'critical',
          message: 'Uncaught Exception',
          data: { error: error.toString(), stack: error.stack },
          source: 'process'
        }).catch(console.error);
      }
      
      // Graceful shutdown
      this.shutdown();
    });
  }

  /**
   * Avvia il server
   */
  async start() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const server = this.app.listen(this.port, this.host, () => {
        console.log(`🚀 AGI Server in ascolto su ${this.host}:${this.port}`);
        console.log(`📊 Health check: http://${this.host}:${this.port}/health`);
        console.log(`🔗 API: http://${this.host}:${this.port}/api/v1`);
        
        // Log evento di avvio
        if (this.database) {
          this.database.saveSystemEvent({
            type: 'server_started',
            severity: 'info',
            message: `Server avviato su ${this.host}:${this.port}`,
            data: {
              host: this.host,
              port: this.port,
              environment: process.env.NODE_ENV || 'development',
              nodeVersion: process.version
            },
            source: 'express_server'
          }).catch(console.error);
        }
      });
      
      // Graceful shutdown
      const gracefulShutdown = () => {
        console.log('🛑 Ricevuto segnale di shutdown...');
        server.close(() => {
          console.log('✅ Server HTTP chiuso');
          this.shutdown();
        });
      };
      
      process.on('SIGTERM', gracefulShutdown);
      process.on('SIGINT', gracefulShutdown);
      
      return server;
      
    } catch (error) {
      console.error('❌ Errore avvio server:', error);
      process.exit(1);
    }
  }

  /**
   * Shutdown graceful
   */
  async shutdown() {
    console.log('🧹 Shutdown componenti AGI...');
    
    try {
      if (this.orchestrator) {
        await this.orchestrator.cleanup();
      }
      
      if (this.resourceManager) {
        this.resourceManager.cleanup();
      }
      
      if (this.database) {
        await this.database.close();
      }
      
      console.log('✅ Shutdown completato');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Errore durante shutdown:', error);
      process.exit(1);
    }
  }
}

// Avvia server se chiamato direttamente
if (require.main === module) {
  const server = new AGIServer();
  server.start();
}

module.exports = AGIServer;

