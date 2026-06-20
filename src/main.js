import { EXAMPLES } from './examples.js';
import { tokenize, parse } from './parser.js';
import { executeProgram } from './interpreter.js';
import { handleTabKey, autoFormatCode, highlightCode } from './editor.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const codeInput = document.getElementById('code-input');
  const lineGutter = document.getElementById('line-gutter');
  const charLineCount = document.getElementById('char-line-count');
  const formatBtn = document.getElementById('format-btn');
  const exampleSelect = document.getElementById('example-select');
  const programTypeSelect = document.getElementById('program-type-select');
  
  const highlightBackdrop = document.getElementById('highlight-backdrop');
  const highlightCodeElement = document.getElementById('highlight-code');
  
  const filenameInput = document.getElementById('filename-input');
  const filenameExtension = document.getElementById('filename-extension');
  const importBtn = document.getElementById('import-btn');
  const exportBtn = document.getElementById('export-btn');
  const fileInput = document.getElementById('file-input');
  
  const runBtn = document.getElementById('run-btn');
  const stepModeBtn = document.getElementById('step-mode-btn');
  const initialVarsContainer = document.getElementById('initial-vars');
  
  const debugControls = document.getElementById('debug-controls');
  const debugLineNum = document.getElementById('debug-line-num');
  const debugStepBtn = document.getElementById('debug-step-btn');
  const debugRunBtn = document.getElementById('debug-run-btn');
  const debugStopBtn = document.getElementById('debug-stop-btn');
  
  const errorOutput = document.getElementById('error-output');
  const resultBody = document.getElementById('result-body');
  const traceLog = document.getElementById('trace-log');
  const clearTraceBtn = document.getElementById('clear-trace-btn');

  // Tab Elements
  const tabInputsBtn = document.getElementById('tab-inputs-btn');
  const tabOutputsBtn = document.getElementById('tab-outputs-btn');
  const tabHelpBtn = document.getElementById('tab-help-btn');

  const tabInputsContent = document.getElementById('tab-inputs-content');
  const tabOutputsContent = document.getElementById('tab-outputs-content');
  const tabHelpContent = document.getElementById('tab-help-content');

  const DEFAULT_CODE = EXAMPLES.LOOP.addition;

  // State Management
  let userInitialValues = { x1: 3, x2: 4 };
  let debugState = {
    active: false,
    generator: null,
    vars: {},
    stepCount: 0,
    ast: null,
    nextLine: null
  };

  let currentMode = localStorage.getItem('loop_simulator_mode') || 'LOOP';
  programTypeSelect.value = currentMode;

  function updateExamplesDropdown(mode) {
    exampleSelect.innerHTML = '';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = 'Beispiel laden...';
    exampleSelect.appendChild(defaultOption);
    
    const examplesObj = EXAMPLES[mode];
    for (const key in examplesObj) {
      const option = document.createElement('option');
      option.value = key;
      
      let label = key;
      if (key === 'addition') label = 'Addition';
      else if (key === 'multiplication') label = 'Multiplikation';
      else if (key === 'exponentiation') label = 'Exponentiation';
      else if (key === 'predecessor') label = 'Vorgänger';
      else if (key === 'conditional') label = 'Bedingung';
      else if (key === 'parity') label = 'Parität';
      else if (key === 'subtraction') label = 'Subtraktion';
      
      let formula = '';
      if (mode === 'LOOP') {
        if (key === 'addition') formula = ' (x0 := x1 + x2)';
        else if (key === 'multiplication') formula = ' (x0 := x1 * x2)';
        else if (key === 'exponentiation') formula = ' (x0 := x1 ^ x2)';
        else if (key === 'predecessor') formula = ' (x0 := x1 - 1)';
        else if (key === 'conditional') formula = ' (IF x1 > 0 THEN x0 := x2)';
      } else if (mode === 'WHILE') {
        if (key === 'addition') formula = ' (x0 := x1 + x2)';
        else if (key === 'multiplication') formula = ' (x0 := x1 * x2)';
        else if (key === 'parity') formula = ' (x0 := x1 mod 2)';
      } else if (mode === 'GOTO') {
        if (key === 'addition') formula = ' (x0 := x1 + x2)';
        else if (key === 'multiplication') formula = ' (x0 := x1 * x2)';
        else if (key === 'subtraction') formula = ' (x0 := x1 -· x2)';
      }
      
      option.textContent = `${label}${formula}`;
      exampleSelect.appendChild(option);
    }
  }

  function updateHelpTabs(mode) {
    const helpLoop = document.getElementById('help-loop');
    const helpWhile = document.getElementById('help-while');
    const helpGoto = document.getElementById('help-goto');
    
    if (helpLoop) helpLoop.classList.add('hidden');
    if (helpWhile) helpWhile.classList.add('hidden');
    if (helpGoto) helpGoto.classList.add('hidden');
    
    if (mode === 'LOOP' && helpLoop) helpLoop.classList.remove('hidden');
    else if (mode === 'WHILE' && helpWhile) helpWhile.classList.remove('hidden');
    else if (mode === 'GOTO' && helpGoto) helpGoto.classList.remove('hidden');
  }

  function loadModeState(mode) {
    const savedCode = localStorage.getItem(`loop_simulator_code_${mode}`);
    if (savedCode !== null) {
      codeInput.value = savedCode;
    } else {
      const defaultExampleKey = Object.keys(EXAMPLES[mode])[0];
      codeInput.value = EXAMPLES[mode][defaultExampleKey];
    }
    
    const savedFilename = localStorage.getItem(`loop_simulator_filename_${mode}`);
    if (savedFilename !== null) {
      filenameInput.value = savedFilename;
    } else {
      const defaultExampleKey = Object.keys(EXAMPLES[mode])[0];
      filenameInput.value = defaultExampleKey;
    }
    
    if (filenameExtension) {
      filenameExtension.textContent = `.${mode.toLowerCase()}`;
    }
    
    updateLineNumbers();
    triggerVarDetection();
    updateHighlight();
    updateExamplesDropdown(mode);
    updateHelpTabs(mode);
  }

  // Load initial state
  loadModeState(currentMode);

  programTypeSelect.addEventListener('change', (e) => {
    // Save state of previous mode
    localStorage.setItem(`loop_simulator_code_${currentMode}`, codeInput.value);
    localStorage.setItem(`loop_simulator_filename_${currentMode}`, filenameInput.value);
    
    currentMode = e.target.value;
    localStorage.setItem('loop_simulator_mode', currentMode);
    
    loadModeState(currentMode);
    resetOutputUI();
    exitDebugMode();
    switchTab('inputs');
  });

  // --- TAB NAVIGATION ---

  function switchTab(tab) {
    // Hide all contents
    tabInputsContent.classList.add('hidden');
    tabOutputsContent.classList.add('hidden');
    tabHelpContent.classList.add('hidden');

    // Reset buttons to inactive style
    [tabInputsBtn, tabOutputsBtn, tabHelpBtn].forEach(btn => {
      btn.classList.remove('border-orange-500', 'text-orange-600');
      btn.classList.add('border-transparent', 'text-stone-400', 'hover:text-stone-600');
    });

    // Set active styles & show content
    if (tab === 'inputs') {
      tabInputsContent.classList.remove('hidden');
      tabInputsBtn.classList.add('border-orange-500', 'text-orange-600');
      tabInputsBtn.classList.remove('border-transparent', 'text-stone-400', 'hover:text-stone-600');
    } else if (tab === 'outputs') {
      tabOutputsContent.classList.remove('hidden');
      tabOutputsBtn.classList.add('border-orange-500', 'text-orange-600');
      tabOutputsBtn.classList.remove('border-transparent', 'text-stone-400', 'hover:text-stone-600');
    } else if (tab === 'help') {
      tabHelpContent.classList.remove('hidden');
      tabHelpBtn.classList.add('border-orange-500', 'text-orange-600');
      tabHelpBtn.classList.remove('border-transparent', 'text-stone-400', 'hover:text-stone-600');
    }
  }

  tabInputsBtn.addEventListener('click', () => switchTab('inputs'));
  tabOutputsBtn.addEventListener('click', () => switchTab('outputs'));
  tabHelpBtn.addEventListener('click', () => switchTab('help'));

  // --- EDITOR INTERACTIONS ---

  function updateLineNumbers() {
    const lines = codeInput.value.split('\n');
    const totalLines = Math.max(1, lines.length);
    let html = '';
    for (let i = 1; i <= totalLines; i++) {
      html += `<div id="gutter-line-${i}">${i}</div>`;
    }
    lineGutter.innerHTML = html;
    lineGutter.scrollTop = codeInput.scrollTop;
    
    const totalChars = codeInput.value.length;
    charLineCount.textContent = `Zeilen: ${totalLines} | Zeichen: ${totalChars}`;
  }

  function updateHighlight() {
    highlightCodeElement.innerHTML = highlightCode(codeInput.value);
  }

  // Scroll Sync Gutter, Backdrop and Interactive Textarea
  codeInput.addEventListener('scroll', () => {
    lineGutter.scrollTop = codeInput.scrollTop;
    highlightBackdrop.scrollTop = codeInput.scrollTop;
    highlightBackdrop.scrollLeft = codeInput.scrollLeft;
  });

  codeInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      handleTabKey(this, e);
      updateLineNumbers();
      triggerVarDetection();
      updateHighlight();
      localStorage.setItem(`loop_simulator_code_${currentMode}`, codeInput.value);
    } else if (e.key === 'Enter') {
      // Auto-indent on Enter
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      const val = this.value;
      
      // Get leading spaces from current line
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = start;
      const currentLine = val.substring(lineStart, lineEnd);
      
      const leadingSpaces = currentLine.match(/^\s*/)[0];
      let indent = leadingSpaces;
      
      // If parent statement is LOOP DO or WHILE DO, increase indent by 2 spaces
      const trimmed = currentLine.trim().toUpperCase();
      if (trimmed.endsWith('DO') || trimmed.startsWith('LOOP') || trimmed.startsWith('WHILE')) {
        indent += '  ';
      }
      
      this.value = val.substring(0, start) + '\n' + indent + val.substring(end);
      this.selectionStart = this.selectionEnd = start + 1 + indent.length;
      
      updateLineNumbers();
      triggerVarDetection();
      updateHighlight();
      localStorage.setItem(`loop_simulator_code_${currentMode}`, this.value);
    }
  });

  codeInput.addEventListener('input', () => {
    updateLineNumbers();
    triggerVarDetection();
    updateHighlight();
    localStorage.setItem(`loop_simulator_code_${currentMode}`, codeInput.value);
  });

  formatBtn.addEventListener('click', () => {
    codeInput.value = autoFormatCode(codeInput.value);
    updateLineNumbers();
    updateHighlight();
    localStorage.setItem(`loop_simulator_code_${currentMode}`, codeInput.value);
  });

  exampleSelect.addEventListener('change', (e) => {
    const key = e.target.value;
    const modeExamples = EXAMPLES[currentMode];
    if (modeExamples && modeExamples[key]) {
      codeInput.value = modeExamples[key];
      filenameInput.value = key; // Default filename to example key name
      updateLineNumbers();
      triggerVarDetection();
      updateHighlight();
      resetOutputUI();
      exitDebugMode();
      switchTab('inputs');
      localStorage.setItem(`loop_simulator_code_${currentMode}`, codeInput.value);
      localStorage.setItem(`loop_simulator_filename_${currentMode}`, key);
    }
  });

  // Autosave filename changes
  filenameInput.addEventListener('input', () => {
    localStorage.setItem(`loop_simulator_filename_${currentMode}`, filenameInput.value);
  });

  // --- FILE IMPORT / EXPORT (LOAD & SAVE) ---

  // Export (Speichern) using modern File System Access API
  exportBtn.addEventListener('click', async () => {
    const code = codeInput.value;
    const rawName = filenameInput.value.trim();
    const sanitizedName = rawName.replace(/[^a-zA-Z0-9_\-]/g, '') || 'programm';
    
    // Check if File System Access API is supported (Chrome, Edge, Opera)
    if ('showSaveFilePicker' in window) {
      try {
        const options = {
          suggestedName: `${sanitizedName}.${currentMode.toLowerCase()}`,
          types: [{
            description: `${currentMode}-Programmdateien`,
            accept: {
              'text/plain': [`.${currentMode.toLowerCase()}`, '.loop', '.txt'],
            },
          }],
        };
        const handle = await window.showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(code);
        await writable.close();
        
        // Update filename with the chosen file name
        const lastDot = handle.name.lastIndexOf('.');
        const nameWithoutExt = lastDot !== -1 ? handle.name.substring(0, lastDot) : handle.name;
        filenameInput.value = nameWithoutExt;
        localStorage.setItem(`loop_simulator_filename_${currentMode}`, nameWithoutExt);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Speicherfehler mit FS-API:', err);
          saveFileBlob(code, sanitizedName);
        }
      }
    } else {
      // Fallback for Safari, Firefox (Standard Blob Download)
      saveFileBlob(code, sanitizedName);
    }
  });

  // Fallback download method
  function saveFileBlob(code, name) {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.${currentMode.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import (Laden) local file trigger
  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Extract file name without extension
    const nameWithExtension = file.name;
    const lastDotIndex = nameWithExtension.lastIndexOf('.');
    const filenameWithoutExtension = lastDotIndex !== -1 ? nameWithExtension.substring(0, lastDotIndex) : nameWithExtension;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      codeInput.value = content;
      filenameInput.value = filenameWithoutExtension;
      
      updateLineNumbers();
      triggerVarDetection();
      updateHighlight();
      resetOutputUI();
      exitDebugMode();
      switchTab('inputs');
      
      // Save code and filename to local storage
      localStorage.setItem(`loop_simulator_code_${currentMode}`, content);
      localStorage.setItem(`loop_simulator_filename_${currentMode}`, filenameWithoutExtension);
    };
    reader.readAsText(file);
    fileInput.value = ''; // Reset file input selector
  });

  // --- VARIABLE DETECTION ---

  function triggerVarDetection() {
    const code = codeInput.value;
    const regex = /\bx\d+\b/g;
    const matches = code.match(regex) || [];
    const detected = [...new Set(matches)];
    const vars = detected.filter(v => v !== 'x0');
    
    vars.sort((a, b) => {
      const numA = parseInt(a.substring(1), 10);
      const numB = parseInt(b.substring(1), 10);
      return numA - numB;
    });
    
    renderInitialVarInputs(vars);
  }

  function renderInitialVarInputs(vars) {
    if (vars.length === 0) {
      initialVarsContainer.innerHTML = '<div class="empty-vars-message text-center py-5 text-xs italic text-stone-400 bg-stone-50 border border-stone-200/50 rounded-lg">Erstelle Variablen (z.B. <code>x1</code>) im Editor, um Startwerte festzulegen.</div>';
      return;
    }
    
    let html = '';
    vars.forEach(v => {
      let val = 0;
      if (userInitialValues[v] !== undefined) {
        val = userInitialValues[v];
      } else if (v === 'x1') {
        val = 3;
        userInitialValues['x1'] = 3;
      } else if (v === 'x2') {
        val = 4;
        userInitialValues['x2'] = 4;
      }
      
      html += `
        <div class="var-input-group flex items-center justify-between p-2 bg-stone-100 border border-stone-200/60 rounded-lg" data-var="${v}">
          <div class="var-input-label font-mono text-xs font-bold text-orange-500 flex items-center gap-1.5">
            <span>${v}</span>
            <span class="var-input-label-suffix text-[9px] font-normal text-stone-400 font-sans">(Eingabe)</span>
          </div>
          <div class="var-val-wrapper flex items-center gap-1.5 text-stone-400">
            <span>=</span>
            <input type="number" class="var-input-field w-14 bg-white border border-stone-200 rounded py-0.5 px-1.5 text-center font-mono text-[11px] text-stone-800 outline-none focus:border-orange-500" value="${val}" min="0" data-var="${v}">
          </div>
        </div>
      `;
    });
    initialVarsContainer.innerHTML = html;
    
    initialVarsContainer.querySelectorAll('.var-input-field').forEach(input => {
      input.addEventListener('input', (e) => {
        const v = e.target.getAttribute('data-var');
        const val = parseInt(e.target.value, 10);
        userInitialValues[v] = isNaN(val) ? 0 : Math.max(0, val);
      });
    });
  }

  function getVarsForExecution() {
    const code = codeInput.value;
    const regex = /\bx\d+\b/g;
    const matches = code.match(regex) || [];
    const detected = [...new Set(matches)];
    
    const vars = { x0: 0 };
    detected.forEach(v => {
      if (v !== 'x0') {
        vars[v] = userInitialValues[v] !== undefined ? userInitialValues[v] : 0;
      }
    });
    return vars;
  }

  // --- UI RENDERING & CONTROLS ---

  function resetOutputUI() {
    errorOutput.classList.add('hidden');
    errorOutput.textContent = '';
    resultBody.innerHTML = '<tr><td colspan="3" class="empty-state text-center text-stone-400 italic py-4">Noch nicht ausgeführt.</td></tr>';
    traceLog.innerHTML = '<div class="trace-empty text-center py-12 text-xs italic text-stone-400 font-sans">Noch keine Ausführungsdaten.</div>';
    clearGutterHighlight();
  }

  function renderVariablesTable(vars) {
    resultBody.innerHTML = '';
    
    const sortedKeys = Object.keys(vars).sort((a, b) => {
      if (a === 'x0') return -1;
      if (b === 'x0') return 1;
      const numA = parseInt(a.substring(1), 10) || 0;
      const numB = parseInt(b.substring(1), 10) || 0;
      return numA - numB;
    });

    sortedKeys.forEach(key => {
      const tr = document.createElement('tr');
      const val = vars[key];
      
      let badge = '';
      if (key === 'x0') {
        badge = '<span class="var-type-badge output text-[9px] px-1.5 py-0.5 rounded font-sans text-emerald-700 bg-emerald-50 border border-emerald-100">Ergebnis (Ausgabe)</span>';
      } else if (userInitialValues[key] !== undefined) {
        badge = '<span class="var-type-badge input text-[9px] px-1.5 py-0.5 rounded font-sans text-orange-700 bg-orange-50 border border-orange-100">Startwert (Eingabe)</span>';
      } else {
        badge = '<span class="var-type-badge text-[9px] px-1.5 py-0.5 rounded font-sans text-stone-500 bg-stone-100 border border-stone-200">Hilfsvariable</span>';
      }
      
      tr.innerHTML = `
        <td class="p-2 font-mono"><code class="var-tag font-bold text-orange-500">${key}</code></td>
        <td class="p-2 font-mono font-semibold">${val}</td>
        <td class="p-2">${badge}</td>
      `;
      resultBody.appendChild(tr);
    });
  }

  let currentHighlightLine = null;
  function highlightLineInGutter(lineNum) {
    clearGutterHighlight();
    currentHighlightLine = lineNum;
    const lineEl = document.getElementById(`gutter-line-${lineNum}`);
    if (lineEl) {
      lineEl.classList.add('line-gutter-highlight');
    }
  }

  function clearGutterHighlight() {
    if (currentHighlightLine !== null) {
      const prevLine = document.getElementById(`gutter-line-${currentHighlightLine}`);
      if (prevLine) prevLine.classList.remove('line-gutter-highlight');
      currentHighlightLine = null;
    }
  }

  // Clear trace button event handler
  clearTraceBtn.addEventListener('click', () => {
    clearTraceLog();
  });

  function clearTraceLog() {
    traceLog.innerHTML = '<div class="trace-empty text-center py-12 text-xs italic text-stone-400 font-sans">Noch keine Ausführungsdaten.</div>';
  }

  function addTraceEntry(step, lineNum, text, stateVars, isLoop = false) {
    const empty = traceLog.querySelector('.trace-empty');
    if (empty) empty.remove();
    
    const div = document.createElement('div');
    div.className = `trace-line flex gap-2 p-1 px-2 rounded border-l-2 text-[10.5px] bg-white border-stone-200 ${isLoop ? 'border-l-orange-500 bg-orange-50/20' : 'border-l-amber-500'}`;
    
    const stateStr = Object.keys(stateVars)
      .sort((a, b) => {
        const numA = parseInt(a.substring(1), 10) || 0;
        const numB = parseInt(b.substring(1), 10) || 0;
        return numA - numB;
      })
      .map(k => `${k}=${stateVars[k]}`)
      .join(', ');
      
    div.innerHTML = `
      <span class="trace-step-num text-stone-400 min-w-[18px] text-right font-medium">#${step}</span>
      <span class="trace-code text-stone-700 flex-grow">[Z. ${lineNum}] ${text}</span>
      <span class="trace-state text-[9.5px] text-stone-400">(${stateStr})</span>
    `;
    traceLog.appendChild(div);
    traceLog.scrollTop = traceLog.scrollHeight;
  }

  // --- EXECUTION ---

  runBtn.addEventListener('click', () => {
    exitDebugMode();
    resetOutputUI();
    switchTab('outputs');
    
    try {
      const code = codeInput.value;
      const tokens = tokenize(code);
      const ast = parse(tokens, currentMode);
      const vars = getVarsForExecution();
      
      const gen = executeProgram(ast, vars, currentMode);
      let step = 0;
      let result = gen.next();
      
      while (!result.done) {
        step++;
        const stepData = result.value;
        const isLoopNode = stepData.node.type === 'LOOP' || stepData.node.type === 'WHILE';
        addTraceEntry(step, stepData.line, stepData.text, stepData.vars, isLoopNode);
        
        if (step > 100000) {
          throw new Error("Sicherheitsabbruch: Das Programm überschreitet 100.000 Ausführungsschritte.");
        }
        
        result = gen.next();
      }
      
      renderVariablesTable(vars);
      addTraceEntry(step + 1, '-', "Programm erfolgreich beendet", vars, false);
      const lastLine = traceLog.lastElementChild;
      if (lastLine) {
        lastLine.classList.add('border-l-emerald-500', 'bg-emerald-50/20');
        lastLine.querySelector('.trace-code').classList.add('text-emerald-700', 'font-semibold');
      }
      
    } catch (err) {
      errorOutput.textContent = err.message;
      errorOutput.classList.remove('hidden');
      
      const div = document.createElement('div');
      div.className = 'trace-line flex gap-2 p-1 px-2 rounded border-l-2 text-[10.5px] border-l-rose-500 bg-rose-50/20';
      div.innerHTML = `<span class="trace-step-num text-rose-400">!</span> <span class="trace-code text-rose-800 font-semibold">Fehler: ${err.message}</span>`;
      traceLog.appendChild(div);
    }
  });

  // --- DEBUGGER ---

  stepModeBtn.addEventListener('click', () => {
    if (debugState.active) {
      exitDebugMode();
      return;
    }
    
    resetOutputUI();
    switchTab('outputs');
    
    try {
      const code = codeInput.value;
      const tokens = tokenize(code);
      const ast = parse(tokens, currentMode);
      const vars = getVarsForExecution();
      
      debugState.active = true;
      debugState.generator = executeProgram(ast, vars, currentMode);
      debugState.vars = vars;
      debugState.stepCount = 0;
      debugState.ast = ast;
      
      runBtn.classList.add('hidden');
      stepModeBtn.classList.add('hidden');
      debugControls.classList.remove('hidden');
      
      renderVariablesTable(vars);
      runDebugStep();
      
    } catch (err) {
      errorOutput.textContent = err.message;
      errorOutput.classList.remove('hidden');
      exitDebugMode();
    }
  });

  function runDebugStep() {
    if (!debugState.active) return;
    
    const stepResult = debugState.generator.next();
    
    if (stepResult.done) {
      addTraceEntry(debugState.stepCount + 1, '-', "Debugger: Ausführung beendet", debugState.vars, false);
      const lastLine = traceLog.lastElementChild;
      if (lastLine) {
        lastLine.classList.add('border-l-emerald-500', 'bg-emerald-50/20');
        lastLine.querySelector('.trace-code').classList.add('text-emerald-700', 'font-semibold');
      }
      
      renderVariablesTable(debugState.vars);
      exitDebugMode();
      return;
    }
    
    debugState.stepCount++;
    const data = stepResult.value;
    
    highlightLineInGutter(data.line);
    debugLineNum.textContent = data.line;
    
    const isLoopNode = data.node.type === 'LOOP' || data.node.type === 'WHILE';
    addTraceEntry(debugState.stepCount, data.line, data.text, data.vars, isLoopNode);
    
    renderVariablesTable(data.vars);
  }

  debugRunBtn.addEventListener('click', () => {
    if (!debugState.active) return;
    
    try {
      let result = debugState.generator.next();
      while (!result.done) {
        debugState.stepCount++;
        const data = result.value;
        const isLoopNode = data.node.type === 'LOOP' || data.node.type === 'WHILE';
        addTraceEntry(debugState.stepCount, data.line, data.text, data.vars, isLoopNode);
        
        if (debugState.stepCount > 100000) {
          throw new Error("Sicherheitsabbruch: Das Programm überschreitet 100.000 Ausführungsschritte.");
        }
        
        result = debugState.generator.next();
      }
      
      addTraceEntry(debugState.stepCount + 1, '-', "Debugger: Ausführung beendet", debugState.vars, false);
      const lastLine = traceLog.lastElementChild;
      if (lastLine) {
        lastLine.classList.add('border-l-emerald-500', 'bg-emerald-50/20');
        lastLine.querySelector('.trace-code').classList.add('text-emerald-700', 'font-semibold');
      }
      
      renderVariablesTable(debugState.vars);
      exitDebugMode();
    } catch (err) {
      errorOutput.textContent = err.message;
      errorOutput.classList.remove('hidden');
      exitDebugMode();
    }
  });

  debugStepBtn.addEventListener('click', () => {
    runDebugStep();
  });

  debugStopBtn.addEventListener('click', () => {
    addTraceEntry(debugState.stepCount + 1, '-', "Debugger: Ausführung abgebrochen", debugState.vars, false);
    const lastLine = traceLog.lastElementChild;
    if (lastLine) {
      lastLine.classList.add('border-l-rose-500', 'bg-rose-50/20');
      lastLine.querySelector('.trace-code').classList.add('text-rose-800', 'font-semibold');
    }
    exitDebugMode();
  });

  function exitDebugMode() {
    debugState.active = false;
    debugState.generator = null;
    debugState.ast = null;
    
    debugControls.classList.add('hidden');
    runBtn.classList.remove('hidden');
    stepModeBtn.classList.remove('hidden');
    clearGutterHighlight();
  }
});
