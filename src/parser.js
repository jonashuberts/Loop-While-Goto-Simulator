// Lexer / Tokenizer
export function tokenize(code) {
  const tokens = [];
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    const lineNum = i + 1;
    let cursor = 0;
    
    while (cursor < lineText.length) {
      const char = lineText[cursor];
      
      // Skip whitespace
      if (/\s/.test(char)) {
        cursor++;
        continue;
      }
      
      // Skip comments
      if (lineText.substring(cursor, cursor + 2) === '//') {
        break;
      }
      
      // Semicolons
      if (char === ';') {
        tokens.push({ type: 'SEMICOLON', value: ';', line: lineNum });
        cursor++;
        continue;
      }
      
      // Zuweisung :=
      if (lineText.substring(cursor, cursor + 2) === ':=') {
        tokens.push({ type: 'ASSIGN', value: ':=', line: lineNum });
        cursor += 2;
        continue;
      }
      
      // Monus Subtraction check (-·, −·, -•, -*, -., etc.)
      const monusMatch = lineText.substring(cursor).match(/^(?:-|−)(?:·|•|\*|\.|dot)/);
      if (monusMatch) {
        tokens.push({ type: 'OPERATOR', value: '-·', line: lineNum });
        cursor += monusMatch[0].length;
        continue;
      }
      
      // Addition operator
      if (char === '+') {
        tokens.push({ type: 'OPERATOR', value: '+', line: lineNum });
        cursor++;
        continue;
      }
      
      // Standard Subtraction
      if (char === '-' || char === '\u2212') {
        tokens.push({ type: 'OPERATOR', value: '-', line: lineNum });
        cursor++;
        continue;
      }
      
      // Numbers
      const numberMatch = lineText.substring(cursor).match(/^\d+/);
      if (numberMatch) {
        tokens.push({ type: 'NUMBER', value: numberMatch[0], line: lineNum });
        cursor += numberMatch[0].length;
        continue;
      }
      
      // Identifiers & Keywords
      const identMatch = lineText.substring(cursor).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
      if (identMatch) {
        const val = identMatch[0];
        const upper = val.toUpperCase();
        if (upper === 'LOOP' || upper === 'DO' || upper === 'END') {
          tokens.push({ type: 'KEYWORD', value: upper, line: lineNum });
        } else {
          tokens.push({ type: 'IDENTIFIER', value: val, line: lineNum });
        }
        cursor += val.length;
        continue;
      }
      
      throw new Error(`Unerwartetes Zeichen '${char}' in Zeile ${lineNum}`);
    }
  }
  
  tokens.push({ type: 'EOF', value: 'EOF', line: lines.length || 1 });
  return tokens;
}

// Recursive Descent Parser
export function parse(tokens) {
  let index = 0;
  
  function peek() {
    return tokens[index];
  }
  
  function consume(type, expectedValue) {
    const token = peek();
    if (token.type !== type) {
      throw new Error(`Syntaxfehler in Zeile ${token.line}: Erwartet '${type}'${expectedValue ? ` ('${expectedValue}')` : ''}, erhalten: '${token.type}' ('${token.value}')`);
    }
    if (expectedValue && token.value !== expectedValue) {
      throw new Error(`Syntaxfehler in Zeile ${token.line}: Erwartet '${expectedValue}', erhalten: '${token.value}'`);
    }
    index++;
    return token;
  }
  
  function match(type, value) {
    const token = peek();
    if (token.type !== type) return false;
    if (value && token.value !== value) return false;
    return true;
  }
  
  function parseStatementList() {
    const statements = [];
    while (true) {
      while (match('SEMICOLON')) {
        consume('SEMICOLON');
      }
      
      if (match('EOF') || match('KEYWORD', 'END')) {
        break;
      }
      
      const stmt = parseStatement();
      statements.push(stmt);
      
      if (match('SEMICOLON')) {
        consume('SEMICOLON');
      }
    }
    return statements;
  }
  
  function parseStatement() {
    const token = peek();
    
    if (token.type === 'KEYWORD' && token.value === 'LOOP') {
      consume('KEYWORD', 'LOOP');
      const loopVar = consume('IDENTIFIER');
      consume('KEYWORD', 'DO');
      const body = parseStatementList();
      consume('KEYWORD', 'END');
      
      return {
        type: 'LOOP',
        var: loopVar.value,
        body: body,
        line: token.line,
        text: `LOOP ${loopVar.value} DO`
      };
    } else if (token.type === 'IDENTIFIER') {
      const target = consume('IDENTIFIER');
      consume('ASSIGN');
      
      let op1;
      if (match('IDENTIFIER')) {
        op1 = consume('IDENTIFIER').value;
      } else if (match('NUMBER')) {
        op1 = consume('NUMBER').value;
      } else {
        throw new Error(`Syntaxfehler in Zeile ${peek().line}: Erwartet Variable oder Zahl nach ':='`);
      }
      
      let operator = null;
      let op2 = null;
      
      if (match('OPERATOR')) {
        operator = consume('OPERATOR').value;
        if (match('IDENTIFIER')) {
          op2 = consume('IDENTIFIER').value;
          
        } else if (match('NUMBER')) {
          op2 = consume('NUMBER').value;
        } else {
          throw new Error(`Syntaxfehler in Zeile ${peek().line}: Erwartet Variable oder Zahl nach Operator '${operator}'`);
        }
      }
      
      let text = `${target.value} := ${op1}`;
      if (operator) text += ` ${operator} ${op2}`;
      
      return {
        type: 'ASSIGN',
        target: target.value,
        operand1: op1,
        operator: operator,
        operand2: op2,
        line: token.line,
        text: text
      };
    } else {
      throw new Error(`Syntaxfehler in Zeile ${token.line}: Unerwartetes Token '${token.value}'. Erwartet Zuweisung oder 'LOOP'.`);
    }
  }
  
  const ast = parseStatementList();
  consume('EOF');
  return ast;
}
