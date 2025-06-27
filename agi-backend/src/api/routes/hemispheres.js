/**
 * Routes per gestione emisferi AGI
 */

const express = require('express');
const Joi = require('joi');
const router = express.Router();

/**
 * GET /api/v1/hemispheres
 * Ottieni lista di tutti gli emisferi
 */
router.get('/', async (req, res, next) => {
  try {
    const orchestrator = req.app.locals.orchestrator;
    const database = req.app.locals.database;

    const includeStats = req.query.stats === 'true';
    const sortBy = req.query.sort || 'domain';
    const order = req.query.order === 'desc' ? 'desc' : 'asc';

    // Ottieni emisferi dall'orchestrator
    const hemispheres = [];
    for (const [domain, hemisphere] of orchestrator.hemispheres) {
      const stats = hemisphere.getStats();
      
      hemispheres.push({
        id: stats.id,
        domain: stats.domain,
        createdAt: stats.createdAt,
        lastUsed: stats.lastUsed,
        usageCount: stats.usageCount,
        confidence: stats.confidence,
        knowledgeItems: stats.knowledgeItems,
        patterns: stats.patterns,
        metadata: stats.metadata,
        ...(includeStats && { 
          config: stats.config,
          detailedStats: await getDetailedHemisphereStats(database, stats.id)
        })
      });
    }

    // Ordinamento
    hemispheres.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    res.json({
      hemispheres,
      total: hemispheres.length,
      metadata: {
        includeStats,
        sortBy,
        order,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/hemispheres/:domain
 * Ottieni dettagli emisfero specifico
 */
router.get('/:domain', async (req, res, next) => {
  try {
    const orchestrator = req.app.locals.orchestrator;
    const database = req.app.locals.database;
    const domain = req.params.domain;

    const hemisphere = orchestrator.hemispheres.get(domain);
    if (!hemisphere) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Hemisphere '${domain}' not found`
      });
    }

    const stats = hemisphere.getStats();
    const detailedStats = await getDetailedHemisphereStats(database, stats.id);

    // Ottieni knowledge base (limitata per performance)
    const knowledgeBase = Array.from(hemisphere.knowledgeBase.entries())
      .slice(0, 50) // Primi 50 elementi
      .map(([key, value]) => ({ key, ...value }));

    // Estendi metadati
    const extendedMeta = {
      ...stats.metadata,
      origin: stats.metadata?.origin || 'AI',
      methodology: stats.metadata?.methodology || 'auto-generazione',
      limitations: stats.metadata?.limitations || ['Dominio specializzato, validazione limitata'],
      validation_status: stats.metadata?.validation_status || 'peer_reviewed',
      contribution_type: stats.metadata?.contribution_type || 'framework',
      timestamp: new Date().toISOString(),
      version: stats.metadata?.version || '2.0',
      reviewers: stats.metadata?.reviewers || ['AI-Reviewer-1']
    };

    res.json({
      id: stats.id,
      domain: stats.domain,
      createdAt: stats.createdAt,
      lastUsed: stats.lastUsed,
      usageCount: stats.usageCount,
      confidence: stats.confidence,
      knowledgeItems: stats.knowledgeItems,
      patterns: stats.patterns,
      metadata: extendedMeta,
      config: stats.config,
      knowledgeBase,
      detailedStats
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/hemispheres/:domain/analyze
 * Analizza una query con un emisfero specifico
 */
router.post('/:domain/analyze', async (req, res, next) => {
  try {
    const analyzeSchema = Joi.object({
      query: Joi.string().required().min(1).max(5000)
    });

    const { error, value } = analyzeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const orchestrator = req.app.locals.orchestrator;
    const domain = req.params.domain;
    const { query } = value;

    const hemisphere = orchestrator.hemispheres.get(domain);
    if (!hemisphere) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Hemisphere '${domain}' not found`
      });
    }

    console.log(`🔍 Analyzing query with ${domain}: ${query.substring(0, 100)}...`);

    const startTime = Date.now();
    const analysis = hemisphere.analyzeQuery(query);
    const processingTime = Date.now() - startTime;

    res.json({
      domain,
      query,
      analysis: {
        confidence: analysis.confidence,
        matchedPatterns: analysis.matchedPatterns,
        relevantKnowledge: analysis.relevantKnowledge.map(rk => ({
          key: rk.key,
          confidence: rk.knowledge.confidence,
          type: rk.knowledge.type,
          matches: rk.matches
        })),
        tokens: analysis.tokens
      },
      processingTime,
      metadata: {
        hemisphereId: hemisphere.id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/hemispheres/:domain/process
 * Processa una query con un emisfero specifico
 */
router.post('/:domain/process', async (req, res, next) => {
  try {
    const processSchema = Joi.object({
      query: Joi.string().required().min(1).max(5000),
      context: Joi.object().optional()
    });

    const { error, value } = processSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const orchestrator = req.app.locals.orchestrator;
    const domain = req.params.domain;
    const { query, context = {} } = value;

    const hemisphere = orchestrator.hemispheres.get(domain);
    if (!hemisphere) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Hemisphere '${domain}' not found`
      });
    }

    console.log(`⚙️ Processing query with ${domain}: ${query.substring(0, 100)}...`);

    const startTime = Date.now();
    const result = await hemisphere.processQuery(query, context);
    const processingTime = Date.now() - startTime;

    res.json({
      domain,
      query,
      success: result.success,
      response: result.response,
      confidence: result.confidence,
      processingTime,
      analysis: result.analysis,
      metadata: {
        hemisphereId: hemisphere.id,
        timestamp: new Date().toISOString(),
        ...result.metadata
      },
      ...(result.suggestions && { suggestions: result.suggestions })
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/hemispheres/:domain/stats
 * Ottieni statistiche dettagliate emisfero
 */
router.get('/:domain/stats', async (req, res, next) => {
  try {
    const orchestrator = req.app.locals.orchestrator;
    const database = req.app.locals.database;
    const domain = req.params.domain;

    const hemisphere = orchestrator.hemispheres.get(domain);
    if (!hemisphere) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Hemisphere '${domain}' not found`
      });
    }

    const stats = hemisphere.getStats();
    const detailedStats = await getDetailedHemisphereStats(database, stats.id);

    // Statistiche performance
    const performanceMetrics = await database.getPerformanceMetrics('hemisphere_analysis', 100);
    const hemisphereMetrics = performanceMetrics.filter(m => 
      m.metadata && JSON.parse(m.metadata).hemisphereId === stats.id
    );

    // Analisi utilizzo nel tempo
    const usageAnalysis = await database.all(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as queries,
        AVG(confidence) as avg_confidence,
        AVG(processing_time) as avg_processing_time
      FROM queries 
      WHERE primary_hemisphere = ? 
        AND timestamp > datetime('now', '-30 days')
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `, [domain]);

    res.json({
      basic: stats,
      detailed: detailedStats,
      performance: {
        totalMetrics: hemisphereMetrics.length,
        averageDuration: hemisphereMetrics.length > 0 ? 
          Math.round(hemisphereMetrics.reduce((sum, m) => sum + m.duration, 0) / hemisphereMetrics.length) : 0,
        successRate: hemisphereMetrics.length > 0 ? 
          (hemisphereMetrics.filter(m => m.success).length / hemisphereMetrics.length * 100).toFixed(2) : 0
      },
      usage: {
        last30Days: usageAnalysis,
        totalQueries: usageAnalysis.reduce((sum, day) => sum + day.queries, 0),
        averageConfidence: usageAnalysis.length > 0 ? 
          (usageAnalysis.reduce((sum, day) => sum + day.avg_confidence, 0) / usageAnalysis.length).toFixed(3) : 0
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/hemispheres/generate
 * Genera nuovo emisfero (auto-generation)
 */
router.post('/generate', async (req, res, next) => {
  try {
    const generateSchema = Joi.object({
      query: Joi.string().required().min(1).max(5000),
      force: Joi.boolean().default(false)
    });

    const { error, value } = generateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const orchestrator = req.app.locals.orchestrator;
    const database = req.app.locals.database;
    const { query, force } = value;

    console.log(`🔄 Attempting hemisphere generation for: ${query.substring(0, 100)}...`);

    // Analizza per nuovi domini
    const domainAnalysis = orchestrator.hemisphereFactory.analyzeQueryForDomains(
      query, 
      orchestrator.hemispheres
    );

    if (!domainAnalysis.shouldGenerate && !force) {
      return res.json({
        generated: false,
        reason: 'No suitable domain candidates found',
        analysis: domainAnalysis,
        suggestions: orchestrator.hemisphereFactory.suggestDomainsForGeneration(orchestrator.hemispheres)
      });
    }

    // Genera nuovo emisfero
    const generationResult = await orchestrator.hemisphereFactory.generateHemisphere(
      domainAnalysis,
      orchestrator.hemispheres
    );

    if (generationResult.success) {
      // Aggiungi all'orchestrator
      orchestrator.hemispheres.set(generationResult.domain, generationResult.hemisphere);
      orchestrator.stats.autoGeneratedHemispheres++;

      // Salva nel database
      await database.saveHemisphere(generationResult.hemisphere.serialize());
      await database.saveHemisphereGeneration({
        hemisphereId: generationResult.hemisphere.id,
        sourceQuery: query,
        reason: generationResult.analysis.potentialDomains[0]?.reason || 'Auto-generated',
        template: generationResult.metadata.template,
        confidence: generationResult.confidence,
        success: true,
        metadata: generationResult.metadata
      });

      console.log(`✨ New hemisphere generated: ${generationResult.domain}`);
    }

    res.json({
      generated: generationResult.success,
      domain: generationResult.domain,
      confidence: generationResult.confidence,
      analysis: generationResult.analysis,
      metadata: generationResult.metadata,
      ...(generationResult.error && { error: generationResult.error })
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/hemispheres/suggestions
 * Ottieni suggerimenti per nuovi emisferi
 */
router.get('/suggestions', async (req, res, next) => {
  try {
    const orchestrator = req.app.locals.orchestrator;

    const suggestions = orchestrator.hemisphereFactory.suggestDomainsForGeneration(
      orchestrator.hemispheres
    );

    const generationStats = orchestrator.hemisphereFactory.getGenerationStats();

    res.json({
      suggestions,
      generationStats,
      currentHemispheres: Array.from(orchestrator.hemispheres.keys()),
      availableTemplates: orchestrator.hemisphereFactory.getAvailableTemplates()
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/hemispheres/:domain
 * Elimina emisfero (admin)
 */
router.delete('/:domain', async (req, res, next) => {
  try {
    const orchestrator = req.app.locals.orchestrator;
    const database = req.app.locals.database;
    const domain = req.params.domain;

    // Verifica che l'emisfero esista
    const hemisphere = orchestrator.hemispheres.get(domain);
    if (!hemisphere) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Hemisphere '${domain}' not found`
      });
    }

    // Non permettere eliminazione emisferi base
    const baseDomains = ['mathematics', 'logic', 'code', 'language'];
    if (baseDomains.includes(domain)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete base hemisphere'
      });
    }

    // Rimuovi dall'orchestrator
    orchestrator.hemispheres.delete(domain);

    // Rimuovi dal database
    await database.run('DELETE FROM hemispheres WHERE domain = ?', [domain]);

    console.log(`🗑️ Hemisphere deleted: ${domain}`);

    res.json({
      message: `Hemisphere '${domain}' deleted successfully`,
      domain,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Funzione helper per statistiche dettagliate emisfero
 */
async function getDetailedHemisphereStats(database, hemisphereId) {
  try {
    // Query che hanno utilizzato questo emisfero
    const queryStats = await database.get(`
      SELECT 
        COUNT(*) as total_queries,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_queries,
        AVG(processing_time) as avg_processing_time,
        AVG(confidence) as avg_confidence,
        MAX(timestamp) as last_query
      FROM queries 
      WHERE primary_hemisphere = (SELECT domain FROM hemispheres WHERE id = ?)
    `, [hemisphereId]);

    // Metriche performance
    const performanceStats = await database.get(`
      SELECT 
        COUNT(*) as total_metrics,
        AVG(duration) as avg_duration,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_operations
      FROM performance_metrics 
      WHERE hemisphere_id = ?
    `, [hemisphereId]);

    return {
      queries: queryStats || {},
      performance: performanceStats || {}
    };
  } catch (error) {
    console.warn('⚠️ Error getting detailed hemisphere stats:', error.message);
    return { queries: {}, performance: {} };
  }
}

module.exports = router;

