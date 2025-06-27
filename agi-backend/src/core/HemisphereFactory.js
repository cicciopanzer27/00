/**
 * HemisphereFactory - Auto-generazione intelligente di emisferi
 * Crea nuovi domini di conoscenza basandosi sui gap identificati
 */

const Hemisphere = require('./Hemisphere');
const natural = require('natural');

class HemisphereFactory {
  constructor(config = {}) {
    this.config = {
      autoGenerationThreshold: config.autoGenerationThreshold || 0.3,
      maxHemispheres: config.maxHemispheres || 50,
      confidenceThreshold: config.confidenceThreshold || 0.5,
      domainSimilarityThreshold: config.domainSimilarityThreshold || 0.7,
      ...config
    };

    // Analizzatore di testo per identificare domini
    this.tokenizer = new natural.WordTokenizer();
    
    // Domini predefiniti e loro caratteristiche
    this.domainTemplates = {
      'physics': {
        keywords: ['physics', 'quantum', 'mechanics', 'energy', 'force', 'motion', 'relativity'],
        patterns: [/physics|quantum|mechanics|energy|force|motion|relativity/i],
        specialization: 'science',
        confidence: 0.7
      },
      'biology': {
        keywords: ['biology', 'cell', 'organism', 'dna', 'evolution', 'genetics', 'molecular'],
        patterns: [/biology|cell|organism|dna|evolution|genetics|molecular/i],
        specialization: 'science',
        confidence: 0.7
      },
      'chemistry': {
        keywords: ['chemistry', 'molecule', 'atom', 'reaction', 'compound', 'element'],
        patterns: [/chemistry|molecule|atom|reaction|compound|element/i],
        specialization: 'science',
        confidence: 0.7
      },
      'history': {
        keywords: ['history', 'historical', 'ancient', 'medieval', 'war', 'civilization'],
        patterns: [/history|historical|ancient|medieval|war|civilization/i],
        specialization: 'humanities',
        confidence: 0.6
      },
      'psychology': {
        keywords: ['psychology', 'behavior', 'mind', 'cognitive', 'emotion', 'mental'],
        patterns: [/psychology|behavior|mind|cognitive|emotion|mental/i],
        specialization: 'social_science',
        confidence: 0.6
      },
      'economics': {
        keywords: ['economics', 'market', 'finance', 'money', 'trade', 'business'],
        patterns: [/economics|market|finance|money|trade|business/i],
        specialization: 'social_science',
        confidence: 0.6
      },
      'art': {
        keywords: ['art', 'painting', 'sculpture', 'design', 'creative', 'aesthetic'],
        patterns: [/art|painting|sculpture|design|creative|aesthetic/i],
        specialization: 'creative',
        confidence: 0.5
      },
      'music': {
        keywords: ['music', 'song', 'melody', 'rhythm', 'instrument', 'composition'],
        patterns: [/music|song|melody|rhythm|instrument|composition/i],
        specialization: 'creative',
        confidence: 0.5
      },
      'medicine': {
        keywords: ['medicine', 'medical', 'health', 'disease', 'treatment', 'diagnosis'],
        patterns: [/medicine|medical|health|disease|treatment|diagnosis/i],
        specialization: 'applied_science',
        confidence: 0.8
      },
      'engineering': {
        keywords: ['engineering', 'design', 'build', 'system', 'technical', 'mechanical'],
        patterns: [/engineering|design|build|system|technical|mechanical/i],
        specialization: 'applied_science',
        confidence: 0.7
      }
    };

    // Statistiche di generazione
    this.generationStats = {
      totalGenerated: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      domainDistribution: {},
      averageConfidence: 0
    };
  }

  /**
   * Analizza una query per identificare potenziali nuovi domini
   */
  analyzeQueryForDomains(query, existingHemispheres = new Map()) {
    const tokens = this.tokenizer.tokenize(query.toLowerCase());
    const stemmedTokens = tokens.map(token => natural.PorterStemmer.stem(token));
    
    const analysis = {
      query,
      tokens: stemmedTokens,
      potentialDomains: [],
      confidence: 0,
      shouldGenerate: false,
      existingMatches: []
    };

    // Verifica domini esistenti
    for (const [domain, hemisphere] of existingHemispheres) {
      const hemisphereAnalysis = hemisphere.analyzeQuery(query);
      if (hemisphereAnalysis.confidence > 0.1) {
        analysis.existingMatches.push({
          domain,
          confidence: hemisphereAnalysis.confidence,
          hemisphere
        });
      }
    }

    // Se nessun emisfero esistente ha confidenza sufficiente, cerca nuovi domini
    const maxExistingConfidence = analysis.existingMatches.length > 0 ? 
      Math.max(...analysis.existingMatches.map(m => m.confidence)) : 0;

    if (maxExistingConfidence < this.config.autoGenerationThreshold) {
      // Analizza per domini potenziali
      for (const [domainName, template] of Object.entries(this.domainTemplates)) {
        if (!existingHemispheres.has(domainName)) {
          const domainConfidence = this.calculateDomainConfidence(tokens, template);
          
          if (domainConfidence > this.config.confidenceThreshold) {
            analysis.potentialDomains.push({
              domain: domainName,
              confidence: domainConfidence,
              template,
              reason: `Identificati ${this.countKeywordMatches(tokens, template.keywords)} keyword corrispondenti`
            });
          }
        }
      }

      // Ordina per confidenza
      analysis.potentialDomains.sort((a, b) => b.confidence - a.confidence);
      
      // Determina se generare
      analysis.shouldGenerate = analysis.potentialDomains.length > 0 && 
        analysis.potentialDomains[0].confidence > this.config.confidenceThreshold;
      
      analysis.confidence = analysis.potentialDomains.length > 0 ? 
        analysis.potentialDomains[0].confidence : 0;
    }

    return analysis;
  }

  /**
   * Calcola la confidenza per un dominio specifico
   */
  calculateDomainConfidence(tokens, template) {
    let confidence = 0;
    
    // Verifica keyword matches
    const keywordMatches = this.countKeywordMatches(tokens, template.keywords);
    confidence += (keywordMatches / template.keywords.length) * 0.6;
    
    // Verifica pattern matches
    const query = tokens.join(' ');
    for (const pattern of template.patterns) {
      if (pattern.test(query)) {
        confidence += 0.3;
        break;
      }
    }

    // Bonus per specializzazione
    if (template.specialization === 'science') {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Conta le corrispondenze di keyword
   */
  countKeywordMatches(tokens, keywords) {
    let matches = 0;
    const stemmedKeywords = keywords.map(k => natural.PorterStemmer.stem(k.toLowerCase()));
    
    for (const token of tokens) {
      if (stemmedKeywords.includes(token)) {
        matches++;
      }
    }
    
    return matches;
  }

  /**
   * Genera un nuovo emisfero basato sull'analisi
   */
  async generateHemisphere(domainAnalysis, existingHemispheres = new Map()) {
    if (!domainAnalysis.shouldGenerate || domainAnalysis.potentialDomains.length === 0) {
      return {
        success: false,
        reason: 'Nessun dominio candidato per la generazione',
        analysis: domainAnalysis
      };
    }

    // Verifica limiti
    if (existingHemispheres.size >= this.config.maxHemispheres) {
      return {
        success: false,
        reason: `Raggiunto limite massimo di emisferi (${this.config.maxHemispheres})`,
        analysis: domainAnalysis
      };
    }

    const bestDomain = domainAnalysis.potentialDomains[0];
    
    try {
      // Crea configurazione per il nuovo emisfero
      const hemisphereConfig = {
        autoGenerated: true,
        parentDomain: this.findParentDomain(bestDomain.domain, existingHemispheres),
        specialization: bestDomain.template.specialization,
        generationReason: bestDomain.reason,
        sourceQuery: domainAnalysis.query,
        confidence: bestDomain.confidence,
        template: bestDomain.template
      };

      // Crea il nuovo emisfero
      const newHemisphere = this.createSpecializedHemisphere(
        bestDomain.domain, 
        bestDomain.template, 
        hemisphereConfig
      );

      // Aggiorna statistiche
      this.updateGenerationStats(bestDomain.domain, bestDomain.confidence, true);

      return {
        success: true,
        hemisphere: newHemisphere,
        domain: bestDomain.domain,
        confidence: bestDomain.confidence,
        analysis: domainAnalysis,
        metadata: {
          generatedAt: new Date(),
          sourceQuery: domainAnalysis.query,
          template: bestDomain.template.specialization
        }
      };

    } catch (error) {
      this.updateGenerationStats(bestDomain.domain, bestDomain.confidence, false);
      
      return {
        success: false,
        error: error.message,
        domain: bestDomain.domain,
        analysis: domainAnalysis
      };
    }
  }

  /**
   * Crea un emisfero specializzato basato su template
   */
  createSpecializedHemisphere(domain, template, config) {
    const hemisphere = new Hemisphere(domain, config);
    
    // Personalizza l'emisfero con il template
    hemisphere.patterns = [...hemisphere.patterns, ...template.patterns];
    
    // Aggiungi conoscenze specifiche del dominio
    hemisphere.knowledgeBase.set(`${domain}_keywords`, {
      type: 'keywords',
      confidence: template.confidence,
      patterns: template.keywords
    });

    hemisphere.knowledgeBase.set(`${domain}_specialization`, {
      type: 'specialization',
      confidence: 0.8,
      patterns: [template.specialization],
      metadata: {
        autoGenerated: true,
        template: template
      }
    });

    // Configura parametri specifici
    hemisphere.confidence = template.confidence;
    hemisphere.metadata.template = template;
    hemisphere.metadata.autoGenerated = true;

    return hemisphere;
  }

  /**
   * Trova il dominio padre più appropriato
   */
  findParentDomain(newDomain, existingHemispheres) {
    const template = this.domainTemplates[newDomain];
    if (!template) return null;

    // Cerca emisferi con specializzazione simile
    for (const [domain, hemisphere] of existingHemispheres) {
      if (hemisphere.metadata.specialization === template.specialization) {
        return domain;
      }
    }

    // Cerca emisferi con keyword simili
    for (const [domain, hemisphere] of existingHemispheres) {
      const similarity = this.calculateDomainSimilarity(template, hemisphere);
      if (similarity > this.config.domainSimilarityThreshold) {
        return domain;
      }
    }

    return null;
  }

  /**
   * Calcola similarità tra domini
   */
  calculateDomainSimilarity(template, hemisphere) {
    if (!hemisphere.metadata.template) return 0;

    const templateKeywords = new Set(template.keywords);
    const hemisphereKeywords = new Set(hemisphere.metadata.template.keywords || []);
    
    const intersection = new Set([...templateKeywords].filter(k => hemisphereKeywords.has(k)));
    const union = new Set([...templateKeywords, ...hemisphereKeywords]);
    
    return intersection.size / union.size;
  }

  /**
   * Aggiorna statistiche di generazione
   */
  updateGenerationStats(domain, confidence, success) {
    this.generationStats.totalGenerated++;
    
    if (success) {
      this.generationStats.successfulGenerations++;
      
      if (!this.generationStats.domainDistribution[domain]) {
        this.generationStats.domainDistribution[domain] = 0;
      }
      this.generationStats.domainDistribution[domain]++;
      
      // Aggiorna confidenza media
      const total = this.generationStats.successfulGenerations;
      this.generationStats.averageConfidence = 
        ((this.generationStats.averageConfidence * (total - 1)) + confidence) / total;
    } else {
      this.generationStats.failedGenerations++;
    }
  }

  /**
   * Suggerisce domini per auto-generazione
   */
  suggestDomainsForGeneration(existingHemispheres = new Map()) {
    const suggestions = [];
    
    for (const [domainName, template] of Object.entries(this.domainTemplates)) {
      if (!existingHemispheres.has(domainName)) {
        suggestions.push({
          domain: domainName,
          template,
          priority: this.calculateDomainPriority(template, existingHemispheres),
          reason: `Dominio ${template.specialization} non presente`
        });
      }
    }

    // Ordina per priorità
    suggestions.sort((a, b) => b.priority - a.priority);
    
    return suggestions.slice(0, 5); // Top 5 suggerimenti
  }

  /**
   * Calcola priorità di un dominio
   */
  calculateDomainPriority(template, existingHemispheres) {
    let priority = template.confidence;
    
    // Bonus per specializzazioni mancanti
    const hasSpecialization = Array.from(existingHemispheres.values())
      .some(h => h.metadata.specialization === template.specialization);
    
    if (!hasSpecialization) {
      priority += 0.3;
    }

    // Bonus per domini scientifici
    if (template.specialization === 'science') {
      priority += 0.2;
    }

    return Math.min(priority, 1.0);
  }

  /**
   * Ottieni statistiche di generazione
   */
  getGenerationStats() {
    return {
      ...this.generationStats,
      successRate: this.generationStats.totalGenerated > 0 ? 
        (this.generationStats.successfulGenerations / this.generationStats.totalGenerated) * 100 : 0,
      availableTemplates: Object.keys(this.domainTemplates).length,
      config: this.config
    };
  }

  /**
   * Reset delle statistiche
   */
  resetStats() {
    this.generationStats = {
      totalGenerated: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      domainDistribution: {},
      averageConfidence: 0
    };
  }

  /**
   * Aggiungi template personalizzato
   */
  addDomainTemplate(domain, template) {
    this.domainTemplates[domain] = {
      keywords: template.keywords || [],
      patterns: template.patterns || [],
      specialization: template.specialization || 'custom',
      confidence: template.confidence || 0.5,
      ...template
    };
  }

  /**
   * Rimuovi template
   */
  removeDomainTemplate(domain) {
    delete this.domainTemplates[domain];
  }

  /**
   * Ottieni tutti i template disponibili
   */
  getAvailableTemplates() {
    return Object.keys(this.domainTemplates);
  }
}

module.exports = HemisphereFactory;

