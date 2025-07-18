/**
 * MIAL REPL - Interactive Read-Eval-Print Loop for MIAL
 */

const readline = require('readline');
const chalk = require('chalk');
const { MialValue } = require('../interpreter/MialValue');

class MialREPL {
  constructor(runtime) {
    this.runtime = runtime;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('mial> ')
    });
    
    this.history = [];
    this.sessionStartTime = new Date();
    this.commandCount = 0;
  }

  /**
   * Start REPL session
   */
  async start() {
    console.log(chalk.blue.bold('🧠 MIAL REPL - Meta-Ignorance AI Language'));
    console.log(chalk.gray('Type .help for commands, .exit to quit'));
    console.log(chalk.gray(`Session started at ${this.sessionStartTime.toLocaleTimeString()}`));
    
    // Show MIA integration status
    const miaStatus = this.runtime.miaIntegration.getStatus();
    if (miaStatus.enabled) {
      console.log(chalk.green('✅ MIA system integration active'));
    } else {
      console.log(chalk.yellow('⚠️ Running in standalone mode'));
    }
    
    console.log();
    
    this.rl.prompt();
    
    this.rl.on('line', async (input) => {
      await this.handleInput(input.trim());
    });
    
    this.rl.on('close', () => {
      this.handleExit();
    });
  }

  /**
   * Handle user input
   */
  async handleInput(input) {
    if (!input) {
      this.rl.prompt();
      return;
    }
    
    // Handle REPL commands
    if (input.startsWith('.')) {
      this.handleCommand(input);
      return;
    }
    
    this.commandCount++;
    
    try {
      // Execute MIAL code
      const result = await this.runtime.executeCode(input);
      
      // Store in history
      this.history.push({
        input: input,
        result: result,
        timestamp: new Date(),
        command_number: this.commandCount
      });
      
      // Display result
      this.displayResult(result);
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      if (error.location) {
        console.error(chalk.red(`   at line ${error.location.line}, column ${error.location.column}`));
      }
    }
    
    this.rl.prompt();
  }

  /**
   * Handle REPL commands
   */
  handleCommand(command) {
    const [cmd, ...args] = command.split(' ');
    
    switch (cmd) {
      case '.help':
        this.showHelp();
        break;
      
      case '.exit':
      case '.quit':
        this.handleExit();
        break;
      
      case '.history':
        this.showHistory();
        break;
      
      case '.clear':
        this.clearHistory();
        break;
      
      case '.env':
        this.showEnvironment();
        break;
      
      case '.mia':
        this.showMIAStatus();
        break;
      
      case '.symbols':
        this.showSymbols();
        break;
      
      case '.questions':
        this.showQuestions();
        break;
      
      case '.export':
        this.exportSession();
        break;
      
      case '.load':
        this.loadExample(args[0]);
        break;
      
      case '.stats':
        this.showStats();
        break;
      
      default:
        console.log(chalk.red(`Unknown command: ${cmd}`));
        console.log(chalk.gray('Type .help for available commands'));
    }
    
    this.rl.prompt();
  }

  /**
   * Display execution result
   */
  displayResult(result) {
    if (result === null || result === undefined) {
      console.log(chalk.gray('null'));
      return;
    }
    
    if (result instanceof MialValue) {
      console.log(chalk.green(`=> ${result.toString()}`));
      
      // Show additional info for uncertain values
      if (result.isUncertain()) {
        console.log(chalk.yellow(`   Type: ${result.type}`));
        if (result.isInRange()) {
          console.log(chalk.yellow(`   Range: [${result.min}, ${result.max}]`));
        }
      }
      return;
    }
    
    if (typeof result === 'object') {
      console.log(chalk.green(`=> ${JSON.stringify(result, null, 2)}`));
      return;
    }
    
    console.log(chalk.green(`=> ${result}`));
  }

  /**
   * Show help
   */
  showHelp() {
    console.log(chalk.blue.bold('\n📚 MIAL REPL Commands:\n'));
    
    console.log(chalk.cyan('General Commands:'));
    console.log('  .help           - Show this help message');
    console.log('  .exit, .quit    - Exit REPL');
    console.log('  .clear          - Clear session history');
    console.log('  .history        - Show command history');
    console.log('  .env            - Show environment variables');
    console.log('  .stats          - Show session statistics');
    console.log('  .export         - Export session data');
    
    console.log(chalk.cyan('\nMIA Integration:'));
    console.log('  .mia            - Show MIA system status');
    console.log('  .symbols        - Show available symbols');
    console.log('  .questions      - Show open questions');
    
    console.log(chalk.cyan('\nExamples:'));
    console.log('  .load basic     - Load basic example');
    console.log('  .load prob      - Load probabilistic example');
    console.log('  .load meta      - Load meta-reasoning example');
    
    console.log(chalk.cyan('\nSample MIAL Code:'));
    console.log(chalk.gray('  let temp: prob(0.8) = 25.5 ± 2.0;'));
    console.log(chalk.gray('  symbol E = m * c^2;'));
    console.log(chalk.gray('  meta know(temp) ? { conclude("Temperature known"); }'));
    console.log(chalk.gray('  learn adapt(data) { integrate(data); }'));
    
    console.log();
  }

  /**
   * Show command history
   */
  showHistory() {
    console.log(chalk.blue.bold('\n📜 Command History:\n'));
    
    if (this.history.length === 0) {
      console.log(chalk.gray('No commands in history'));
      return;
    }
    
    this.history.forEach((entry, index) => {
      console.log(chalk.yellow(`[${entry.command_number}] ${entry.input}`));
      console.log(chalk.gray(`    => ${entry.result}`));
      console.log(chalk.gray(`    (${entry.timestamp.toLocaleTimeString()})`));
    });
    
    console.log();
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
    console.log(chalk.green('✅ History cleared'));
  }

  /**
   * Show environment
   */
  showEnvironment() {
    console.log(chalk.blue.bold('\n🌍 Environment:\n'));
    
    const env = this.runtime.interpreter.globalEnv;
    const names = env.getNames();
    
    names.forEach(name => {
      try {
        const value = env.get(name);
        const type = typeof value;
        console.log(chalk.cyan(`${name}: ${type} = ${value}`));
      } catch (error) {
        console.log(chalk.red(`${name}: <error>`));
      }
    });
    
    console.log();
  }

  /**
   * Show MIA status
   */
  showMIAStatus() {
    console.log(chalk.blue.bold('\n🧠 MIA System Status:\n'));
    
    const status = this.runtime.miaIntegration.getStatus();
    
    if (status.enabled) {
      console.log(chalk.green('✅ MIA Integration: Active'));
      console.log(chalk.cyan(`   Total Symbols: ${status.roadmap.total_symbols}`));
      console.log(chalk.cyan(`   Total Questions: ${status.roadmap.total_questions}`));
      console.log(chalk.cyan(`   Peer Reviews: ${status.roadmap.peer_reviews}`));
      console.log(chalk.gray(`   Last Updated: ${status.roadmap.last_updated}`));
    } else {
      console.log(chalk.yellow('⚠️ MIA Integration: Disabled'));
      console.log(chalk.gray(`   Reason: ${status.reason}`));
    }
    
    console.log();
  }

  /**
   * Show symbols
   */
  showSymbols() {
    console.log(chalk.blue.bold('\n🔸 Available Symbols:\n'));
    
    const symbols = this.runtime.miaIntegration.querySymbols();
    
    if (symbols.length === 0) {
      console.log(chalk.gray('No symbols available'));
      return;
    }
    
    symbols.forEach(symbol => {
      console.log(chalk.cyan(`${symbol.name} (${symbol.domain})`));
      console.log(chalk.gray(`   ${symbol.description}`));
      console.log(chalk.gray(`   Notation: ${symbol.mathematical_notation}`));
      console.log(chalk.gray(`   Confidence: ${symbol.confidence}`));
      console.log();
    });
  }

  /**
   * Show questions
   */
  showQuestions() {
    console.log(chalk.blue.bold('\n❓ Open Questions:\n'));
    
    const questions = this.runtime.miaIntegration.queryQuestions();
    
    if (questions.length === 0) {
      console.log(chalk.gray('No open questions'));
      return;
    }
    
    questions.forEach(question => {
      console.log(chalk.cyan(`[Priority ${question.priority}] ${question.text}`));
      console.log(chalk.gray(`   Status: ${question.status}`));
      console.log(chalk.gray(`   Generated: ${question.generated_at}`));
      console.log();
    });
  }

  /**
   * Export session data
   */
  exportSession() {
    const sessionData = {
      start_time: this.sessionStartTime.toISOString(),
      end_time: new Date().toISOString(),
      command_count: this.commandCount,
      history: this.history,
      mia_status: this.runtime.miaIntegration.getStatus(),
      version: '1.0.0'
    };
    
    const filename = `mial_session_${Date.now()}.json`;
    
    try {
      require('fs').writeFileSync(filename, JSON.stringify(sessionData, null, 2));
      console.log(chalk.green(`✅ Session exported to ${filename}`));
    } catch (error) {
      console.error(chalk.red('❌ Export failed:'), error.message);
    }
  }

  /**
   * Load example
   */
  loadExample(example) {
    const examples = {
      basic: `
// Basic MIAL example
let x = 42;
let y: prob(0.8) = 3.14;
console.log("Basic values:", x, y);
`,
      prob: `
// Probabilistic programming example
let temperature: prob(0.7) = 23.5 ± 2.1;
let humidity: confident(0.9) = 65.0;

if (confidence(temperature) > 0.5) {
  conclude("Temperature measurement is reliable");
}
`,
      meta: `
// Meta-reasoning example
let data = "sensor_reading";

meta know(data) ? {
  if (confidence(data) > 0.8) {
    conclude("High confidence in data");
  } else {
    seek_more_data("additional_sensors");
  }
}
`,
      symbol: `
// Symbol definition example
symbol E = m * c^2;
symbol Q_plasma = P_fusion / P_input;

console.log("Symbols defined:", E, Q_plasma);
`,
      learn: `
// Learning function example
learn adapt_to_data(new_data) {
  if (validate(new_data)) {
    integrate(new_data);
    self.confidence += 0.1;
    return conclude("Data integrated successfully");
  }
  return conclude("Data validation failed");
}

// Call the learning function
adapt_to_data("sensor_data_v2");
`
    };
    
    if (!example || !examples[example]) {
      console.log(chalk.red('❌ Unknown example. Available examples:'));
      Object.keys(examples).forEach(key => {
        console.log(chalk.cyan(`  ${key}`));
      });
      return;
    }
    
    console.log(chalk.blue.bold(`\n📝 Loading ${example} example:\n`));
    console.log(chalk.gray(examples[example].trim()));
    console.log();
    
    // Execute the example
    this.handleInput(examples[example].trim());
  }

  /**
   * Show session statistics
   */
  showStats() {
    const uptime = new Date() - this.sessionStartTime;
    const uptimeSeconds = Math.floor(uptime / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    
    console.log(chalk.blue.bold('\n📊 Session Statistics:\n'));
    console.log(chalk.cyan(`Commands executed: ${this.commandCount}`));
    console.log(chalk.cyan(`History entries: ${this.history.length}`));
    console.log(chalk.cyan(`Session uptime: ${uptimeMinutes}m ${uptimeSeconds % 60}s`));
    console.log(chalk.cyan(`Started at: ${this.sessionStartTime.toLocaleString()}`));
    
    const miaStatus = this.runtime.miaIntegration.getStatus();
    console.log(chalk.cyan(`MIA integration: ${miaStatus.enabled ? 'Active' : 'Disabled'}`));
    
    console.log();
  }

  /**
   * Handle exit
   */
  handleExit() {
    const uptime = new Date() - this.sessionStartTime;
    const uptimeSeconds = Math.floor(uptime / 1000);
    
    console.log(chalk.blue.bold('\n👋 MIAL REPL Session Summary:'));
    console.log(chalk.cyan(`Commands executed: ${this.commandCount}`));
    console.log(chalk.cyan(`Session duration: ${uptimeSeconds}s`));
    console.log(chalk.gray('Thank you for using MIAL!'));
    
    process.exit(0);
  }
}

module.exports = { MialREPL };