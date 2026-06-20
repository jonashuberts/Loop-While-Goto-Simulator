// Indents and formatting editor utilities

export function handleTabKey(textarea, e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    // Find the start and end of the lines that contain the selection
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = val.indexOf('\n', end);
    if (lineEnd === -1) {
      lineEnd = val.length;
    }

    const selectedText = val.substring(lineStart, lineEnd);
    const lines = selectedText.split('\n');

    let newSelectionText = '';

    if (!e.shiftKey) {
      // Indent: add 2 spaces to the beginning of each line
      newSelectionText = lines.map(line => '  ' + line).join('\n');
      textarea.value = val.substring(0, lineStart) + newSelectionText + val.substring(lineEnd);
      
      // Adjust cursor positions
      if (start === end) {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      } else {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = end + (lines.length * 2);
      }
    } else {
      // Outdent (Shift+Tab): remove up to 2 spaces or 1 tab from the beginning of each line
      let firstLineRemovedCount = 0;
      let totalRemovedCount = 0;
      
      newSelectionText = lines.map((line, idx) => {
        let removed = 0;
        if (line.startsWith('  ')) {
          removed = 2;
        } else if (line.startsWith(' ')) {
          removed = 1;
        } else if (line.startsWith('\t')) {
          removed = 1;
        }
        
        if (idx === 0) {
          firstLineRemovedCount = removed;
        }
        totalRemovedCount += removed;
        return line.substring(removed);
      }).join('\n');
      
      textarea.value = val.substring(0, lineStart) + newSelectionText + val.substring(lineEnd);
      
      // Adjust cursor positions safely
      if (start === end) {
        const newCursorPos = Math.max(lineStart, start - firstLineRemovedCount);
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      } else {
        textarea.selectionStart = Math.max(lineStart, start - firstLineRemovedCount);
        textarea.selectionEnd = Math.max(lineStart, end - totalRemovedCount);
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
    
    if (trimmed.toUpperCase().startsWith('LOOP') || trimmed.toUpperCase().startsWith('WHILE')) {
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
  // Group 2: Keywords (LOOP, DO, END, WHILE, IF, GOTO)
  // Group 3: Assignment (:=)
  // Group 4: Numbers (digits)
  // Group 5: Variables (x0, x1, etc.)
  // Group 6: GOTO Labels (M0, M1, etc.)
  const regex = /(\/\/.*)|(\b(?:LOOP|DO|END|WHILE|IF|GOTO)\b)|(:=)|(\b\d+\b)|(\bx\d+\b)|(\bM\d+\b)/gi;

  return html.replace(regex, (match, p1, p2, p3, p4, p5, p6) => {
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
    if (p6 !== undefined) {
      return `<span class="text-emerald-600 font-bold">${p6}</span>`;
    }
    return match;
  });
}
