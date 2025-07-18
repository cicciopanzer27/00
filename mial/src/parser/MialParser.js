/**
 * MIAL Parser - Converts MIAL source code to Abstract Syntax Tree (AST)
 */

const { MialLexer } = require('./MialLexer');
const { MialGrammar } = require('./MialGrammar');

class MialParser {
  constructor() {
    this.lexer = new MialLexer();
    this.grammar = new MialGrammar();
  }

  /**
   * Parse MIAL source code into AST
   */
  parse(source) {
    try {
      // Tokenize
      const tokens = this.lexer.tokenize(source);
      
      // Parse tokens into AST
      const ast = this.grammar.parse(tokens);
      
      // Validate AST
      this.validateAST(ast);
      
      return ast;
      
    } catch (error) {
      throw new MialParseError(error.message, error.location);
    }
  }

  /**
   * Validate AST structure
   */
  validateAST(ast) {
    // Check for required nodes
    if (!ast || !ast.type) {
      throw new Error('Invalid AST: missing type');
    }
    
    // Validate probabilistic constructs
    this.validateProbabilisticNodes(ast);
    
    // Validate meta-reasoning constructs
    this.validateMetaNodes(ast);
    
    // Validate symbolic constructs
    this.validateSymbolicNodes(ast);
  }

  /**
   * Validate probabilistic programming constructs
   */
  validateProbabilisticNodes(node) {
    if (!node) return;
    
    if (node.type === 'ProbabilisticVariable') {
      if (!node.confidence || node.confidence < 0 || node.confidence > 1) {
        throw new Error(`Invalid confidence level: ${node.confidence}`);
      }
    }
    
    if (node.type === 'ConfidentVariable') {
      if (!node.confidenceLevel || node.confidenceLevel < 0 || node.confidenceLevel > 1) {
        throw new Error(`Invalid confidence level: ${node.confidenceLevel}`);
      }
    }
    
    // Recursively validate children
    if (node.children) {
      node.children.forEach(child => this.validateProbabilisticNodes(child));
    }
  }

  /**
   * Validate meta-reasoning constructs
   */
  validateMetaNodes(node) {
    if (!node) return;
    
    if (node.type === 'MetaBlock') {
      if (!node.condition) {
        throw new Error('Meta block requires condition');
      }
    }
    
    if (node.type === 'LearnFunction') {
      if (!node.updateMechanism) {
        throw new Error('Learn function requires update mechanism');
      }
    }
    
    // Recursively validate children
    if (node.children) {
      node.children.forEach(child => this.validateMetaNodes(child));
    }
  }

  /**
   * Validate symbolic computation constructs
   */
  validateSymbolicNodes(node) {
    if (!node) return;
    
    if (node.type === 'SymbolDefinition') {
      if (!node.name || !node.expression) {
        throw new Error('Symbol definition requires name and expression');
      }
    }
    
    if (node.type === 'KnowledgeGraph') {
      if (!node.nodes || !Array.isArray(node.nodes)) {
        throw new Error('Knowledge graph requires nodes array');
      }
    }
    
    // Recursively validate children
    if (node.children) {
      node.children.forEach(child => this.validateSymbolicNodes(child));
    }
  }
}

class MialParseError extends Error {
  constructor(message, location) {
    super(message);
    this.name = 'MialParseError';
    this.location = location;
  }
}

module.exports = { MialParser, MialParseError };