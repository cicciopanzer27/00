#!/usr/bin/env node

/**
 * Test semplificato per AGI Meta-Ignorance
 * Test delle funzionalità core senza dipendenze database
 */

const Hemisphere = require('../src/core/Hemisphere');
const HemisphereFactory = require('../src/core/HemisphereFactory');
const ResourceManager = require('../src/core/ResourceManager');

class SimpleAGITest {
  constructor() {
    this.testResults = [];
  }

  async runTests() {
    console.log('🧠 AGI Meta-Ignorance - Test Semplificato');
    console.log('=' * 50);

    try {
      await this.testHemisphere();
      await this.testHemisphereFactory();
      await this.testResourceManager();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
  }

  async testHemisphere() {
    console.log('\n📋 Test 1: Hemisphere Base');
    console.log('-'.repeat(30));

    try {
      // Test creazione emisfero
      const mathHemisphere = new Hemisphere('mathematics');
      console.log(`✅ Emisfero creato: ${mathHemisphere.domain}`);
      
      // Test analisi query
      const testQuery = "What is 2 + 2?";
      const analysis = mathHemisphere.analyzeQuery(testQuery);
      console.log(`Query: "${testQuery}"`);
      console.log(`Confidence: ${analysis.confidence.toFixed(3)}`);
      console.log(`Matched patterns: ${analysis.matchedPatterns.length}`);
      
      // Test processing
      const result = await mathHemisphere.processQuery(testQuery);
      console.log(`Processing success: ${result.success}`);
      console.log(`Response type: ${result.response?.type || 'N/A'}`);
      
      this.testResults.push({
        test: 'Hemisphere Base',
        status: result.success ? 'PASS' : 'FAIL',
        details: `Confidence: ${analysis.confidence.toFixed(3)}, Success: ${result.success}`
      });

    } catch (error) {
      console.error('❌ Hemisphere test failed:', error);
      this.testResults.push({
        test: 'Hemisphere Base',
        status: 'FAIL',
        details: `Error: ${error.message}`
      });
    }
  }

  async testHemisphereFactory() {
    console.log('\n📋 Test 2: Hemisphere Factory');
    console.log('-'.repeat(30));

    try {
      const factory = new HemisphereFactory();
      
      // Test analisi domini
      const existingHemispheres = new Map();
      existingHemispheres.set('mathematics', new Hemisphere('mathematics'));
      existingHemispheres.set('logic', new Hemisphere('logic'));
      
      const testQuery = "Explain quantum physics and wave-particle duality";
      const analysis = factory.analyzeQueryForDomains(testQuery, existingHemispheres);
      
      console.log(`Query: "${testQuery}"`);
      console.log(`Should generate: ${analysis.shouldGenerate}`);
      console.log(`Potential domains: ${analysis.potentialDomains.length}`);
      
      if (analysis.potentialDomains.length > 0) {
        const bestDomain = analysis.potentialDomains[0];
        console.log(`Best domain: ${bestDomain.domain} (confidence: ${bestDomain.confidence.toFixed(3)})`);
      }
      
      // Test generazione
      if (analysis.shouldGenerate) {
        const generation = await factory.generateHemisphere(analysis, existingHemispheres);
        console.log(`Generation success: ${generation.success}`);
        if (generation.success) {
          console.log(`New hemisphere: ${generation.domain}`);
        }
      }
      
      // Test suggerimenti
      const suggestions = factory.suggestDomainsForGeneration(existingHemispheres);
      console.log(`Suggestions: ${suggestions.length} domains`);
      
      this.testResults.push({
        test: 'Hemisphere Factory',
        status: analysis.potentialDomains.length > 0 ? 'PASS' : 'FAIL',
        details: `Domains: ${analysis.potentialDomains.length}, Should generate: ${analysis.shouldGenerate}`
      });

    } catch (error) {
      console.error('❌ Factory test failed:', error);
      this.testResults.push({
        test: 'Hemisphere Factory',
        status: 'FAIL',
        details: `Error: ${error.message}`
      });
    }
  }

  async testResourceManager() {
    console.log('\n📋 Test 3: Resource Manager');
    console.log('-'.repeat(30));

    try {
      const resourceManager = new ResourceManager({
        monitoringInterval: 1000,
        cacheSize: 10
      });
      
      // Test metriche
      resourceManager.recordPerformanceMetric('test_operation', 100, true, { test: true });
      const stats = resourceManager.getPerformanceStats();
      console.log(`Performance metrics: ${stats.total} total`);
      
      // Test cache
      resourceManager.cacheQuery('test_hash', { result: 'test' });
      const cached = resourceManager.getCachedQuery('test_hash');
      console.log(`Cache test: ${cached ? 'HIT' : 'MISS'}`);
      
      // Test memoria
      const memoryUsage = resourceManager.getMemoryUsage();
      console.log(`Memory usage: ${memoryUsage.heap.percentage.toFixed(1)}% heap`);
      
      // Test stato sistema
      const systemStatus = resourceManager.getSystemStatus();
      console.log(`System health: ${systemStatus.health.status}`);
      
      resourceManager.cleanup();
      
      this.testResults.push({
        test: 'Resource Manager',
        status: stats.total > 0 && cached ? 'PASS' : 'FAIL',
        details: `Metrics: ${stats.total}, Cache: ${cached ? 'working' : 'failed'}`
      });

    } catch (error) {
      console.error('❌ Resource Manager test failed:', error);
      this.testResults.push({
        test: 'Resource Manager',
        status: 'FAIL',
        details: `Error: ${error.message}`
      });
    }
  }

  printResults() {
    console.log('\n📊 Test Results');
    console.log('=' * 30);

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${this.testResults.length}`);

    console.log('\n📋 Details:');
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.details}`);
    });

    if (failed > 0) {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  }
}

// Run tests
async function main() {
  const test = new SimpleAGITest();
  await test.runTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test crashed:', error);
    process.exit(1);
  });
}

module.exports = SimpleAGITest;

