/**
 * MIAL Interpreter - Executes MIAL Abstract Syntax Tree
 */

const { MialEnvironment } = require('./MialEnvironment');
const { MialValue } = require('./MialValue');
const { MialBuiltins } = require('./MialBuiltins');

class MialInterpreter {
  constructor() {
    this.globalEnv = new MialEnvironment();
    this.builtins = new MialBuiltins();
    this.setupBuiltins();
  }

  /**
   * Setup built-in functions and objects
   */
  setupBuiltins() {
    // Built-in functions
    this.globalEnv.define('confidence', this.builtins.confidence);
    this.globalEnv.define('uncertainty', this.builtins.uncertainty);
    this.globalEnv.define('validate', this.builtins.validate);
    this.globalEnv.define('integrate', this.builtins.integrate);
    this.globalEnv.define('reason_about', this.builtins.reasonAbout);
    this.globalEnv.define('know', this.builtins.know);
    this.globalEnv.define('conclude', this.builtins.conclude);
    this.globalEnv.define('seek', this.builtins.seek);
    this.globalEnv.define('seek_more_data', this.builtins.seekMoreData);
    
    // Built-in objects
    this.globalEnv.define('self', this.builtins.self);
    this.globalEnv.define('console', this.builtins.console);
    this.globalEnv.define('Math', this.builtins.Math);
  }

  /**
   * Execute AST
   */
  async execute(ast, context = {}) {
    this.context = context;
    this.miaIntegration = context.miaIntegration;
    
    try {
      const result = await this.evaluate(ast, this.globalEnv);
      return result;
    } catch (error) {
      console.error('❌ MIAL Runtime Error:', error.message);
      throw error;
    }
  }

  /**
   * Evaluate AST node
   */
  async evaluate(node, env) {
    if (!node) return null;
    
    switch (node.type) {
      case 'Program':
        return await this.evaluateProgram(node, env);
      
      case 'VariableDeclaration':
        return await this.evaluateVariableDeclaration(node, env);
      
      case 'FunctionDeclaration':
        return await this.evaluateFunctionDeclaration(node, env);
      
      case 'LearnFunction':
        return await this.evaluateLearnFunction(node, env);
      
      case 'MetaBlock':
        return await this.evaluateMetaBlock(node, env);
      
      case 'SymbolDefinition':
        return await this.evaluateSymbolDefinition(node, env);
      
      case 'KnowledgeGraph':
        return await this.evaluateKnowledgeGraph(node, env);
      
      case 'BlockStatement':
        return await this.evaluateBlockStatement(node, env);
      
      case 'ExpressionStatement':
        return await this.evaluate(node.expression, env);
      
      case 'IfStatement':
        return await this.evaluateIfStatement(node, env);
      
      case 'WhileStatement':
        return await this.evaluateWhileStatement(node, env);
      
      case 'ForStatement':
        return await this.evaluateForStatement(node, env);
      
      case 'ReturnStatement':
        return await this.evaluateReturnStatement(node, env);
      
      case 'BinaryExpression':
        return await this.evaluateBinaryExpression(node, env);
      
      case 'UnaryExpression':
        return await this.evaluateUnaryExpression(node, env);
      
      case 'LogicalExpression':
        return await this.evaluateLogicalExpression(node, env);
      
      case 'AssignmentExpression':
        return await this.evaluateAssignmentExpression(node, env);
      
      case 'CallExpression':
        return await this.evaluateCallExpression(node, env);
      
      case 'MemberExpression':
        return await this.evaluateMemberExpression(node, env);
      
      case 'Identifier':
        return await this.evaluateIdentifier(node, env);
      
      case 'Literal':
        return await this.evaluateLiteral(node, env);
      
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Evaluate program
   */
  async evaluateProgram(node, env) {
    let result = null;
    
    for (const statement of node.body) {
      result = await this.evaluate(statement, env);
      
      // Handle return statements
      if (result && result.type === 'ReturnValue') {
        return result.value;
      }
    }
    
    return result;
  }

  /**
   * Evaluate variable declaration
   */
  async evaluateVariableDeclaration(node, env) {
    for (const declarator of node.declarations) {
      const name = declarator.id.name;
      let value = null;
      
      if (declarator.init) {
        value = await this.evaluate(declarator.init, env);
      }
      
      // Handle probabilistic types
      if (declarator.typeAnnotation) {
        value = await this.applyTypeAnnotation(value, declarator.typeAnnotation, env);
      }
      
      env.define(name, value);
      
      // Integrate with MIA system
      if (this.miaIntegration && declarator.typeAnnotation) {
        await this.miaIntegration.addSymbol({
          name: name,
          value: value,
          type: declarator.typeAnnotation.type,
          confidence: value?.confidence || 0.8
        });
      }
    }
    
    return null;
  }

  /**
   * Apply type annotation to value
   */
  async applyTypeAnnotation(value, typeAnnotation, env) {
    switch (typeAnnotation.type) {
      case 'ProbabilisticType':
        const confidence = await this.evaluate(typeAnnotation.confidence, env);
        return new MialValue(value, {
          type: 'probabilistic',
          confidence: confidence,
          uncertainty: 1 - confidence
        });
      
      case 'ConfidentType':
        const confidenceLevel = await this.evaluate(typeAnnotation.confidenceLevel, env);
        return new MialValue(value, {
          type: 'confident',
          confidence: confidenceLevel,
          uncertainty: 1 - confidenceLevel
        });
      
      default:
        return value;
    }
  }

  /**
   * Evaluate function declaration
   */
  async evaluateFunctionDeclaration(node, env) {
    const name = node.id.name;
    const func = {
      type: 'function',
      name: name,
      params: node.params,
      body: node.body,
      closure: env
    };
    
    env.define(name, func);
    return func;
  }

  /**
   * Evaluate learn function
   */
  async evaluateLearnFunction(node, env) {
    const name = node.name;
    const func = {
      type: 'learn_function',
      name: name,
      params: node.params,
      body: node.body,
      closure: env,
      isLearning: true,
      adaptationCount: 0
    };
    
    env.define(name, func);
    
    // Register with MIA system
    if (this.miaIntegration) {
      await this.miaIntegration.addLearnFunction(func);
    }
    
    return func;
  }

  /**
   * Evaluate meta block
   */
  async evaluateMetaBlock(node, env) {
    const condition = await this.evaluate(node.condition, env);
    
    // Meta-reasoning about the condition
    const metaResult = await this.performMetaReasoning(condition, env);
    
    if (metaResult.shouldExecute) {
      const result = await this.evaluate(node.body, env);
      
      // Log meta-reasoning activity
      if (this.miaIntegration) {
        await this.miaIntegration.logMetaReasoning({
          condition: condition,
          result: result,
          confidence: metaResult.confidence,
          reasoning: metaResult.reasoning
        });
      }
      
      return result;
    }
    
    return null;
  }

  /**
   * Perform meta-reasoning
   */
  async performMetaReasoning(condition, env) {
    // Analyze the condition's confidence and uncertainty
    const confidence = condition?.confidence || 0.5;
    const uncertainty = condition?.uncertainty || 0.5;
    
    // Meta-reasoning logic
    const shouldExecute = confidence > 0.5 || uncertainty < 0.3;
    
    return {
      shouldExecute: shouldExecute,
      confidence: confidence,
      uncertainty: uncertainty,
      reasoning: `Meta-analysis: confidence=${confidence}, uncertainty=${uncertainty}`
    };
  }

  /**
   * Evaluate symbol definition
   */
  async evaluateSymbolDefinition(node, env) {
    const name = node.name;
    const expression = await this.evaluate(node.expression, env);
    
    const symbol = {
      type: 'symbol',
      name: name,
      expression: expression,
      mathematical_notation: this.generateMathNotation(expression),
      confidence: 0.9
    };
    
    env.define(name, symbol);
    
    // Add to MIA system
    if (this.miaIntegration) {
      await this.miaIntegration.addSymbol({
        id: `SYM_${Date.now()}_${name}`,
        name: name,
        domain: 'user_defined',
        description: `User-defined symbol: ${name}`,
        mathematical_notation: symbol.mathematical_notation,
        generated_at: new Date().toISOString(),
        confidence: symbol.confidence,
        connections: []
      });
    }
    
    return symbol;
  }

  /**
   * Generate mathematical notation for expression
   */
  generateMathNotation(expression) {
    // Simple math notation generation
    if (typeof expression === 'number') {
      return expression.toString();
    }
    
    if (expression?.type === 'BinaryExpression') {
      const left = this.generateMathNotation(expression.left);
      const right = this.generateMathNotation(expression.right);
      return `${left} ${expression.operator} ${right}`;
    }
    
    return expression?.toString() || 'unknown';
  }

  /**
   * Evaluate knowledge graph
   */
  async evaluateKnowledgeGraph(node, env) {
    const name = node.name;
    const relations = [];
    
    for (const relation of node.relations) {
      const subject = await this.evaluate(relation.subject, env);
      const predicate = await this.evaluate(relation.predicate, env);
      const object = await this.evaluate(relation.object, env);
      
      relations.push({
        subject: subject,
        predicate: predicate,
        object: object
      });
    }
    
    const knowledgeGraph = {
      type: 'knowledge_graph',
      name: name,
      relations: relations
    };
    
    env.define(name, knowledgeGraph);
    
    // Add to MIA system
    if (this.miaIntegration) {
      await this.miaIntegration.addKnowledgeGraph(knowledgeGraph);
    }
    
    return knowledgeGraph;
  }

  /**
   * Evaluate call expression
   */
  async evaluateCallExpression(node, env) {
    const callee = await this.evaluate(node.callee, env);
    const args = [];
    
    for (const arg of node.arguments) {
      args.push(await this.evaluate(arg, env));
    }
    
    if (typeof callee === 'function') {
      return await callee.apply(null, args);
    }
    
    if (callee?.type === 'function') {
      return await this.callUserFunction(callee, args, env);
    }
    
    if (callee?.type === 'learn_function') {
      return await this.callLearnFunction(callee, args, env);
    }
    
    throw new Error(`Cannot call non-function: ${callee}`);
  }

  /**
   * Call user-defined function
   */
  async callUserFunction(func, args, env) {
    const functionEnv = new MialEnvironment(func.closure);
    
    // Bind parameters
    for (let i = 0; i < func.params.length; i++) {
      const param = func.params[i];
      const arg = args[i] || null;
      functionEnv.define(param.name, arg);
    }
    
    try {
      const result = await this.evaluate(func.body, functionEnv);
      return result?.type === 'ReturnValue' ? result.value : result;
    } catch (error) {
      if (error.type === 'ReturnValue') {
        return error.value;
      }
      throw error;
    }
  }

  /**
   * Call learn function
   */
  async callLearnFunction(func, args, env) {
    const result = await this.callUserFunction(func, args, env);
    
    // Update adaptation count
    func.adaptationCount++;
    
    // Log learning activity
    if (this.miaIntegration) {
      await this.miaIntegration.logLearning({
        functionName: func.name,
        adaptationCount: func.adaptationCount,
        args: args,
        result: result
      });
    }
    
    return result;
  }

  /**
   * Evaluate binary expression
   */
  async evaluateBinaryExpression(node, env) {
    const left = await this.evaluate(node.left, env);
    const right = await this.evaluate(node.right, env);
    
    switch (node.operator) {
      case '+':
        return this.handleUncertainArithmetic(left, right, (a, b) => a + b);
      case '-':
        return this.handleUncertainArithmetic(left, right, (a, b) => a - b);
      case '*':
        return this.handleUncertainArithmetic(left, right, (a, b) => a * b);
      case '/':
        return this.handleUncertainArithmetic(left, right, (a, b) => a / b);
      case '%':
        return this.handleUncertainArithmetic(left, right, (a, b) => a % b);
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case '<':
        return left < right;
      case '>':
        return left > right;
      case '<=':
        return left <= right;
      case '>=':
        return left >= right;
      case '±':
        return this.handleUncertaintyRange(left, right);
      default:
        throw new Error(`Unknown binary operator: ${node.operator}`);
    }
  }

  /**
   * Handle uncertain arithmetic
   */
  handleUncertainArithmetic(left, right, operation) {
    const leftValue = left?.value || left;
    const rightValue = right?.value || right;
    const result = operation(leftValue, rightValue);
    
    // Propagate uncertainty
    const leftUncertainty = left?.uncertainty || 0;
    const rightUncertainty = right?.uncertainty || 0;
    const resultUncertainty = Math.min(leftUncertainty + rightUncertainty, 1);
    
    return new MialValue(result, {
      type: 'uncertain',
      confidence: 1 - resultUncertainty,
      uncertainty: resultUncertainty
    });
  }

  /**
   * Handle uncertainty range (±)
   */
  handleUncertaintyRange(value, range) {
    const baseValue = value?.value || value;
    const rangeValue = range?.value || range;
    
    return new MialValue(baseValue, {
      type: 'uncertain_range',
      confidence: 0.8,
      uncertainty: 0.2,
      range: rangeValue,
      min: baseValue - rangeValue,
      max: baseValue + rangeValue
    });
  }

  /**
   * Evaluate identifier
   */
  async evaluateIdentifier(node, env) {
    try {
      return env.get(node.name);
    } catch (error) {
      throw new Error(`Undefined identifier: ${node.name}`);
    }
  }

  /**
   * Evaluate literal
   */
  async evaluateLiteral(node, env) {
    return node.value;
  }

  /**
   * Evaluate other node types
   */
  async evaluateBlockStatement(node, env) {
    const blockEnv = new MialEnvironment(env);
    let result = null;
    
    for (const statement of node.body) {
      result = await this.evaluate(statement, blockEnv);
      
      if (result?.type === 'ReturnValue') {
        return result;
      }
    }
    
    return result;
  }

  async evaluateIfStatement(node, env) {
    const test = await this.evaluate(node.test, env);
    
    if (this.isTruthy(test)) {
      return await this.evaluate(node.consequent, env);
    } else if (node.alternate) {
      return await this.evaluate(node.alternate, env);
    }
    
    return null;
  }

  async evaluateWhileStatement(node, env) {
    let result = null;
    
    while (this.isTruthy(await this.evaluate(node.test, env))) {
      result = await this.evaluate(node.body, env);
      
      if (result?.type === 'ReturnValue') {
        return result;
      }
    }
    
    return result;
  }

  async evaluateReturnStatement(node, env) {
    const value = node.argument ? await this.evaluate(node.argument, env) : null;
    
    const returnValue = {
      type: 'ReturnValue',
      value: value
    };
    
    throw returnValue; // Use exception for control flow
  }

  async evaluateAssignmentExpression(node, env) {
    const value = await this.evaluate(node.right, env);
    
    if (node.left.type === 'Identifier') {
      env.set(node.left.name, value);
      return value;
    }
    
    throw new Error('Invalid assignment target');
  }

  async evaluateLogicalExpression(node, env) {
    const left = await this.evaluate(node.left, env);
    
    if (node.operator === '&&') {
      return this.isTruthy(left) ? await this.evaluate(node.right, env) : left;
    }
    
    if (node.operator === '||') {
      return this.isTruthy(left) ? left : await this.evaluate(node.right, env);
    }
    
    throw new Error(`Unknown logical operator: ${node.operator}`);
  }

  async evaluateUnaryExpression(node, env) {
    const argument = await this.evaluate(node.argument, env);
    
    switch (node.operator) {
      case '-':
        return -(argument?.value || argument);
      case '+':
        return +(argument?.value || argument);
      case '!':
        return !this.isTruthy(argument);
      default:
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  async evaluateMemberExpression(node, env) {
    const object = await this.evaluate(node.object, env);
    
    if (node.computed) {
      const property = await this.evaluate(node.property, env);
      return object[property];
    } else {
      return object[node.property.name];
    }
  }

  async evaluateForStatement(node, env) {
    const forEnv = new MialEnvironment(env);
    
    // Initialize
    await this.evaluate(node.init, forEnv);
    
    let result = null;
    
    // Loop
    while (this.isTruthy(await this.evaluate(node.test, forEnv))) {
      result = await this.evaluate(node.body, forEnv);
      
      if (result?.type === 'ReturnValue') {
        return result;
      }
      
      // Update
      await this.evaluate(node.update, forEnv);
    }
    
    return result;
  }

  /**
   * Check if value is truthy
   */
  isTruthy(value) {
    if (value === null || value === undefined || value === false) {
      return false;
    }
    
    if (typeof value === 'number' && value === 0) {
      return false;
    }
    
    if (typeof value === 'string' && value === '') {
      return false;
    }
    
    // Handle uncertain values
    if (value?.confidence !== undefined) {
      return value.confidence > 0.5;
    }
    
    return true;
  }
}

module.exports = { MialInterpreter };