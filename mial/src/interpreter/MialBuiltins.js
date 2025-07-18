/**
 * MIAL Built-ins - Built-in functions and objects for MIAL
 */

const { MialValue } = require('./MialValue');

class MialBuiltins {
  constructor() {
    this.setupBuiltins();
  }

  setupBuiltins() {
    // Built-in functions
    this.confidence = this.createConfidenceFunction();
    this.uncertainty = this.createUncertaintyFunction();
    this.validate = this.createValidateFunction();
    this.integrate = this.createIntegrateFunction();
    this.reasonAbout = this.createReasonAboutFunction();
    this.know = this.createKnowFunction();
    this.conclude = this.createConcludeFunction();
    this.seek = this.createSeekFunction();
    this.seekMoreData = this.createSeekMoreDataFunction();
    
    // Built-in objects
    this.self = this.createSelfObject();
    this.console = this.createConsoleObject();
    this.Math = this.createMathObject();
  }

  /**
   * confidence(value) - Get confidence level of a value
   */
  createConfidenceFunction() {
    return (value) => {
      if (value instanceof MialValue) {
        return value.getConfidence();
      }
      
      if (typeof value === 'object' && value.confidence !== undefined) {
        return value.confidence;
      }
      
      return 1.0; // Default confidence for certain values
    };
  }

  /**
   * uncertainty(value) - Get uncertainty level of a value
   */
  createUncertaintyFunction() {
    return (value) => {
      if (value instanceof MialValue) {
        return value.getUncertainty();
      }
      
      if (typeof value === 'object' && value.uncertainty !== undefined) {
        return value.uncertainty;
      }
      
      return 0.0; // Default uncertainty for certain values
    };
  }

  /**
   * validate(value) - Validate a value or hypothesis
   */
  createValidateFunction() {
    return async (value) => {
      console.log(`🔍 Validating: ${value}`);
      
      // Simple validation logic
      if (value instanceof MialValue) {
        const isValid = value.getConfidence() > 0.5;
        console.log(`   Confidence: ${value.getConfidence()}`);
        console.log(`   Valid: ${isValid}`);
        return isValid;
      }
      
      // Basic validation for different types
      if (typeof value === 'number') {
        return !isNaN(value) && isFinite(value);
      }
      
      if (typeof value === 'string') {
        return value.length > 0;
      }
      
      if (typeof value === 'boolean') {
        return true;
      }
      
      return value !== null && value !== undefined;
    };
  }

  /**
   * integrate(value) - Integrate new knowledge
   */
  createIntegrateFunction() {
    return async (value) => {
      console.log(`📚 Integrating knowledge: ${value}`);
      
      // Knowledge integration simulation
      if (value instanceof MialValue) {
        // Update confidence based on integration
        value.updateConfidence({ confidence: 0.8, weight: 0.2 });
        console.log(`   Updated confidence: ${value.getConfidence()}`);
        return value;
      }
      
      // Convert to MialValue for integration
      const integrated = new MialValue(value, {
        type: 'integrated',
        confidence: 0.8,
        uncertainty: 0.2
      });
      
      console.log(`   Integrated with confidence: ${integrated.getConfidence()}`);
      return integrated;
    };
  }

  /**
   * reason_about(subject) - Perform meta-reasoning
   */
  createReasonAboutFunction() {
    return async (subject) => {
      console.log(`🧠 Reasoning about: ${subject}`);
      
      // Meta-reasoning simulation
      const reasoning = {
        subject: subject,
        confidence: Math.random() * 0.5 + 0.5, // Random confidence 0.5-1.0
        reasoning_steps: [
          'Analyzing subject properties',
          'Checking existing knowledge',
          'Evaluating uncertainty',
          'Generating conclusions'
        ],
        conclusion: `Analysis of ${subject} completed`,
        meta_confidence: 0.75
      };
      
      console.log(`   Reasoning confidence: ${reasoning.confidence}`);
      console.log(`   Conclusion: ${reasoning.conclusion}`);
      
      return reasoning;
    };
  }

  /**
   * know(subject) - Check if we know about a subject
   */
  createKnowFunction() {
    return (subject) => {
      console.log(`❓ Checking knowledge about: ${subject}`);
      
      // Knowledge checking simulation
      const knowledgeLevel = Math.random(); // Random knowledge level
      const hasKnowledge = knowledgeLevel > 0.3;
      
      console.log(`   Knowledge level: ${knowledgeLevel.toFixed(2)}`);
      console.log(`   Has knowledge: ${hasKnowledge}`);
      
      return new MialValue(hasKnowledge, {
        type: 'knowledge_check',
        confidence: knowledgeLevel,
        uncertainty: 1 - knowledgeLevel,
        subject: subject
      });
    };
  }

  /**
   * conclude(statement) - Draw a conclusion
   */
  createConcludeFunction() {
    return (statement) => {
      console.log(`✅ Concluding: ${statement}`);
      
      return new MialValue(statement, {
        type: 'conclusion',
        confidence: 0.9,
        uncertainty: 0.1,
        concluded_at: new Date().toISOString()
      });
    };
  }

  /**
   * seek(information) - Seek specific information
   */
  createSeekFunction() {
    return async (information) => {
      console.log(`🔍 Seeking: ${information}`);
      
      // Information seeking simulation
      const found = Math.random() > 0.3; // 70% chance of finding
      const quality = Math.random() * 0.5 + 0.5; // Quality 0.5-1.0
      
      if (found) {
        console.log(`   Found information with quality: ${quality.toFixed(2)}`);
        return new MialValue(`Information about ${information}`, {
          type: 'sought_information',
          confidence: quality,
          uncertainty: 1 - quality,
          found: true
        });
      } else {
        console.log(`   Information not found`);
        return new MialValue(null, {
          type: 'sought_information',
          confidence: 0.1,
          uncertainty: 0.9,
          found: false
        });
      }
    };
  }

  /**
   * seek_more_data(source) - Seek more data from a source
   */
  createSeekMoreDataFunction() {
    return async (source) => {
      console.log(`📡 Seeking more data from: ${source}`);
      
      // Data seeking simulation
      const dataPoints = Math.floor(Math.random() * 10) + 1;
      const reliability = Math.random() * 0.3 + 0.7; // Reliability 0.7-1.0
      
      console.log(`   Retrieved ${dataPoints} data points`);
      console.log(`   Source reliability: ${reliability.toFixed(2)}`);
      
      return new MialValue(dataPoints, {
        type: 'additional_data',
        confidence: reliability,
        uncertainty: 1 - reliability,
        source: source,
        data_points: dataPoints
      });
    };
  }

  /**
   * self object - Represents the AI system itself
   */
  createSelfObject() {
    return {
      confidence: 0.8,
      uncertainty: 0.2,
      version: '1.0.0',
      capabilities: ['reasoning', 'learning', 'meta-cognition'],
      
      updateConfidence: function(delta) {
        this.confidence = Math.min(Math.max(this.confidence + delta, 0.0), 1.0);
        this.uncertainty = 1.0 - this.confidence;
        console.log(`🤖 Self-confidence updated: ${this.confidence.toFixed(2)}`);
        return this.confidence;
      },
      
      reflect: function() {
        console.log('🤔 Self-reflection:');
        console.log(`   Confidence: ${this.confidence}`);
        console.log(`   Uncertainty: ${this.uncertainty}`);
        console.log(`   Capabilities: ${this.capabilities.join(', ')}`);
        
        return {
          confidence: this.confidence,
          uncertainty: this.uncertainty,
          capabilities: this.capabilities,
          reflection_time: new Date().toISOString()
        };
      }
    };
  }

  /**
   * console object - Console operations
   */
  createConsoleObject() {
    return {
      log: (...args) => {
        console.log('📄', ...args);
      },
      
      error: (...args) => {
        console.error('❌', ...args);
      },
      
      warn: (...args) => {
        console.warn('⚠️', ...args);
      },
      
      info: (...args) => {
        console.info('ℹ️', ...args);
      },
      
      debug: (...args) => {
        console.debug('🐛', ...args);
      }
    };
  }

  /**
   * Math object - Enhanced math operations with uncertainty
   */
  createMathObject() {
    return {
      ...Math,
      
      uncertainAdd: (a, b) => {
        const aVal = a instanceof MialValue ? a.getValue() : a;
        const bVal = b instanceof MialValue ? b.getValue() : b;
        const result = aVal + bVal;
        
        const aUncertainty = a instanceof MialValue ? a.getUncertainty() : 0;
        const bUncertainty = b instanceof MialValue ? b.getUncertainty() : 0;
        const resultUncertainty = Math.min(aUncertainty + bUncertainty, 1.0);
        
        return new MialValue(result, {
          type: 'uncertain_math',
          confidence: 1 - resultUncertainty,
          uncertainty: resultUncertainty
        });
      },
      
      uncertainMultiply: (a, b) => {
        const aVal = a instanceof MialValue ? a.getValue() : a;
        const bVal = b instanceof MialValue ? b.getValue() : b;
        const result = aVal * bVal;
        
        const aUncertainty = a instanceof MialValue ? a.getUncertainty() : 0;
        const bUncertainty = b instanceof MialValue ? b.getUncertainty() : 0;
        const resultUncertainty = Math.min(aUncertainty + bUncertainty, 1.0);
        
        return new MialValue(result, {
          type: 'uncertain_math',
          confidence: 1 - resultUncertainty,
          uncertainty: resultUncertainty
        });
      },
      
      probabilisticRandom: (confidence = 0.5) => {
        const value = Math.random();
        return new MialValue(value, {
          type: 'probabilistic_random',
          confidence: confidence,
          uncertainty: 1 - confidence
        });
      }
    };
  }
}

module.exports = { MialBuiltins };