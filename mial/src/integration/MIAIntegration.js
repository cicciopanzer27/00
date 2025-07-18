/**
 * MIA Integration - Integrates MIAL with the MIA system
 */

const fs = require('fs');
const path = require('path');

class MIAIntegration {
  constructor() {
    this.roadmapPath = path.join(process.cwd(), 'mia_symbolic_roadmap.json');
    this.mialDataPath = path.join(process.cwd(), 'mial_integration_data.json');
    this.isEnabled = this.checkMIASystem();
  }

  /**
   * Check if MIA system is available
   */
  checkMIASystem() {
    try {
      return fs.existsSync(this.roadmapPath);
    } catch (error) {
      console.warn('⚠️ MIA system not found, running in standalone mode');
      return false;
    }
  }

  /**
   * Load MIA roadmap
   */
  loadRoadmap() {
    if (!this.isEnabled) return null;
    
    try {
      const data = fs.readFileSync(this.roadmapPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error loading MIA roadmap:', error.message);
      return null;
    }
  }

  /**
   * Save MIA roadmap
   */
  saveRoadmap(roadmap) {
    if (!this.isEnabled) return false;
    
    try {
      fs.writeFileSync(this.roadmapPath, JSON.stringify(roadmap, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Error saving MIA roadmap:', error.message);
      return false;
    }
  }

  /**
   * Add symbol to MIA system
   */
  async addSymbol(symbol) {
    if (!this.isEnabled) {
      console.log('🔸 Symbol created (standalone):', symbol.name);
      return;
    }
    
    const roadmap = this.loadRoadmap();
    if (!roadmap) return;
    
    // Add to focus symbols
    roadmap.focus_symbols.push({
      id: symbol.id || `SYM_MIAL_${Date.now()}`,
      name: symbol.name,
      domain: symbol.domain || 'mial_generated',
      description: symbol.description || `MIAL-generated symbol: ${symbol.name}`,
      mathematical_notation: symbol.mathematical_notation || symbol.name,
      generated_at: new Date().toISOString(),
      confidence: symbol.confidence || 0.8,
      connections: symbol.connections || [],
      source: 'MIAL'
    });
    
    // Update metadata
    roadmap.metadata.total_symbols = roadmap.focus_symbols.length;
    roadmap.metadata.last_updated = new Date().toISOString();
    
    // Save roadmap
    this.saveRoadmap(roadmap);
    
    console.log('✅ Symbol added to MIA system:', symbol.name);
  }

  /**
   * Add knowledge graph to MIA system
   */
  async addKnowledgeGraph(knowledgeGraph) {
    if (!this.isEnabled) {
      console.log('🕸️ Knowledge graph created (standalone):', knowledgeGraph.name);
      return;
    }
    
    const roadmap = this.loadRoadmap();
    if (!roadmap) return;
    
    // Convert relations to symbolic connections
    for (const relation of knowledgeGraph.relations) {
      roadmap.symbolic_connections.push({
        from: relation.subject?.name || relation.subject,
        to: relation.object?.name || relation.object,
        type: relation.predicate?.name || relation.predicate,
        strength: 0.8,
        source: 'MIAL'
      });
    }
    
    // Update metadata
    roadmap.metadata.last_updated = new Date().toISOString();
    
    // Save roadmap
    this.saveRoadmap(roadmap);
    
    console.log('✅ Knowledge graph added to MIA system:', knowledgeGraph.name);
  }

  /**
   * Add learn function to MIA system
   */
  async addLearnFunction(func) {
    if (!this.isEnabled) {
      console.log('🧠 Learn function created (standalone):', func.name);
      return;
    }
    
    const roadmap = this.loadRoadmap();
    if (!roadmap) return;
    
    // Add as operational recommendation
    roadmap.operational_recommendations.push({
      type: 'learn_function',
      description: `MIAL learn function: ${func.name}`,
      priority: 'high',
      source: 'MIAL',
      function_name: func.name,
      created_at: new Date().toISOString()
    });
    
    // Update metadata
    roadmap.metadata.last_updated = new Date().toISOString();
    
    // Save roadmap
    this.saveRoadmap(roadmap);
    
    console.log('✅ Learn function added to MIA system:', func.name);
  }

  /**
   * Log meta-reasoning activity
   */
  async logMetaReasoning(activity) {
    if (!this.isEnabled) {
      console.log('🧠 Meta-reasoning (standalone):', activity.reasoning);
      return;
    }
    
    const roadmap = this.loadRoadmap();
    if (!roadmap) return;
    
    // Add peer review entry
    roadmap.peer_reviews.push({
      reviewer: 'MIAL-MetaReasoning',
      timestamp: new Date().toISOString(),
      assessment: activity.reasoning,
      confidence: activity.confidence,
      meta_reasoning: true,
      condition: activity.condition,
      result: activity.result
    });
    
    // Update metadata
    roadmap.metadata.last_updated = new Date().toISOString();
    
    // Save roadmap
    this.saveRoadmap(roadmap);
    
    console.log('✅ Meta-reasoning logged to MIA system');
  }

  /**
   * Log learning activity
   */
  async logLearning(activity) {
    if (!this.isEnabled) {
      console.log('📚 Learning activity (standalone):', activity.functionName);
      return;
    }
    
    const roadmap = this.loadRoadmap();
    if (!roadmap) return;
    
    // Add to generation history
    if (!roadmap.generation_history) {
      roadmap.generation_history = [];
    }
    
    roadmap.generation_history.push({
      timestamp: new Date().toISOString(),
      type: 'learning',
      function_name: activity.functionName,
      adaptation_count: activity.adaptationCount,
      args: activity.args,
      result: activity.result,
      source: 'MIAL'
    });
    
    // Update metadata
    roadmap.metadata.last_updated = new Date().toISOString();
    
    // Save roadmap
    this.saveRoadmap(roadmap);
    
    console.log('✅ Learning activity logged to MIA system');
  }

  /**
   * Get MIA system status
   */
  getStatus() {
    if (!this.isEnabled) {
      return {
        enabled: false,
        reason: 'MIA system not found'
      };
    }
    
    const roadmap = this.loadRoadmap();
    if (!roadmap) {
      return {
        enabled: false,
        reason: 'Cannot load MIA roadmap'
      };
    }
    
    return {
      enabled: true,
      roadmap: {
        total_symbols: roadmap.metadata?.total_symbols || 0,
        total_questions: roadmap.metadata?.total_questions || 0,
        peer_reviews: roadmap.peer_reviews?.length || 0,
        last_updated: roadmap.metadata?.last_updated
      }
    };
  }

  /**
   * Query MIA system for symbols
   */
  querySymbols(domain = null, confidence = null) {
    if (!this.isEnabled) return [];
    
    const roadmap = this.loadRoadmap();
    if (!roadmap) return [];
    
    let symbols = roadmap.focus_symbols || [];
    
    if (domain) {
      symbols = symbols.filter(s => s.domain === domain);
    }
    
    if (confidence) {
      symbols = symbols.filter(s => s.confidence >= confidence);
    }
    
    return symbols;
  }

  /**
   * Query MIA system for open questions
   */
  queryQuestions(priority = null) {
    if (!this.isEnabled) return [];
    
    const roadmap = this.loadRoadmap();
    if (!roadmap) return [];
    
    let questions = roadmap.open_questions || [];
    
    if (priority) {
      questions = questions.filter(q => q.priority >= priority);
    }
    
    return questions;
  }

  /**
   * Export MIAL integration data
   */
  exportIntegrationData() {
    const data = {
      exported_at: new Date().toISOString(),
      mia_enabled: this.isEnabled,
      status: this.getStatus(),
      integration_version: '1.0.0'
    };
    
    try {
      fs.writeFileSync(this.mialDataPath, JSON.stringify(data, null, 2));
      console.log('✅ MIAL integration data exported');
      return true;
    } catch (error) {
      console.error('❌ Error exporting integration data:', error.message);
      return false;
    }
  }
}

module.exports = { MIAIntegration };