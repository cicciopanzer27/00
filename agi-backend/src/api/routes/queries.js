/**
 * Routes per gestione query AGI
 */

const express = require('express');
const Joi = require('joi');
const router = express.Router();

// Schema validazione query
const querySchema = Joi.object({
  query: Joi.string().required().min(1).max(5000),
  options: Joi.object({
    timeout: Joi.number().integer().min(1000).max(60000),
    cacheEnabled: Joi.boolean(),
    mode: Joi.string().valid('auto', 'direct', 'collaborative', 'meta_ignorance'),
    preferredHemisphere: Joi.string()
  }).optional()
});

/**
 * POST /api/v1/queries
 * Processa una nuova query
 */
router.post('/', async (req, res, next) => {
  try {
    // Validazione input
    const { error, value } = querySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details
      });
    }

    const { query, options = {} } = value;
    const orchestrator = req.app.locals.orchestrator;
    const database = req.app.locals.database;

    console.log(`🔍 Processing query: ${query.substring(0, 100)}...`);

    // Processa query
    const startTime = Date.now();
    const result = await orchestrator.processQuery(query, options);
    const processingTime = Date.now() - startTime;

    // Costruisci metadati estesi
    const extendedMeta = {
      origin: result.metadata?.origin || 'AI',
      methodology: result.metadata?.methodology || 'analisi computazionale',
      limitations: result.metadata?.limitations || ['Non validato sperimentalmente'],
      validation_status: result.metadata?.validation_status || 'peer_reviewed',
      contribution_type: result.metadata?.contribution_type || 'sintesi',
      timestamp: new Date().toISOString(),
      version: result.metadata?.version || '2.0',
      reviewers: result.metadata?.reviewers || ['AI-Reviewer-1'],
      requestId: req.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    // Salva query nel database
    try {
      await database.saveQuery({
        id: require('crypto').randomUUID(),
        query,
        hash: require('crypto').createHash('md5').update(query.toLowerCase().trim()).digest('hex'),
        timestamp: new Date().toISOString(),
        processingTime,
        success: result.success,
        confidence: result.confidence,
        mode: result.mode || 'unknown',
        primaryHemisphere: result.primaryHemisphere,
        collaboratingHemispheres: result.collaboratingHemispheres || [],
        response: result.response,
        metadata: extendedMeta
      });
    } catch (dbError) {
      console.warn('⚠️ Errore salvataggio query:', dbError.message);
    }

    // Risposta
    res.json({
      success: result.success,
      query,
      response: result.response,
      confidence: result.confidence,
      mode: result.mode,
      processingTime,
      metadata: extendedMeta,
      ...(result.knowledgeGaps && { knowledgeGaps: result.knowledgeGaps }),
      ...(result.suggestions && { suggestions: result.suggestions }),
      ...(result.newHemisphere && { newHemisphere: result.newHemisphere }),
      ...(result.collaboratingHemispheres && { collaboratingHemispheres: result.collaboratingHemispheres })
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/queries
 * Ottieni lista query recenti
 */
router.get('/', async (req, res, next) => {
  try {
    const database = req.app.locals.database;
    
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const success = req.query.success !== undefined ? req.query.success === 'true' : undefined;
    const mode = req.query.mode;

    let queries = await database.getRecentQueries(limit);

    // Filtri
    if (success !== undefined) {
      queries = queries.filter(q => q.success === (success ? 1 : 0));
    }
    
    if (mode) {
      queries = queries.filter(q => q.processing_mode === mode);
    }

    // Formatta risultati
    const formattedQueries = queries.map(query => ({
      id: query.id,
      query: query.query_text,
      timestamp: query.timestamp,
      processingTime: query.processing_time,
      success: query.success === 1,
      confidence: query.confidence,
      mode: query.processing_mode,
      primaryHemisphere: query.primary_hemisphere,
      collaboratingHemispheres: query.collaborating_hemispheres ? 
        JSON.parse(query.collaborating_hemispheres) : []
    }));

    res.json({
      queries: formattedQueries,
      total: formattedQueries.length,
      filters: {
        limit,
        success,
        mode
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/queries/stats
 * Ottieni statistiche query
 */
router.get('/stats', async (req, res, next) => {
  try {
    const database = req.app.locals.database;
    const orchestrator = req.app.locals.orchestrator;

    // Statistiche dal database
    const dbStats = await database.getQueryStats();
    
    // Statistiche dall'orchestrator
    const systemStatus = orchestrator.getSystemStatus();

    res.json({
      database: {
        total: dbStats.basic.total,
        successful: dbStats.basic.successful,
        failed: dbStats.basic.total - dbStats.basic.successful,
        successRate: dbStats.basic.total > 0 ? 
          (dbStats.basic.successful / dbStats.basic.total * 100).toFixed(2) : 0,
        averageProcessingTime: Math.round(dbStats.basic.avg_processing_time || 0),
        averageConfidence: parseFloat((dbStats.basic.avg_confidence || 0).toFixed(3))
      },
      byMode: dbStats.byMode.reduce((acc, item) => {
        acc[item.processing_mode] = item.count;
        return acc;
      }, {}),
      hourlyDistribution: dbStats.hourly,
      realTime: {
        totalQueries: systemStatus.totalQueries,
        averageResponseTime: systemStatus.averageResponseTime,
        averageConfidence: systemStatus.averageConfidence,
        activeQueries: systemStatus.activeQueries
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/queries/:id
 * Ottieni dettagli query specifica
 */
router.get('/:id', async (req, res, next) => {
  try {
    const database = req.app.locals.database;
    const queryId = req.params.id;

    const query = await database.get(
      'SELECT * FROM queries WHERE id = ?',
      [queryId]
    );

    if (!query) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Query not found'
      });
    }

    // Formatta risultato
    const formattedQuery = {
      id: query.id,
      query: query.query_text,
      hash: query.query_hash,
      timestamp: query.timestamp,
      processingTime: query.processing_time,
      success: query.success === 1,
      confidence: query.confidence,
      mode: query.processing_mode,
      primaryHemisphere: query.primary_hemisphere,
      collaboratingHemispheres: query.collaborating_hemispheres ? 
        JSON.parse(query.collaborating_hemispheres) : [],
      response: query.response ? JSON.parse(query.response) : null,
      metadata: query.metadata ? JSON.parse(query.metadata) : {}
    };

    res.json(formattedQuery);

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/queries/batch
 * Processa multiple query in batch
 */
router.post('/batch', async (req, res, next) => {
  try {
    const batchSchema = Joi.object({
      queries: Joi.array().items(Joi.string().min(1).max(5000)).required().min(1).max(10),
      options: Joi.object({
        timeout: Joi.number().integer().min(1000).max(60000),
        cacheEnabled: Joi.boolean(),
        parallel: Joi.boolean().default(false)
      }).optional()
    });

    const { error, value } = batchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { queries, options = {} } = value;
    const orchestrator = req.app.locals.orchestrator;

    console.log(`📦 Processing batch of ${queries.length} queries`);

    const startTime = Date.now();
    const results = [];

    if (options.parallel) {
      // Processamento parallelo
      const promises = queries.map(query => 
        orchestrator.processQuery(query, options).catch(error => ({
          success: false,
          error: error.message,
          query
        }))
      );
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    } else {
      // Processamento sequenziale
      for (const query of queries) {
        try {
          const result = await orchestrator.processQuery(query, options);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            query
          });
        }
      }
    }

    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;

    res.json({
      results,
      summary: {
        total: queries.length,
        successful,
        failed: queries.length - successful,
        successRate: (successful / queries.length * 100).toFixed(2),
        totalProcessingTime: totalTime,
        averageProcessingTime: Math.round(totalTime / queries.length),
        parallel: options.parallel
      },
      metadata: {
        requestId: req.id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/queries
 * Pulisci query vecchie (admin)
 */
router.delete('/', async (req, res, next) => {
  try {
    const database = req.app.locals.database;
    const daysToKeep = parseInt(req.query.days) || 30;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await database.run(
      'DELETE FROM queries WHERE timestamp < ?',
      [cutoffDate.toISOString()]
    );

    res.json({
      message: 'Query cleanup completed',
      deletedCount: result.changes,
      cutoffDate: cutoffDate.toISOString(),
      daysKept: daysToKeep
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/queries/filter
 * Filtra query per metadati
 */
router.get('/filter', async (req, res, next) => {
  try {
    const database = req.app.locals.database;
    
    const {
      validation_status,
      contribution_type,
      origin,
      limit = 50,
      sortBy = 'timestamp',
      order = 'desc'
    } = req.query;

    let queries = await database.getRecentQueries(parseInt(limit) * 2); // Prendi più dati per filtrare

    // Filtri per metadati
    if (validation_status) {
      queries = queries.filter(q => {
        const meta = JSON.parse(q.metadata || '{}');
        return meta.validation_status === validation_status;
      });
    }
    
    if (contribution_type) {
      queries = queries.filter(q => {
        const meta = JSON.parse(q.metadata || '{}');
        return meta.contribution_type === contribution_type;
      });
    }
    
    if (origin) {
      queries = queries.filter(q => {
        const meta = JSON.parse(q.metadata || '{}');
        return meta.origin === origin;
      });
    }

    // Ordinamento
    queries.sort((a, b) => {
      let aVal, bVal;
      
      if (sortBy === 'timestamp') {
        aVal = new Date(a.timestamp);
        bVal = new Date(b.timestamp);
      } else if (sortBy === 'confidence') {
        aVal = a.confidence;
        bVal = b.confidence;
      } else {
        aVal = a[sortBy];
        bVal = b[sortBy];
      }
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    // Limita risultati
    queries = queries.slice(0, parseInt(limit));

    // Formatta risultati con metadati
    const formattedQueries = queries.map(query => {
      const meta = JSON.parse(query.metadata || '{}');
      return {
        id: query.id,
        query: query.query_text,
        timestamp: query.timestamp,
        processingTime: query.processing_time,
        success: query.success === 1,
        confidence: query.confidence,
        mode: query.processing_mode,
        primaryHemisphere: query.primary_hemisphere,
        collaboratingHemispheres: query.collaborating_hemispheres ? 
          JSON.parse(query.collaborating_hemispheres) : [],
        metadata: meta
      };
    });

    res.json({
      queries: formattedQueries,
      total: formattedQueries.length,
      filters: {
        validation_status,
        contribution_type,
        origin,
        limit: parseInt(limit),
        sortBy,
        order
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/queries/:id/feedback
 * Segnala problema o richiedi validazione umana
 */
router.post('/:id/feedback', async (req, res, next) => {
  try {
    const feedbackSchema = Joi.object({
      type: Joi.string().valid('issue', 'validation_request', 'improvement').required(),
      description: Joi.string().required().min(10).max(1000),
      severity: Joi.string().valid('low', 'medium', 'high').default('medium'),
      reviewer_requested: Joi.boolean().default(false)
    });

    const { error, value } = feedbackSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const database = req.app.locals.database;
    const queryId = req.params.id;
    const { type, description, severity, reviewer_requested } = value;

    // Salva feedback nel database
    await database.saveSystemEvent({
      event_type: 'query_feedback',
      severity: severity,
      message: `Feedback su query ${queryId}: ${type}`,
      data: JSON.stringify({
        query_id: queryId,
        feedback_type: type,
        description,
        severity,
        reviewer_requested,
        user_ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      }),
      source: 'user_feedback'
    });

    // Se richiesta validazione umana, aggiorna metadati
    if (reviewer_requested) {
      const query = await database.get(
        'SELECT * FROM queries WHERE id = ?',
        [queryId]
      );
      
      if (query) {
        const meta = JSON.parse(query.metadata || '{}');
        meta.validation_status = 'pending_human_review';
        meta.reviewers = [...(meta.reviewers || []), 'Human-Reviewer-Requested'];
        
        await database.run(
          'UPDATE queries SET metadata = ? WHERE id = ?',
          [JSON.stringify(meta), queryId]
        );
      }
    }

    res.json({
      success: true,
      message: 'Feedback registrato con successo',
      feedback_id: queryId,
      validation_status: reviewer_requested ? 'pending_human_review' : 'unchanged'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

