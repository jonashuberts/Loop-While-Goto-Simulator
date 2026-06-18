export function getVal(operand, vars) {
  if (/^\d+$/.test(operand)) {
    return parseInt(operand, 10);
  }
  return vars[operand] || 0;
}

// Generator-based Execution
export function* executeProgram(ast, vars) {
  for (let node of ast) {
    if (node.type === 'LOOP') {
      const count = vars[node.var] || 0;
      
      yield {
        node: node,
        line: node.line,
        text: `LOOP ${node.var} DO (${count} Schleifendurchläufe fixiert)`,
        vars: { ...vars }
      };
      
      for (let i = 0; i < count; i++) {
        yield* executeProgram(node.body, vars);
      }
      
      yield {
        node: node,
        line: node.line,
        text: `END (LOOP ${node.var} beendet)`,
        vars: { ...vars }
      };
    } else if (node.type === 'ASSIGN') {
      const target = node.target;
      const val1 = getVal(node.operand1, vars);
      const op = node.operator;
      const val2 = node.operand2 !== null ? getVal(node.operand2, vars) : null;
      
      let result = val1;
      let opText = '';
      if (op === '+') {
        result = val1 + val2;
        opText = `+ ${node.operand2}`;
      } else if (op === '-' || op === '-·') {
        result = Math.max(0, val1 - val2); // Monus clamp at 0
        opText = `-\u00B7 ${node.operand2}`;
      }
      
      vars[target] = result;
      
      yield {
        node: node,
        line: node.line,
        text: `${target} := ${node.operand1} ${opText} (Wert: ${result})`,
        vars: { ...vars }
      };
    }
  }
}
