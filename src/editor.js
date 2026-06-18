// Indents and formatting editor utilities

export function handleTabKey(textarea, e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    if (start === end) {
      // Simple 2-space indent
      textarea.value = val.substring(0, start) + "  " + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    } else {
      // Multi-line indent/outdent
      const lines = val.substring(start, end).split('\n');
      let newSelectionText = '';
      
      if (!e.shiftKey) {
        // Indent
        newSelectionText = lines.map(line => '  ' + line).join('\n');
        textarea.value = val.substring(0, start) + newSelectionText + val.substring(end);
        textarea.selectionStart = start;
        textarea.selectionEnd = start + newSelectionText.length;
      } else {
        // Outdent (Shift+Tab)
        newSelectionText = lines.map(line => {
          if (line.startsWith('  ')) return line.substring(2);
          if (line.startsWith(' ')) return line.substring(1);
          if (line.startsWith('\t')) return line.substring(1);
          return line;
        }).join('\n');
        textarea.value = val.substring(0, start) + newSelectionText + val.substring(end);
        textarea.selectionStart = start;
        textarea.selectionEnd = start + newSelectionText.length;
      }
    }
  }
}

export function autoFormatCode(rawCode) {
  const lines = rawCode.split('\n');
  let indentLevel = 0;
  const formattedLines = lines.map(line => {
    let trimmed = line.trim();
    
    if (trimmed.toUpperCase().startsWith('END')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    const space = '  '.repeat(indentLevel);
    let formattedLine = space + trimmed;
    
    if (trimmed.toUpperCase().startsWith('LOOP')) {
      indentLevel++;
    }
    
    return trimmed === '' ? '' : formattedLine;
  });
  
  return formattedLines.join('\n');
}

// Regex-based Syntax Highlighter (single-pass to avoid nested HTML corruption)
export function highlightCode(code) {
  // Escape HTML entities to prevent rendering issues
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Capturing groups:
  // Group 1: Comments (//...)
  // Group 2: Keywords (LOOP, DO, END)
  // Group 3: Assignment (:=)
  // Group 4: Numbers (digits)
  // Group 5: Variables (x0, x1, etc.)
  const regex = /(\/\/.*)|(\b(?:LOOP|DO|END)\b)|(:=)|(\b\d+\b)|(\bx\d+\b)/gi;

  return html.replace(regex, (match, p1, p2, p3, p4, p5) => {
    if (p1 !== undefined) {
      return `<span class="text-stone-400 italic">${p1}</span>`;
    }
    if (p2 !== undefined) {
      return `<span class="text-orange-600 font-bold">${p2}</span>`;
    }
    if (p3 !== undefined) {
      return `<span class="text-amber-600 font-bold">${p3}</span>`;
    }
    if (p4 !== undefined) {
      return `<span class="text-amber-700 font-semibold">${p4}</span>`;
    }
    if (p5 !== undefined) {
      return `<span class="text-orange-500 font-semibold">${p5}</span>`;
    }
    return match;
  });
}
