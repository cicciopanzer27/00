#!/usr/bin/env node

/**
 * MIAL - Meta-Ignorance AI Language
 * Main entry point for the MIAL interpreter
 */

const fs = require('fs');
const path = require('path');
const { MialInterpreter } = require('./interpreter/MialInterpreter');
const { MialParser } = require('./parser/MialParser');
const { MIAIntegration } = require('./integration/MIAIntegration');

class MialRuntime {
  constructor() {
    this.parser = new MialParser();
    this.interpreter = new MialInterpreter();
    this.miaIntegration = new MIAIntegration();
    this.version = '1.0.0';
  }

  /**
   * Execute a MIAL file
   */
  async executeFile(filePath) {
    try {
      console.log(`🧠 MIAL v${this.version} - Executing ${filePath}`);
      
      const source = fs.readFileSync(filePath, 'utf8');
      const ast = this.parser.parse(source);
      
      console.log('📊 Parsing successful, executing...');
      
      const result = await this.interpreter.execute(ast, {
        miaIntegration: this.miaIntegration,
        filePath: filePath,
        sourceCode: source
      });
      
      console.log('✅ Execution completed');
      return result;
      
    } catch (error) {
      console.error('❌ MIAL Execution Error:', error.message);
      if (error.location) {
        console.error(`   at line ${error.location.line}, column ${error.location.column}`);
      }
      throw error;
    }
  }

  /**
   * Execute MIAL code from string
   */
  async executeCode(code, context = {}) {
    try {
      const ast = this.parser.parse(code);
      return await this.interpreter.execute(ast, {
        miaIntegration: this.miaIntegration,
        ...context
      });
    } catch (error) {
      console.error('❌ MIAL Code Error:', error.message);
      throw error;
    }
  }

  /**
   * Start REPL mode
   */
  async startRepl() {
    const { MialREPL } = require('./repl/MialREPL');
    const repl = new MialREPL(this);
    await repl.start();
  }

  /**
   * Get language information
   */
  getLanguageInfo() {
    return {
      name: 'MIAL',
      version: this.version,
      description: 'Meta-Ignorance AI Language',
      features: [
        'Probabilistic Programming',
        'Meta-Reasoning',
        'Symbolic Computation',
        'Self-Modifying Code',
        'Knowledge Representation',
        'Uncertainty Handling',
        'MIA Integration'
      ]
    };
  }
}

// CLI interface
if (require.main === module) {
  const runtime = new MialRuntime();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🧠 MIAL - Meta-Ignorance AI Language');
    console.log('Usage:');
    console.log('  mial <file.mial>     - Execute a MIAL file');
    console.log('  mial repl           - Start interactive REPL');
    console.log('  mial info           - Show language information');
    console.log('  mial examples       - Show example programs');
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'repl':
      runtime.startRepl();
      break;
    
    case 'info':
      console.log(JSON.stringify(runtime.getLanguageInfo(), null, 2));
      break;
    
    case 'examples':
      console.log('📚 MIAL Examples:');
      console.log('  - Basic probabilistic reasoning');
      console.log('  - Meta-cognitive architectures');
      console.log('  - Symbolic computation');
      console.log('  - Knowledge graphs');
      console.log('  - Self-modifying code');
      console.log('\nSee /examples directory for complete examples');
      break;
    
    default:
      if (command.endsWith('.mial')) {
        runtime.executeFile(command);
      } else {
        console.error('❌ Unknown command or invalid file extension');
        process.exit(1);
      }
  }
}

module.exports = { MialRuntime };