/**
 * MIAL Lexer - Tokenizes MIAL source code
 */

class MialLexer {
  constructor() {
    this.keywords = new Set([
      'let', 'const', 'var', 'function', 'return',
      'if', 'else', 'while', 'for', 'break', 'continue',
      'prob', 'confident', 'symbol', 'meta', 'learn',
      'conclude', 'seek', 'validate', 'integrate',
      'knowledge_graph', 'confidence', 'uncertainty',
      'know', 'reason_about', 'self', 'true', 'false',
      'null', 'undefined', 'import', 'export'
    ]);
    
    this.operators = new Set([
      '+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=',
      '&&', '||', '!', '?', ':', '±', '->', '|', '&', '^', '~'
    ]);
    
    this.delimiters = new Set([
      '(', ')', '[', ']', '{', '}', ';', ',', '.', ':', '?', '!'
    ]);
  }

  /**
   * Tokenize MIAL source code
   */
  tokenize(source) {
    const tokens = [];
    let position = 0;
    let line = 1;
    let column = 1;
    
    while (position < source.length) {
      const char = source[position];
      
      // Skip whitespace
      if (this.isWhitespace(char)) {
        if (char === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        position++;
        continue;
      }
      
      // Skip comments
      if (char === '/' && source[position + 1] === '/') {
        // Single line comment
        while (position < source.length && source[position] !== '\n') {
          position++;
        }
        continue;
      }
      
      if (char === '/' && source[position + 1] === '*') {
        // Multi-line comment
        position += 2;
        while (position < source.length - 1) {
          if (source[position] === '*' && source[position + 1] === '/') {
            position += 2;
            break;
          }
          if (source[position] === '\n') {
            line++;
            column = 1;
          } else {
            column++;
          }
          position++;
        }
        continue;
      }
      
      // String literals
      if (char === '"' || char === "'") {
        const token = this.readString(source, position, char);
        tokens.push({
          type: 'STRING',
          value: token.value,
          line: line,
          column: column
        });
        position = token.newPosition;
        column += token.value.length + 2; // +2 for quotes
        continue;
      }
      
      // Numbers
      if (this.isDigit(char)) {
        const token = this.readNumber(source, position);
        tokens.push({
          type: 'NUMBER',
          value: token.value,
          line: line,
          column: column
        });
        position = token.newPosition;
        column += token.value.toString().length;
        continue;
      }
      
      // Identifiers and keywords
      if (this.isAlpha(char) || char === '_') {
        const token = this.readIdentifier(source, position);
        const tokenType = this.keywords.has(token.value) ? 'KEYWORD' : 'IDENTIFIER';
        tokens.push({
          type: tokenType,
          value: token.value,
          line: line,
          column: column
        });
        position = token.newPosition;
        column += token.value.length;
        continue;
      }
      
      // Operators
      if (this.isOperatorStart(char)) {
        const token = this.readOperator(source, position);
        tokens.push({
          type: 'OPERATOR',
          value: token.value,
          line: line,
          column: column
        });
        position = token.newPosition;
        column += token.value.length;
        continue;
      }
      
      // Delimiters
      if (this.delimiters.has(char)) {
        tokens.push({
          type: 'DELIMITER',
          value: char,
          line: line,
          column: column
        });
        position++;
        column++;
        continue;
      }
      
      // Unknown character
      throw new Error(`Unexpected character '${char}' at line ${line}, column ${column}`);
    }
    
    // Add EOF token
    tokens.push({
      type: 'EOF',
      value: '',
      line: line,
      column: column
    });
    
    return tokens;
  }

  /**
   * Read string literal
   */
  readString(source, start, quote) {
    let position = start + 1;
    let value = '';
    
    while (position < source.length && source[position] !== quote) {
      if (source[position] === '\\') {
        // Handle escape sequences
        position++;
        if (position < source.length) {
          const escaped = source[position];
          switch (escaped) {
            case 'n': value += '\n'; break;
            case 't': value += '\t'; break;
            case 'r': value += '\r'; break;
            case '\\': value += '\\'; break;
            case '"': value += '"'; break;
            case "'": value += "'"; break;
            default: value += escaped;
          }
        }
      } else {
        value += source[position];
      }
      position++;
    }
    
    if (position >= source.length) {
      throw new Error('Unterminated string literal');
    }
    
    return {
      value: value,
      newPosition: position + 1
    };
  }

  /**
   * Read number literal
   */
  readNumber(source, start) {
    let position = start;
    let value = '';
    let hasDecimal = false;
    
    while (position < source.length) {
      const char = source[position];
      
      if (this.isDigit(char)) {
        value += char;
      } else if (char === '.' && !hasDecimal) {
        hasDecimal = true;
        value += char;
      } else {
        break;
      }
      
      position++;
    }
    
    return {
      value: hasDecimal ? parseFloat(value) : parseInt(value),
      newPosition: position
    };
  }

  /**
   * Read identifier
   */
  readIdentifier(source, start) {
    let position = start;
    let value = '';
    
    while (position < source.length) {
      const char = source[position];
      
      if (this.isAlphaNumeric(char) || char === '_') {
        value += char;
        position++;
      } else {
        break;
      }
    }
    
    return {
      value: value,
      newPosition: position
    };
  }

  /**
   * Read operator
   */
  readOperator(source, start) {
    let position = start;
    let value = '';
    
    // Check for multi-character operators
    if (position + 1 < source.length) {
      const twoChar = source.substring(position, position + 2);
      if (this.operators.has(twoChar)) {
        return {
          value: twoChar,
          newPosition: position + 2
        };
      }
    }
    
    // Single character operator
    value = source[position];
    return {
      value: value,
      newPosition: position + 1
    };
  }

  // Helper methods
  isWhitespace(char) {
    return /\s/.test(char);
  }

  isDigit(char) {
    return /\d/.test(char);
  }

  isAlpha(char) {
    return /[a-zA-Z]/.test(char);
  }

  isAlphaNumeric(char) {
    return /[a-zA-Z0-9]/.test(char);
  }

  isOperatorStart(char) {
    return this.operators.has(char) || char === '±' || char === '→';
  }
}

module.exports = { MialLexer };