/**
 * MIAL Environment - Manages variable scoping and binding
 */

class MialEnvironment {
  constructor(parent = null) {
    this.parent = parent;
    this.bindings = new Map();
  }

  /**
   * Define a new variable in this environment
   */
  define(name, value) {
    this.bindings.set(name, value);
  }

  /**
   * Get a variable value
   */
  get(name) {
    if (this.bindings.has(name)) {
      return this.bindings.get(name);
    }
    
    if (this.parent) {
      return this.parent.get(name);
    }
    
    throw new Error(`Undefined variable: ${name}`);
  }

  /**
   * Set a variable value (must exist)
   */
  set(name, value) {
    if (this.bindings.has(name)) {
      this.bindings.set(name, value);
      return;
    }
    
    if (this.parent) {
      this.parent.set(name, value);
      return;
    }
    
    throw new Error(`Undefined variable: ${name}`);
  }

  /**
   * Check if variable exists
   */
  has(name) {
    return this.bindings.has(name) || (this.parent && this.parent.has(name));
  }

  /**
   * Get all variable names in this environment
   */
  getNames() {
    const names = Array.from(this.bindings.keys());
    if (this.parent) {
      names.push(...this.parent.getNames());
    }
    return [...new Set(names)];
  }

  /**
   * Get environment statistics
   */
  getStats() {
    return {
      localVariables: this.bindings.size,
      totalVariables: this.getNames().length,
      depth: this.getDepth()
    };
  }

  /**
   * Get environment depth
   */
  getDepth() {
    let depth = 0;
    let current = this.parent;
    while (current) {
      depth++;
      current = current.parent;
    }
    return depth;
  }
}

module.exports = { MialEnvironment };