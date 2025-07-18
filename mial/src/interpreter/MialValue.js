/**
 * MIAL Value - Represents values with uncertainty and confidence
 */

class MialValue {
  constructor(value, metadata = {}) {
    this.value = value;
    this.type = metadata.type || 'certain';
    this.confidence = metadata.confidence || 1.0;
    this.uncertainty = metadata.uncertainty || 0.0;
    this.range = metadata.range || null;
    this.min = metadata.min || null;
    this.max = metadata.max || null;
    this.metadata = metadata;
  }

  /**
   * Get the actual value
   */
  getValue() {
    return this.value;
  }

  /**
   * Get confidence level
   */
  getConfidence() {
    return this.confidence;
  }

  /**
   * Get uncertainty level
   */
  getUncertainty() {
    return this.uncertainty;
  }

  /**
   * Check if value is uncertain
   */
  isUncertain() {
    return this.uncertainty > 0 || this.confidence < 1.0;
  }

  /**
   * Check if value is probabilistic
   */
  isProbabilistic() {
    return this.type === 'probabilistic';
  }

  /**
   * Check if value is in range
   */
  isInRange() {
    return this.type === 'uncertain_range' && this.range !== null;
  }

  /**
   * Combine with another MialValue
   */
  combine(other, operation) {
    if (!(other instanceof MialValue)) {
      other = new MialValue(other);
    }

    const result = operation(this.value, other.value);
    const combinedUncertainty = Math.min(this.uncertainty + other.uncertainty, 1.0);
    const combinedConfidence = Math.max(this.confidence * other.confidence, 0.0);

    return new MialValue(result, {
      type: 'combined',
      confidence: combinedConfidence,
      uncertainty: combinedUncertainty,
      sourceTypes: [this.type, other.type]
    });
  }

  /**
   * Update confidence based on new evidence
   */
  updateConfidence(evidence) {
    const evidenceWeight = evidence.weight || 0.1;
    const evidenceConfidence = evidence.confidence || 0.5;
    
    // Bayesian update
    const newConfidence = (this.confidence * (1 - evidenceWeight)) + 
                         (evidenceConfidence * evidenceWeight);
    
    this.confidence = Math.min(Math.max(newConfidence, 0.0), 1.0);
    this.uncertainty = 1.0 - this.confidence;
    
    return this;
  }

  /**
   * Get value with uncertainty bounds
   */
  getWithBounds() {
    if (this.isInRange()) {
      return {
        value: this.value,
        min: this.min,
        max: this.max,
        confidence: this.confidence
      };
    }
    
    return {
      value: this.value,
      confidence: this.confidence,
      uncertainty: this.uncertainty
    };
  }

  /**
   * Convert to string representation
   */
  toString() {
    if (this.isInRange()) {
      return `${this.value} ± ${this.range} (confidence: ${this.confidence.toFixed(2)})`;
    }
    
    if (this.isUncertain()) {
      return `${this.value} (confidence: ${this.confidence.toFixed(2)}, uncertainty: ${this.uncertainty.toFixed(2)})`;
    }
    
    return this.value.toString();
  }

  /**
   * Convert to JSON representation
   */
  toJSON() {
    return {
      value: this.value,
      type: this.type,
      confidence: this.confidence,
      uncertainty: this.uncertainty,
      range: this.range,
      min: this.min,
      max: this.max,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new MialValue(json.value, {
      type: json.type,
      confidence: json.confidence,
      uncertainty: json.uncertainty,
      range: json.range,
      min: json.min,
      max: json.max,
      ...json.metadata
    });
  }

  /**
   * Create probabilistic value
   */
  static probabilistic(value, confidence) {
    return new MialValue(value, {
      type: 'probabilistic',
      confidence: confidence,
      uncertainty: 1 - confidence
    });
  }

  /**
   * Create confident value
   */
  static confident(value, confidenceLevel) {
    return new MialValue(value, {
      type: 'confident',
      confidence: confidenceLevel,
      uncertainty: 1 - confidenceLevel
    });
  }

  /**
   * Create uncertain range value
   */
  static uncertainRange(value, range) {
    return new MialValue(value, {
      type: 'uncertain_range',
      confidence: 0.8,
      uncertainty: 0.2,
      range: range,
      min: value - range,
      max: value + range
    });
  }
}

module.exports = { MialValue };