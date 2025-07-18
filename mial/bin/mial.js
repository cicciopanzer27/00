#!/usr/bin/env node

/**
 * MIAL CLI - Command Line Interface for MIAL
 */

const { MialRuntime } = require('../src/index');
const chalk = require('chalk');

// Create runtime instance
const runtime = new MialRuntime();

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(chalk.blue.bold('🧠 MIAL - Meta-Ignorance AI Language'));
    console.log('Usage:');
    console.log('  mial <file.mial>     - Execute a MIAL file');
    console.log('  mial repl           - Start interactive REPL');
    console.log('  mial info           - Show language information');
    console.log('  mial examples       - Show example programs');
    console.log('  mial --version      - Show version information');
    process.exit(0);
}

const command = args[0];

async function main() {
    try {
        switch (command) {
            case 'repl':
                await runtime.startRepl();
                break;
            
            case 'info':
                const info = runtime.getLanguageInfo();
                console.log(chalk.blue.bold('🧠 MIAL Language Information'));
                console.log(chalk.cyan(`Name: ${info.name}`));
                console.log(chalk.cyan(`Version: ${info.version}`));
                console.log(chalk.cyan(`Description: ${info.description}`));
                console.log(chalk.cyan('Features:'));
                info.features.forEach(feature => {
                    console.log(chalk.gray(`  • ${feature}`));
                });
                break;
            
            case 'examples':
                console.log(chalk.blue.bold('📚 MIAL Examples:'));
                console.log(chalk.cyan('Basic Examples:'));
                console.log('  examples/basic.mial              - Basic MIAL syntax');
                console.log('  examples/probabilistic.mial     - Probabilistic programming');
                console.log('  examples/meta_reasoning.mial    - Meta-cognitive programming');
                console.log('  examples/symbolic_computation.mial - Symbolic reasoning');
                console.log('  examples/fusion_research.mial   - Nuclear fusion research');
                console.log();
                console.log(chalk.cyan('To run an example:'));
                console.log('  mial examples/basic.mial');
                break;
            
            case '--version':
            case '-v':
                console.log(runtime.getLanguageInfo().version);
                break;
            
            default:
                if (command.endsWith('.mial')) {
                    await runtime.executeFile(command);
                } else {
                    console.error(chalk.red('❌ Unknown command or invalid file extension'));
                    console.log('Use "mial --help" for usage information');
                    process.exit(1);
                }
        }
    } catch (error) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
    }
}

main();