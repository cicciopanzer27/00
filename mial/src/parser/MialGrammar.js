/**
 * MIAL Grammar - Defines the syntax rules for MIAL language
 */

class MialGrammar {
  constructor() {
    this.precedence = {
      'ASSIGNMENT': 1,
      'LOGICAL_OR': 2,
      'LOGICAL_AND': 3,
      'EQUALITY': 4,
      'RELATIONAL': 5,
      'ADDITIVE': 6,
      'MULTIPLICATIVE': 7,
      'UNARY': 8,
      'POSTFIX': 9
    };
  }

  /**
   * Parse tokens into Abstract Syntax Tree
   */
  parse(tokens) {
    this.tokens = tokens;
    this.position = 0;
    this.currentToken = this.tokens[0];
    
    return this.parseProgram();
  }

  /**
   * Parse the entire program
   */
  parseProgram() {
    const statements = [];
    
    while (!this.isAtEnd()) {
      if (this.match('EOF')) break;
      
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }
    
    return {
      type: 'Program',
      body: statements,
      sourceType: 'module'
    };
  }

  /**
   * Parse a statement
   */
  parseStatement() {
    try {
      // Variable declarations
      if (this.match('KEYWORD', 'let') || this.match('KEYWORD', 'const') || this.match('KEYWORD', 'var')) {
        return this.parseVariableDeclaration();
      }
      
      // Function declarations
      if (this.match('KEYWORD', 'function')) {
        return this.parseFunctionDeclaration();
      }
      
      // Learn function declarations
      if (this.match('KEYWORD', 'learn')) {
        return this.parseLearnFunction();
      }
      
      // Meta blocks
      if (this.match('KEYWORD', 'meta')) {
        return this.parseMetaBlock();
      }
      
      // Symbol definitions
      if (this.match('KEYWORD', 'symbol')) {
        return this.parseSymbolDefinition();
      }
      
      // Knowledge graph definitions
      if (this.match('KEYWORD', 'knowledge_graph')) {
        return this.parseKnowledgeGraph();
      }
      
      // Control flow
      if (this.match('KEYWORD', 'if')) {
        return this.parseIfStatement();
      }
      
      if (this.match('KEYWORD', 'while')) {
        return this.parseWhileStatement();
      }
      
      if (this.match('KEYWORD', 'for')) {
        return this.parseForStatement();
      }
      
      if (this.match('KEYWORD', 'return')) {
        return this.parseReturnStatement();
      }
      
      // Expression statements
      return this.parseExpressionStatement();
      
    } catch (error) {
      // Skip to next statement on error
      this.skipToNextStatement();
      throw error;
    }
  }

  /**
   * Parse variable declaration
   */
  parseVariableDeclaration() {
    const kind = this.previous().value; // let, const, var
    const name = this.consume('IDENTIFIER', 'Expected variable name').value;
    
    let typeAnnotation = null;
    let init = null;
    
    // Type annotation (e.g., : prob(0.7))
    if (this.match('DELIMITER', ':')) {
      typeAnnotation = this.parseTypeAnnotation();
    }
    
    // Initialization
    if (this.match('OPERATOR', '=')) {
      init = this.parseExpression();
    }
    
    this.consume('DELIMITER', ';', 'Expected `;` after variable declaration');
    
    return {
      type: 'VariableDeclaration',
      declarations: [{
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: name
        },
        init: init,
        typeAnnotation: typeAnnotation
      }],
      kind: kind
    };
  }

  /**
   * Parse type annotation (prob, confident, etc.)
   */
  parseTypeAnnotation() {
    if (this.match('KEYWORD', 'prob')) {
      this.consume('DELIMITER', '(', 'Expected `(` after prob');
      const confidence = this.parseExpression();
      this.consume('DELIMITER', ')', 'Expected `)` after confidence');
      
      return {
        type: 'ProbabilisticType',
        confidence: confidence
      };
    }
    
    if (this.match('KEYWORD', 'confident')) {
      this.consume('DELIMITER', '(', 'Expected `(` after confident');
      const level = this.parseExpression();
      this.consume('DELIMITER', ')', 'Expected `)` after confidence level');
      
      return {
        type: 'ConfidentType',
        confidenceLevel: level
      };
    }
    
    // Regular type
    const typeName = this.consume('IDENTIFIER', 'Expected type name').value;
    return {
      type: 'TypeAnnotation',
      typeName: typeName
    };
  }

  /**
   * Parse meta block
   */
  parseMetaBlock() {
    const condition = this.parseExpression();
    this.consume('DELIMITER', '?', 'Expected `?` after meta condition');
    
    const body = this.parseBlockStatement();
    
    return {
      type: 'MetaBlock',
      condition: condition,
      body: body
    };
  }

  /**
   * Parse learn function
   */
  parseLearnFunction() {
    const name = this.consume('IDENTIFIER', 'Expected function name').value;
    
    this.consume('DELIMITER', '(', 'Expected `(` after function name');
    const params = this.parseParameterList();
    this.consume('DELIMITER', ')', 'Expected `)` after parameters');
    
    const body = this.parseBlockStatement();
    
    return {
      type: 'LearnFunction',
      name: name,
      params: params,
      body: body,
      isLearning: true
    };
  }

  /**
   * Parse symbol definition
   */
  parseSymbolDefinition() {
    const name = this.consume('IDENTIFIER', 'Expected symbol name').value;
    this.consume('OPERATOR', '=', 'Expected `=` after symbol name');
    const expression = this.parseExpression();
    this.consume('DELIMITER', ';', 'Expected `;` after symbol definition');
    
    return {
      type: 'SymbolDefinition',
      name: name,
      expression: expression
    };
  }

  /**
   * Parse knowledge graph
   */
  parseKnowledgeGraph() {
    const name = this.consume('IDENTIFIER', 'Expected knowledge graph name').value;
    this.consume('DELIMITER', '{', 'Expected `{` after knowledge graph name');
    
    const relations = [];
    
    while (!this.check('DELIMITER', '}') && !this.isAtEnd()) {
      const relation = this.parseRelation();
      relations.push(relation);
      
      if (!this.match('DELIMITER', ';')) {
        break;
      }
    }
    
    this.consume('DELIMITER', '}', 'Expected `}` after knowledge graph');
    
    return {
      type: 'KnowledgeGraph',
      name: name,
      relations: relations
    };
  }

  /**
   * Parse relation in knowledge graph
   */
  parseRelation() {
    const subject = this.parseExpression();
    this.consume('OPERATOR', '->', 'Expected `->` in relation');
    const predicate = this.parseExpression();
    this.consume('OPERATOR', '->', 'Expected `->` after predicate');
    const object = this.parseExpression();
    
    return {
      type: 'Relation',
      subject: subject,
      predicate: predicate,
      object: object
    };
  }

  /**
   * Parse block statement
   */
  parseBlockStatement() {
    this.consume('DELIMITER', '{', 'Expected `{` before block');
    
    const statements = [];
    
    while (!this.check('DELIMITER', '}') && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }
    
    this.consume('DELIMITER', '}', 'Expected `}` after block');
    
    return {
      type: 'BlockStatement',
      body: statements
    };
  }

  /**
   * Parse expression
   */
  parseExpression() {
    return this.parseAssignmentExpression();
  }

  /**
   * Parse assignment expression
   */
  parseAssignmentExpression() {
    const expr = this.parseLogicalOrExpression();
    
    if (this.match('OPERATOR', '=')) {
      const right = this.parseAssignmentExpression();
      return {
        type: 'AssignmentExpression',
        operator: '=',
        left: expr,
        right: right
      };
    }
    
    return expr;
  }

  /**
   * Parse logical OR expression
   */
  parseLogicalOrExpression() {
    let expr = this.parseLogicalAndExpression();
    
    while (this.match('OPERATOR', '||')) {
      const operator = this.previous().value;
      const right = this.parseLogicalAndExpression();
      expr = {
        type: 'LogicalExpression',
        operator: operator,
        left: expr,
        right: right
      };
    }
    
    return expr;
  }

  /**
   * Parse logical AND expression
   */
  parseLogicalAndExpression() {
    let expr = this.parseEqualityExpression();
    
    while (this.match('OPERATOR', '&&')) {
      const operator = this.previous().value;
      const right = this.parseEqualityExpression();
      expr = {
        type: 'LogicalExpression',
        operator: operator,
        left: expr,
        right: right
      };
    }
    
    return expr;
  }

  /**
   * Parse equality expression
   */
  parseEqualityExpression() {
    let expr = this.parseRelationalExpression();
    
    while (this.match('OPERATOR', '==') || this.match('OPERATOR', '!=')) {
      const operator = this.previous().value;
      const right = this.parseRelationalExpression();
      expr = {
        type: 'BinaryExpression',
        operator: operator,
        left: expr,
        right: right
      };
    }
    
    return expr;
  }

  /**
   * Parse relational expression
   */
  parseRelationalExpression() {
    let expr = this.parseAdditiveExpression();
    
    while (this.match('OPERATOR', '<') || this.match('OPERATOR', '>') || 
           this.match('OPERATOR', '<=') || this.match('OPERATOR', '>=')) {
      const operator = this.previous().value;
      const right = this.parseAdditiveExpression();
      expr = {
        type: 'BinaryExpression',
        operator: operator,
        left: expr,
        right: right
      };
    }
    
    return expr;
  }

  /**
   * Parse additive expression
   */
  parseAdditiveExpression() {
    let expr = this.parseMultiplicativeExpression();
    
    while (this.match('OPERATOR', '+') || this.match('OPERATOR', '-') || this.match('OPERATOR', '±')) {
      const operator = this.previous().value;
      const right = this.parseMultiplicativeExpression();
      expr = {
        type: 'BinaryExpression',
        operator: operator,
        left: expr,
        right: right
      };
    }
    
    return expr;
  }

  /**
   * Parse multiplicative expression
   */
  parseMultiplicativeExpression() {
    let expr = this.parseUnaryExpression();
    
    while (this.match('OPERATOR', '*') || this.match('OPERATOR', '/') || this.match('OPERATOR', '%')) {
      const operator = this.previous().value;
      const right = this.parseUnaryExpression();
      expr = {
        type: 'BinaryExpression',
        operator: operator,
        left: expr,
        right: right
      };
    }
    
    return expr;
  }

  /**
   * Parse unary expression
   */
  parseUnaryExpression() {
    if (this.match('OPERATOR', '!') || this.match('OPERATOR', '-') || this.match('OPERATOR', '+')) {
      const operator = this.previous().value;
      const argument = this.parseUnaryExpression();
      return {
        type: 'UnaryExpression',
        operator: operator,
        argument: argument,
        prefix: true
      };
    }
    
    return this.parsePostfixExpression();
  }

  /**
   * Parse postfix expression
   */
  parsePostfixExpression() {
    let expr = this.parsePrimaryExpression();
    
    while (true) {
      if (this.match('DELIMITER', '(')) {
        // Function call
        const args = this.parseArgumentList();
        this.consume('DELIMITER', ')', 'Expected `)` after arguments');
        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: args
        };
      } else if (this.match('DELIMITER', '[')) {
        // Member access
        const property = this.parseExpression();
        this.consume('DELIMITER', ']', 'Expected `]` after member access');
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: property,
          computed: true
        };
      } else if (this.match('DELIMITER', '.')) {
        // Property access
        const property = this.consume('IDENTIFIER', 'Expected property name').value;
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: {
            type: 'Identifier',
            name: property
          },
          computed: false
        };
      } else {
        break;
      }
    }
    
    return expr;
  }

  /**
   * Parse primary expression
   */
  parsePrimaryExpression() {
    // Literals
    if (this.match('NUMBER')) {
      return {
        type: 'Literal',
        value: this.previous().value,
        raw: this.previous().value.toString()
      };
    }
    
    if (this.match('STRING')) {
      return {
        type: 'Literal',
        value: this.previous().value,
        raw: `"${this.previous().value}"`
      };
    }
    
    if (this.match('KEYWORD', 'true') || this.match('KEYWORD', 'false')) {
      return {
        type: 'Literal',
        value: this.previous().value === 'true',
        raw: this.previous().value
      };
    }
    
    if (this.match('KEYWORD', 'null')) {
      return {
        type: 'Literal',
        value: null,
        raw: 'null'
      };
    }
    
    // Identifiers
    if (this.match('IDENTIFIER')) {
      return {
        type: 'Identifier',
        name: this.previous().value
      };
    }
    
    // Parenthesized expressions
    if (this.match('DELIMITER', '(')) {
      const expr = this.parseExpression();
      this.consume('DELIMITER', ')', 'Expected `)` after expression');
      return expr;
    }
    
    // Built-in functions
    if (this.match('KEYWORD', 'confidence') || this.match('KEYWORD', 'uncertainty') || 
        this.match('KEYWORD', 'validate') || this.match('KEYWORD', 'integrate')) {
      const functionName = this.previous().value;
      this.consume('DELIMITER', '(', `Expected \`(\` after ${functionName}`);
      const args = this.parseArgumentList();
      this.consume('DELIMITER', ')', `Expected \`)\` after ${functionName} arguments`);
      
      return {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: functionName
        },
        arguments: args
      };
    }
    
    throw new Error(`Unexpected token: ${this.currentToken.value}`);
  }

  // Helper methods
  match(type, value = null) {
    if (this.check(type, value)) {
      this.advance();
      return true;
    }
    return false;
  }

  check(type, value = null) {
    if (this.isAtEnd()) return false;
    if (this.currentToken.type !== type) return false;
    if (value !== null && this.currentToken.value !== value) return false;
    return true;
  }

  advance() {
    if (!this.isAtEnd()) {
      this.position++;
      this.currentToken = this.tokens[this.position];
    }
    return this.previous();
  }

  isAtEnd() {
    return this.position >= this.tokens.length || this.currentToken.type === 'EOF';
  }

  previous() {
    return this.tokens[this.position - 1];
  }

  consume(type, message, value = null) {
    if (this.check(type, value)) {
      return this.advance();
    }
    
    throw new Error(`${message}. Got ${this.currentToken.type}: ${this.currentToken.value}`);
  }

  skipToNextStatement() {
    while (!this.isAtEnd() && !this.check('DELIMITER', ';') && !this.check('DELIMITER', '}')) {
      this.advance();
    }
    if (this.check('DELIMITER', ';')) {
      this.advance();
    }
  }

  parseParameterList() {
    const params = [];
    
    if (!this.check('DELIMITER', ')')) {
      do {
        const param = this.consume('IDENTIFIER', 'Expected parameter name').value;
        params.push({
          type: 'Identifier',
          name: param
        });
      } while (this.match('DELIMITER', ','));
    }
    
    return params;
  }

  parseArgumentList() {
    const args = [];
    
    if (!this.check('DELIMITER', ')')) {
      do {
        args.push(this.parseExpression());
      } while (this.match('DELIMITER', ','));
    }
    
    return args;
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    this.consume('DELIMITER', ';', 'Expected `;` after expression');
    
    return {
      type: 'ExpressionStatement',
      expression: expr
    };
  }

  parseIfStatement() {
    this.consume('DELIMITER', '(', 'Expected `(` after if');
    const test = this.parseExpression();
    this.consume('DELIMITER', ')', 'Expected `)` after if condition');
    
    const consequent = this.parseStatement();
    let alternate = null;
    
    if (this.match('KEYWORD', 'else')) {
      alternate = this.parseStatement();
    }
    
    return {
      type: 'IfStatement',
      test: test,
      consequent: consequent,
      alternate: alternate
    };
  }

  parseWhileStatement() {
    this.consume('DELIMITER', '(', 'Expected `(` after while');
    const test = this.parseExpression();
    this.consume('DELIMITER', ')', 'Expected `)` after while condition');
    
    const body = this.parseStatement();
    
    return {
      type: 'WhileStatement',
      test: test,
      body: body
    };
  }

  parseForStatement() {
    this.consume('DELIMITER', '(', 'Expected `(` after for');
    
    const init = this.parseStatement();
    const test = this.parseExpression();
    this.consume('DELIMITER', ';', 'Expected `;` after for test');
    const update = this.parseExpression();
    
    this.consume('DELIMITER', ')', 'Expected `)` after for clauses');
    
    const body = this.parseStatement();
    
    return {
      type: 'ForStatement',
      init: init,
      test: test,
      update: update,
      body: body
    };
  }

  parseReturnStatement() {
    let argument = null;
    
    if (!this.check('DELIMITER', ';')) {
      argument = this.parseExpression();
    }
    
    this.consume('DELIMITER', ';', 'Expected `;` after return value');
    
    return {
      type: 'ReturnStatement',
      argument: argument
    };
  }

  parseFunctionDeclaration() {
    const name = this.consume('IDENTIFIER', 'Expected function name').value;
    
    this.consume('DELIMITER', '(', 'Expected `(` after function name');
    const params = this.parseParameterList();
    this.consume('DELIMITER', ')', 'Expected `)` after parameters');
    
    const body = this.parseBlockStatement();
    
    return {
      type: 'FunctionDeclaration',
      id: {
        type: 'Identifier',
        name: name
      },
      params: params,
      body: body
    };
  }
}

module.exports = { MialGrammar };