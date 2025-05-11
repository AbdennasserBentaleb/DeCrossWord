// src/main.ts
import { state } from './state.js';
import { generate, parseInput, normalizeGerman } from './generator.js';
import {
    initUIElements,
    collectUserGrid,
    forEachSpanCell,
    getEntrySpan,
    findFirstEmptyInSpan,
    formatTime,
    stopTimer,
    setStatus,
    renderKeyboard
} from './ui.js';
import { pronounceActive } from './audio.js';
import { saveState, loadState, exportJson, importJsonFile, copyLink } from './storage.js';
import { CrosswordEntry } from './types.js';

document.addEventListener('DOMContentLoaded', () => {
    initUIElements();
    renderKeyboard();

    const wordInput = document.getElementById('wordInput') as HTMLTextAreaElement | null;
    const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement | null;
    const checkBtn = document.getElementById('checkBtn') as HTMLButtonElement | null;
    const checkWordBtn = document.getElementById('checkWordBtn') as HTMLButtonElement | null;
    const checkLetterBtn = document.getElementById('checkLetterBtn') as HTMLButtonElement | null;
    const revealClueBtn = document.getElementById('revealClueBtn') as HTMLButtonElement | null;
    const revealLetterBtn = document.getElementById('revealLetterBtn') as HTMLButtonElement | null;
    const hintBtn = document.getElementById('hintBtn') as HTMLButtonElement | null;
    const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement | null;
    const speakBtn = document.getElementById('speakBtn') as HTMLButtonElement | null;
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement | null;
    const loadBtn = document.getElementById('loadBtn') as HTMLButtonElement | null;
    const exportJsonBtn = document.getElementById('exportJsonBtn') as HTMLButtonElement | null;
    const printBtn = document.getElementById('printBtn') as HTMLButtonElement | null;
    const importJson = document.getElementById('importJson') as HTMLInputElement | null;
    const copyLinkBtn = document.getElementById('copyLinkBtn') as HTMLButtonElement | null;

    // Config toggles
    const gridSizeSel = document.getElementById('gridSize') as HTMLSelectElement | null;
    const allowIso = document.getElementById('allowIsolated') as HTMLInputElement | null;
    const themeToggle = document.getElementById('themeToggle') as HTMLInputElement | null;
    const textToggle = document.getElementById('textToggle') as HTMLInputElement | null;

    // Meta data
    const puzzleTitle = document.getElementById('puzzleTitle') as HTMLInputElement | null;
    const puzzleAuthor = document.getElementById('puzzleAuthor') as HTMLInputElement | null;
    const puzzleDate = document.getElementById('puzzleDate') as HTMLInputElement | null;

    // Form mechanics
    const formBody = document.getElementById('formBody') as HTMLTableSectionElement | null;
    const addRowBtn = document.getElementById('addRowBtn') as HTMLButtonElement | null;
    const clearRowsBtn = document.getElementById('clearRowsBtn') as HTMLButtonElement | null;
    const importCsv = document.getElementById('importCsv') as HTMLInputElement | null;

    function addRow(word = '', clue = '') {
        if (!formBody) return;
        const tr = document.createElement('tr');
        const tdW = document.createElement('td');
        const tdC = document.createElement('td');
        const tdX = document.createElement('td');
        const inW = document.createElement('input');
        const inC = document.createElement('input');
        const rm = document.createElement('button');
        inW.value = word;
        inC.value = clue;
        rm.textContent = 'Remove';
        rm.className = 'remove';
        rm.onclick = () => tr.remove();
        tdW.appendChild(inW);
        tdC.appendChild(inC);
        tdX.appendChild(rm);
        tr.appendChild(tdW);
        tr.appendChild(tdC);
        tr.appendChild(tdX);
        formBody.appendChild(tr);
    }

    function clearRows() {
        if (formBody) formBody.innerHTML = '';
    }

    function collectFormEntries(): CrosswordEntry[] {
        if (!formBody) return [];
        const rows = [...formBody.querySelectorAll('tr')];
        return rows.map(tr => {
            const ins = tr.querySelectorAll('input');
            const w = normalizeGerman(ins[0].value || '').replace(/[^A-ZÄÖÜß]/g, '');
            const c = ins[1].value || '';
            return { word: w, clue: c };
        }).filter(x => x.word && /^[A-ZÄÖÜß]+$/.test(x.word));
    }

    function importCsvFile(file: File) {
        const r = new FileReader();
        r.onload = () => {
            const lines = String(r.result).split(/\r?\n/).filter(Boolean);
            for (const line of lines) {
                const parts = line.split(',');
                const w = (parts[0] || '').trim();
                const c = (parts[1] || '').trim();
                if (w) addRow(w, c);
            }
        };
        r.readAsText(file);
    }

    function check() {
        const user = collectUserGrid();
        let correct = 0, filled = 0;
        const n = state.gridSize;
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const sol = state.solution[r][c];
                const cell = state.cells[r][c].cell;
                const v = user[r][c];
                if (sol) {
                    if (v) {
                        filled++;
                        if (v === sol) {
                            correct++;
                            cell.classList.add('correct');
                            cell.classList.remove('wrong');
                        } else {
                            cell.classList.add('wrong');
                            cell.classList.remove('correct');
                        }
                    } else {
                        cell.classList.remove('correct', 'wrong');
                    }
                }
            }
        }
        setStatus(`Correct ${correct}/${filled}`);
        if (filled > 0 && correct === filled) {
            stopTimer();
            if (state.timerStart) {
                const secs = Math.floor((Date.now() - state.timerStart) / 1000);
                setStatus(`Correct ${correct}/${filled} — Completed in ${formatTime(secs)}`);
            }
        }
    }

    function checkCurrentWord() {
        const sel = state.selected;
        if (!sel || state.cells.length === 0) return;
        const dir = sel.dir as 'across' | 'down';
        const span = getEntrySpan(sel.r, sel.c, dir);
        let correct = 0, filled = 0;
        forEachSpanCell(span, (r: number, c: number) => {
            const sol = state.solution[r][c];
            const cell = state.cells[r][c].cell;
            const v = state.cells[r][c].inp.value || null;
            if (sol) {
                if (v) {
                    filled++;
                    if (v === sol) {
                        correct++;
                        cell.classList.add('correct');
                        cell.classList.remove('wrong');
                    } else {
                        cell.classList.add('wrong');
                        cell.classList.remove('correct');
                    }
                } else {
                    cell.classList.remove('correct', 'wrong');
                }
            }
        });
        setStatus(`Word ${correct}/${filled}`);
    }

    function checkCurrentLetter() {
        const sel = state.selected;
        if (!sel || state.cells.length === 0) return;
        const sol = state.solution[sel.r][sel.c];
        const cell = state.cells[sel.r][sel.c].cell;
        const v = state.cells[sel.r][sel.c].inp.value || null;
        if (sol) {
            if (v) {
                if (v === sol) {
                    cell.classList.add('correct');
                    cell.classList.remove('wrong');
                    setStatus('Letter correct');
                } else {
                    cell.classList.add('wrong');
                    cell.classList.remove('correct');
                    setStatus('Letter wrong');
                }
            } else {
                cell.classList.remove('correct', 'wrong');
                setStatus('Empty cell');
            }
        }
    }

    function revealCurrentLetter() {
        const sel = state.selected;
        if (!sel || state.cells.length === 0) return;
        const sol = state.solution[sel.r][sel.c];
        const inp = state.cells[sel.r][sel.c].inp;
        if (sol && !inp.disabled) {
            inp.value = sol;
            setStatus('Letter revealed');
        }
    }

    function revealCurrentClue() {
        const sel = state.selected;
        if (!sel || state.cells.length === 0) return;
        const dir = sel.dir as 'across' | 'down';
        const span = getEntrySpan(sel.r, sel.c, dir);
        forEachSpanCell(span, (r: number, c: number) => {
            const sol = state.solution[r][c];
            const inp = state.cells[r][c].inp;
            if (sol && !inp.disabled) {
                inp.value = sol;
            }
        });
        setStatus('Clue revealed');
        checkCurrentWord();
    }

    function hint() {
        const sel = state.selected;
        if (!sel || state.cells.length === 0) return;
        const dir = sel.dir as 'across' | 'down';
        const span = getEntrySpan(sel.r, sel.c, dir);
        let word = '';
        forEachSpanCell(span, (r: number, c: number) => {
            word += state.solution[r][c] || '';
        });
        const vowels = (word.match(/[AEIOUÄÖÜ]/g) || []).length;
        const firstPos = findFirstEmptyInSpan(span, dir);
        if (firstPos) {
            const sol = state.solution[firstPos.r][firstPos.c];
            state.cells[firstPos.r][firstPos.c].inp.value = sol || '';
            setStatus(`Hint: first letter filled, vowels=${vowels}`);
        } else {
            setStatus(`Hint: vowels=${vowels}`);
        }
    }

    function clearAll() {
        const n = state.gridSize;
        if (state.cells.length === 0) return;
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const inp = state.cells[r][c].inp;
                const cell = state.cells[r][c].cell;
                if (!inp.disabled) {
                    inp.value = '';
                }
                cell.classList.remove('correct', 'wrong');
            }
        }
        setStatus('');
    }

    // Event Bindings
    if (generateBtn) generateBtn.onclick = () => {
        let entries = collectFormEntries();
        if (!entries.length && wordInput) { entries = parseInput(wordInput.value); }
        if (!entries.length) { setStatus('Enter words and clues'); return; }
        generate(entries);
    };
    if (checkBtn) checkBtn.onclick = check;
    if (checkWordBtn) checkWordBtn.onclick = checkCurrentWord;
    if (checkLetterBtn) checkLetterBtn.onclick = checkCurrentLetter;
    if (revealClueBtn) revealClueBtn.onclick = revealCurrentClue;
    if (revealLetterBtn) revealLetterBtn.onclick = revealCurrentLetter;
    if (hintBtn) hintBtn.onclick = hint;
    if (speakBtn) speakBtn.onclick = pronounceActive;
    if (exportJsonBtn) exportJsonBtn.onclick = exportJson;
    if (printBtn) printBtn.onclick = () => window.print();
    if (importJson) importJson.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const f = target.files && target.files[0];
        if (f) importJsonFile(f);
    };
    if (copyLinkBtn) copyLinkBtn.onclick = copyLink;
    if (saveBtn) saveBtn.onclick = saveState;
    if (loadBtn) loadBtn.onclick = loadState;
    if (clearBtn) clearBtn.onclick = clearAll;

    if (gridSizeSel) gridSizeSel.onchange = () => state.gridSize = parseInt(gridSizeSel.value, 10);
    if (allowIso) allowIso.onchange = () => state.allowIsolated = allowIso.checked;
    if (addRowBtn) addRowBtn.onclick = () => addRow();
    if (clearRowsBtn) clearRowsBtn.onclick = clearRows;
    if (importCsv) importCsv.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const f = target.files && target.files[0];
        if (f) importCsvFile(f);
    };

    if (themeToggle) themeToggle.onchange = () => { document.body.classList.toggle('theme-light', themeToggle.checked); };
    if (textToggle) textToggle.onchange = () => { document.body.classList.toggle('text-large', textToggle.checked); };

    if (puzzleTitle) puzzleTitle.oninput = () => state.meta.title = puzzleTitle.value;
    if (puzzleAuthor) puzzleAuthor.oninput = () => state.meta.author = puzzleAuthor.value;
    if (puzzleDate) puzzleDate.oninput = () => state.meta.date = puzzleDate.value;

    // Initial state population
    if (wordInput) {
        wordInput.value = [
            'Haus : house', 'Baum : tree', 'lernen : to learn', 'Buch : book',
            'Straße : street', 'Fenster : window', 'Zeit : time', 'Wort : word',
            'sprechen : to speak', 'gehen : to go'
        ].join('\n');
    }

    if (location.search) {
        const params = new URLSearchParams(location.search);
        const list = params.get('list');
        if (list) {
            try {
                const data = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(list)))));
                if (Array.isArray(data.entries) && data.entries.length) {
                    generate(data.entries);
                }
                if (data.gridSize && gridSizeSel) {
                    gridSizeSel.value = String(data.gridSize);
                }
            } catch (e) { }
        }
    }
});
