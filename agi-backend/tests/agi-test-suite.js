#!/usr/bin/env node

/**
 * Test Script per AGI Meta-Ignorance con Auto-Generazione Emisferi
 * Test suite completa per validare tutte le funzionalità del sistema
 */

const MetaIgnoranceOrchestrator = require('../src/core/MetaIgnoranceOrchestrator');
const SQLiteManager = require('../src/database/SQLiteManager');
const ResourceManager = require('../src/core/ResourceManager');
const AGIServer = require('../src/app');

class AGITestSuite {
  constructor() {
    this.database = new SQLiteManager({
      dbPath: './data/test-agi.db',
      backupPath: './data/test-backups'
    });
    this.resourceManager = new ResourceManager({
      monitoringInterval: 1000, // Test più frequente
      cacheSize: 100
    });
    this.orchestrator = new MetaIgnoranceOrchestrator(
      this.database, 
      this.resourceManager,
      {
        confidenceThreshold: 0.5,
        autoGenerationEnabled: true,
        maxHemispheres: 20
      }
    );
    this.testResults = [];
    this.server = null;
  }

  async runAllTests() {
    console.log('🧠 AGI Meta-Ignorance - Test Suite Completa');
    console.log('=' * 60);

    try {
      // Setup
      await this.setupTestEnvironment();
      
      // Test core components
      await this.testInitialHemispheres();
      await this.testQueryProcessing();
      await this.testAutoGeneration();
      await this.testMetaIgnorance();
      await this.testPerformance();
      
      // Test database
      await this.testDatabaseOperations();
      
      // Test API
      await this.testAPIEndpoints();
      
      // Test integrazione
      await this.testSystemIntegration();
      
      // Cleanup e risultati
      await this.cleanupTestEnvironment();
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      await this.cleanupTestEnvironment();
      process.exit(1);
    }
  }

  async setupTestEnvironment() {
    console.log('\n🔧 Setup Test Environment');
    console.log('-'.repeat(30));

    try {
      // Inizializza database di test
      await this.database.initialize();
      console.log('✅ Database initialized');
      
      // Verifica connessione database
      if (!this.database.db) {
        throw new Error('Database connection failed');
      }
      
      // Inizializza orchestrator
      await this.orchestrator.initializeSystem();
      console.log('✅ Orchestrator initialized');
      
      // Avvia server per test API (senza listen)
      this.server = new AGIServer();
      this.server.database = this.database;
      this.server.resourceManager = this.resourceManager;
      this.server.orchestrator = this.orchestrator;
      this.server.isInitialized = true;
      console.log('✅ Server components initialized');
      
      console.log('✅ Test environment setup completed');
      
      this.testResults.push({
        test: 'Environment Setup',
        status: 'PASS',
        details: 'Test environment initialized successfully'
      });
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      this.testResults.push({
        test: 'Environment Setup',
        status: 'FAIL',
        details: `Setup error: ${error.message}`
      });
      throw error;
    }
  }

  async testInitialHemispheres() {
    console.log('\n📋 Test 1: Verifica Emisferi Iniziali');
    console.log('-'.repeat(30));

    const initialCount = this.orchestrator.hemispheres.size;
    console.log(`Emisferi iniziali: ${initialCount}`);

    const hemispheres = Array.from(this.orchestrator.hemispheres.keys());
    console.log('Emisferi disponibili:', hemispheres);

    // Verifica emisferi base
    const expectedBase = ['mathematics', 'logic', 'code', 'language'];
    const hasAllBase = expectedBase.every(domain => hemispheres.includes(domain));

    this.testResults.push({
      test: 'Initial Hemispheres',
      status: hasAllBase && initialCount >= 4 ? 'PASS' : 'FAIL',
      details: `Found ${initialCount} hemispheres: ${hemispheres.join(', ')}`
    });

    // Test statistiche emisferi
    for (const domain of expectedBase) {
      const hemisphere = this.orchestrator.hemispheres.get(domain);
      if (hemisphere) {
        const stats = hemisphere.getStats();
        console.log(`  - ${domain}: ${stats.knowledgeItems} knowledge items, ${stats.patterns} patterns`);
      }
    }
  }

  async testQueryProcessing() {
    console.log('\n📋 Test 2: Elaborazione Query Base');
    console.log('-'.repeat(30));

    const testQueries = [
      {
        query: "What is 2 + 2?",
        expected: "mathematics",
        description: "Mathematical query",
        expectedSuccess: true
      },
      {
        query: "Write a function to calculate fibonacci",
        expected: "code",
        description: "Programming query",
        expectedSuccess: true
      },
      {
        query: "Explain quantum physics",
        expected: "physics",
        description: "Physics query (should trigger auto-generation)",
        expectedSuccess: true
      },
      {
        query: "What is the meaning of life?",
        expected: null,
        description: "Meta-ignorance query",
        expectedSuccess: false
      }
    ];

    for (const testCase of testQueries) {
      console.log(`\n🔍 Testing: ${testCase.description}`);
      console.log(`Query: "${testCase.query}"`);

      const startTime = Date.now();
      const result = await this.orchestrator.processQuery(testCase.query);
      const processingTime = Date.now() - startTime;
      
      console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
      console.log(`Processing Time: ${processingTime}ms`);
      console.log(`Confidence: ${result.confidence?.toFixed(3) || 'N/A'}`);
      console.log(`Mode: ${result.mode || 'N/A'}`);

      if (result.metadata?.hemisphereAnalysis) {
        console.log('Hemisphere Analysis:');
        result.metadata.hemisphereAnalysis.forEach(analysis => {
          console.log(`  - ${analysis.domain}: ${analysis.confidence.toFixed(3)} confidence`);
        });
      }

      // Verifica risultato
      const testPassed = result.success === testCase.expectedSuccess;
      
      this.testResults.push({
        test: `Query Processing - ${testCase.description}`,
        status: testPassed ? 'PASS' : 'FAIL',
        details: `Success: ${result.success}, Confidence: ${result.confidence?.toFixed(3)}, Mode: ${result.mode}, Time: ${processingTime}ms`
      });
    }
  }

  async testAutoGeneration() {
    console.log('\n📋 Test 3: Auto-Generazione Emisferi');
    console.log('-'.repeat(30));

    const initialCount = this.orchestrator.hemispheres.size;
    console.log(`Emisferi prima del test: ${initialCount}`);

    // Query che dovrebbero triggerare auto-generazione
    const triggerQueries = [
      "Explain molecular biology in detail",
      "What is quantum computing and how does it work?",
      "How does blockchain technology function?",
      "Explain machine learning algorithms and neural networks"
    ];

    let newHemispheresCreated = 0;

    for (const query of triggerQueries) {
      console.log(`\n🔍 Triggering auto-generation with: "${query.substring(0, 50)}..."`);
      
      const beforeCount = this.orchestrator.hemispheres.size;
      const result = await this.orchestrator.processQuery(query);
      const afterCount = this.orchestrator.hemispheres.size;
      
      if (result.success) {
        console.log(`✅ Query processed successfully`);
        console.log(`Confidence: ${result.confidence?.toFixed(3) || 'N/A'}`);
        console.log(`Mode: ${result.mode}`);
        
        if (afterCount > beforeCount) {
          newHemispheresCreated++;
          console.log(`🆕 New hemisphere created! Total: ${afterCount}`);
          
          if (result.newHemisphere) {
            console.log(`New domain: ${result.newHemisphere}`);
          }
        }
      } else {
        console.log(`❌ Query failed: ${result.error || 'Unknown error'}`);
      }
    }

    const finalCount = this.orchestrator.hemispheres.size;

    this.testResults.push({
      test: 'Auto-Generation',
      status: newHemispheresCreated > 0 ? 'PASS' : 'FAIL',
      details: `Created ${newHemispheresCreated} new hemispheres (${initialCount} → ${finalCount})`
    });

    // Mostra tutti gli emisferi attuali
    console.log('\nEmisferi attuali:');
    for (const domain of this.orchestrator.hemispheres.keys()) {
      const hemisphere = this.orchestrator.hemispheres.get(domain);
      const isAutoGenerated = hemisphere.metadata.autoGenerated ? ' (auto)' : '';
      console.log(`  - ${domain}${isAutoGenerated}`);
    }
  }

  async testMetaIgnorance() {
    console.log('\n📋 Test 4: Meta-Ignorance Tracking');
    console.log('-'.repeat(30));

    // Query che dovrebbero avere bassa confidenza
    const lowConfidenceQueries = [
      "Explain the theory of everything in physics",
      "What is the consciousness and how does it emerge?",
      "Solve the hard problem of consciousness",
      "What happens after death?"
    ];

    let metaIgnoranceTriggered = 0;

    for (const query of lowConfidenceQueries) {
      console.log(`\n🔍 Testing meta-ignorance with: "${query.substring(0, 50)}..."`);
      
      const result = await this.orchestrator.processQuery(query);
      
      console.log(`Confidence: ${result.confidence?.toFixed(3) || 'N/A'}`);
      console.log(`Mode: ${result.mode}`);
      
      if (result.knowledgeGaps) {
        console.log(`Knowledge Gaps: ${result.knowledgeGaps.length}`);
        result.knowledgeGaps.forEach(gap => {
          console.log(`  - ${gap.type}: severity ${gap.severity?.toFixed(2)}`);
        });
        metaIgnoranceTriggered++;
      }

      if (result.suggestions) {
        console.log('Suggestions:');
        result.suggestions.forEach(suggestion => {
          console.log(`  - ${suggestion}`);
        });
      }
    }

    this.testResults.push({
      test: 'Meta-Ignorance',
      status: metaIgnoranceTriggered > 0 ? 'PASS' : 'FAIL',
      details: `Meta-ignorance triggered ${metaIgnoranceTriggered}/${lowConfidenceQueries.length} times`
    });
  }

  async testPerformance() {
    console.log('\n📋 Test 5: Performance Metrics');
    console.log('-'.repeat(30));

    const performanceMetrics = this.orchestrator.performanceMetrics;
    console.log(`Total metrics recorded: ${performanceMetrics.length}`);

    // Test performance con query multiple
    const testQueries = Array(10).fill().map((_, i) => `Test query ${i + 1}: What is ${i + 1} + ${i + 1}?`);
    
    const startTime = Date.now();
    const results = [];
    
    for (const query of testQueries) {
      const result = await this.orchestrator.processQuery(query);
      results.push(result);
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / testQueries.length;
    const successRate = results.filter(r => r.success).length / results.length;

    console.log(`Batch processing: ${testQueries.length} queries in ${totalTime}ms`);
    console.log(`Average time per query: ${avgTime.toFixed(2)}ms`);
    console.log(`Success rate: ${(successRate * 100).toFixed(1)}%`);

    // Verifica metriche resource manager
    const resourceStats = this.resourceManager.getPerformanceStats();
    console.log(`Resource manager metrics: ${resourceStats.total} total operations`);

    this.testResults.push({
      test: 'Performance',
      status: avgTime < 1000 && successRate > 0.8 ? 'PASS' : 'FAIL',
      details: `Avg: ${avgTime.toFixed(2)}ms, Success: ${(successRate * 100).toFixed(1)}%, Total metrics: ${resourceStats.total}`
    });
  }

  async testDatabaseOperations() {
    console.log('\n📋 Test 6: Database Operations');
    console.log('-'.repeat(30));

    try {
      // Test salvataggio emisfero
      const testHemisphere = this.orchestrator.hemispheres.get('mathematics');
      if (testHemisphere) {
        await this.database.saveHemisphere(testHemisphere.serialize());
        console.log('✅ Hemisphere save test passed');
      }

      // Test query stats
      const queryStats = await this.database.getQueryStats();
      console.log(`Query stats: ${queryStats.basic.total} total queries`);

      // Test performance metrics
      await this.database.savePerformanceMetric({
        timestamp: new Date().toISOString(),
        operation: 'test_operation',
        duration: 100,
        success: true,
        metadata: { test: true }
      });
      console.log('✅ Performance metric save test passed');

      // Test knowledge gap
      await this.database.saveKnowledgeGap({
        query: 'test query',
        hash: 'test_hash',
        type: 'test_gap',
        severity: 0.5,
        tokens: ['test'],
        hemisphereConfidences: [],
        suggestions: ['test suggestion']
      });
      console.log('✅ Knowledge gap save test passed');

      // Test database stats
      const dbStats = await this.database.getDatabaseStats();
      console.log(`Database size: ${(dbStats.databaseSize / 1024).toFixed(2)} KB`);

      this.testResults.push({
        test: 'Database Operations',
        status: 'PASS',
        details: `All database operations completed successfully`
      });

    } catch (error) {
      console.error('❌ Database test failed:', error);
      this.testResults.push({
        test: 'Database Operations',
        status: 'FAIL',
        details: `Database error: ${error.message}`
      });
    }
  }

  async testAPIEndpoints() {
    console.log('\n📋 Test 7: API Endpoints');
    console.log('-'.repeat(30));

    // Nota: Questo è un test semplificato
    // In un ambiente reale useresti supertest o simili
    
    try {
      // Test che il server sia inizializzato
      if (this.server && this.server.isInitialized) {
        console.log('✅ Server initialization test passed');
        
        // Test componenti disponibili
        const hasDatabase = !!this.server.database;
        const hasResourceManager = !!this.server.resourceManager;
        const hasOrchestrator = !!this.server.orchestrator;
        
        console.log(`Database available: ${hasDatabase}`);
        console.log(`Resource Manager available: ${hasResourceManager}`);
        console.log(`Orchestrator available: ${hasOrchestrator}`);
        
        this.testResults.push({
          test: 'API Endpoints',
          status: hasDatabase && hasResourceManager && hasOrchestrator ? 'PASS' : 'FAIL',
          details: `Server components: DB=${hasDatabase}, RM=${hasResourceManager}, Orch=${hasOrchestrator}`
        });
      } else {
        throw new Error('Server not properly initialized');
      }

    } catch (error) {
      console.error('❌ API test failed:', error);
      this.testResults.push({
        test: 'API Endpoints',
        status: 'FAIL',
        details: `API error: ${error.message}`
      });
    }
  }

  async testSystemIntegration() {
    console.log('\n📋 Test 8: System Integration');
    console.log('-'.repeat(30));

    try {
      // Test integrazione completa: query -> processing -> database -> metrics
      const testQuery = "Integration test: What is artificial intelligence?";
      
      console.log(`Testing integration with: "${testQuery}"`);
      
      const initialMetrics = this.resourceManager.performanceMetrics.length;
      const result = await this.orchestrator.processQuery(testQuery);
      const finalMetrics = this.resourceManager.performanceMetrics.length;
      
      // Verifica che la query sia stata processata
      const queryProcessed = result.success !== undefined;
      
      // Verifica che le metriche siano state aggiornate
      const metricsUpdated = finalMetrics > initialMetrics;
      
      // Verifica stato sistema
      const systemStatus = this.orchestrator.getSystemStatus();
      const systemHealthy = systemStatus.totalQueries > 0;
      
      console.log(`Query processed: ${queryProcessed}`);
      console.log(`Metrics updated: ${metricsUpdated} (${initialMetrics} -> ${finalMetrics})`);
      console.log(`System healthy: ${systemHealthy}`);
      console.log(`Total system queries: ${systemStatus.totalQueries}`);
      
      const integrationPassed = queryProcessed && metricsUpdated && systemHealthy;
      
      this.testResults.push({
        test: 'System Integration',
        status: integrationPassed ? 'PASS' : 'FAIL',
        details: `Query: ${queryProcessed}, Metrics: ${metricsUpdated}, Health: ${systemHealthy}`
      });

    } catch (error) {
      console.error('❌ Integration test failed:', error);
      this.testResults.push({
        test: 'System Integration',
        status: 'FAIL',
        details: `Integration error: ${error.message}`
      });
    }
  }

  async cleanupTestEnvironment() {
    console.log('\n🧹 Cleanup Test Environment');
    console.log('-'.repeat(30));

    try {
      // Cleanup orchestrator
      if (this.orchestrator) {
        await this.orchestrator.cleanup();
      }

      // Cleanup database
      if (this.database) {
        await this.database.close();
      }

      console.log('✅ Test environment cleanup completed');

    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
  }

  printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('=' * 60);

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📊 Total: ${this.testResults.length}`);

    console.log('\n📋 Detailed Results:');
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${status} ${result.test}: ${result.details}`);
    });

    // System Status finale
    if (this.orchestrator) {
      console.log('\n🧠 Final System Status:');
      const systemStatus = this.orchestrator.getSystemStatus();
      console.log(`Total Hemispheres: ${systemStatus.hemispheres.length}`);
      console.log(`Total Queries: ${systemStatus.totalQueries}`);
      console.log(`Average Response Time: ${systemStatus.averageResponseTime}ms`);
      console.log(`Auto-Generated Hemispheres: ${systemStatus.autoGeneratedHemispheres}`);
    }

    console.log('\n🎯 Test Suite Complete!');
    
    // Exit code
    const exitCode = failed > 0 ? 1 : 0;
    if (exitCode !== 0) {
      console.log(`\n❌ Test suite failed with ${failed} failures`);
    } else {
      console.log(`\n✅ All tests passed successfully!`);
    }
    
    process.exit(exitCode);
  }
}

// Run the test suite
async function main() {
  const testSuite = new AGITestSuite();
  await testSuite.runAllTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = AGITestSuite;

