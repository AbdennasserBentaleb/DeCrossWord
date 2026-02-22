// src/ui.ts
import { state } from './state.js';
import { pronounceText, pronounceActive } from './audio.js';
import { saveState } from './storage.js';

let gridEl: HTMLElement | null = null;

export function initUIElements() {
    gridEl = document.getElementById('grid');
}

export function initGrid(n: number) {
    state.grid = Array.from({ length: n }, () => Array(n).fill(null));
    state.solution = Array.from({ length: n }, () => Array(n).fill(null));
    if (gridEl) {
        gridEl.style.gridTemplateColumns = `repeat(${n}, 34px)`;
        gridEl.innerHTML = '';
    }
    state.cells = Array.from({ length: n }, () => Array(n));

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', `Row ${r + 1} Col ${c + 1}`);
            const num = document.createElement('div');
            num.className = 'num';
            const inp = document.createElement('input');
            inp.maxLength = 1;
            inp.dataset.r = r.toString();
            inp.dataset.c = c.toString();
            cell.appendChild(num);
            cell.appendChild(inp);
            if (gridEl) gridEl.appendChild(cell);
            state.cells[r][c] = { cell, num, inp };
        }
    }
}

export function numberAndClues() {
    state.numbers = {};
    state.clues = { across: [], down: [] };
    let num = 1;
    const n = state.gridSize;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const ch = state.grid[r][c];
            if (!ch) continue;
            const startAcross = (c === 0 || !state.grid[r][c - 1]) && (c + 1 < n && (state.grid[r][c + 1] || false));
            const startDown = (r === 0 || !state.grid[r - 1][c]) && (r + 1 < n && (state.grid[r + 1][c] || false));
            if (startAcross || startDown) {
                state.numbers[`${r},${c}`] = num;
                let wA = '', wD = '';
                if (startAcross) {
                    let cc = c;
                    let clue = '';
                    while (cc < n && state.grid[r][cc]) { wA += state.grid[r][cc]; cc++; }
                    const entry = state.placed.find(p => p.dir === 'across' && p.r === r && p.c === c && p.word === wA);
                    clue = entry ? entry.clue : '';
                    state.clues.across.push({ num, word: wA, clue, r, c });
                }
                if (startDown) {
                    let rr = r;
                    let clue = '';
                    while (rr < n && state.grid[rr][c]) { wD += state.grid[rr][c]; rr++; }
                    const entry = state.placed.find(p => p.dir === 'down' && p.r === r && p.c === c && p.word === wD);
                    clue = entry ? entry.clue : '';
                    state.clues.down.push({ num, word: wD, clue, r, c });
                }
                num++;
            }
        }
    }
}

export function renderSolution() {
    const n = state.gridSize;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            state.solution[r][c] = state.grid[r][c] || null;
        }
    }
}

export function decorateClues() {
    const acrossList = document.getElementById('acrossList');
    const downList = document.getElementById('downList');
    if (!acrossList || !downList) return;

    const aItems = acrossList.querySelectorAll('li');
    for (let i = 0; i < aItems.length; i++) {
        const play = document.createElement('span');
        play.className = 'play';
        play.textContent = '🔈';
        const w = state.clues.across[i]?.word || '';
        play.onclick = (ev) => { ev.stopPropagation(); pronounceText(w); };
        aItems[i].appendChild(play);
    }
    const dItems = downList.querySelectorAll('li');
    for (let i = 0; i < dItems.length; i++) {
        const play = document.createElement('span');
        play.className = 'play';
        play.textContent = '🔈';
        const w = state.clues.down[i]?.word || '';
        play.onclick = (ev) => { ev.stopPropagation(); pronounceText(w); };
        dItems[i].appendChild(play);
    }
}

export function renderGrid() {
    const n = state.gridSize;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const { cell, num, inp } = state.cells[r][c];
            const ch = state.grid[r][c];
            if (!ch) {
                cell.className = 'cell block';
                inp.disabled = true;
                inp.value = '';
                num.textContent = '';
            } else {
                cell.className = 'cell';
                inp.disabled = false;
                inp.value = '';
                const nlab = state.numbers[`${r},${c}`];
                num.textContent = nlab ? nlab.toString() : '';
            }
            inp.oninput = handleInput;
            inp.onfocus = () => selectCell(r, c);
            inp.ontouchstart = (e) => { e.preventDefault(); inp.focus(); };
            inp.onkeydown = handleKey;
        }
    }
}

export function renderClues() {
    const acrossList = document.getElementById('acrossList');
    const downList = document.getElementById('downList');
    const metaTitleEl = document.getElementById('metaTitle');
    const metaAuthorDateEl = document.getElementById('metaAuthorDate');

    if (acrossList) acrossList.innerHTML = '';
    if (downList) downList.innerHTML = '';
    if (metaTitleEl) metaTitleEl.textContent = state.meta.title ? state.meta.title : '';
    const ad = state.meta.author || state.meta.date ? `${state.meta.author ? `by ${state.meta.author}` : ''}${state.meta.author && state.meta.date ? ' — ' : ''}${state.meta.date || ''}` : '';
    if (metaAuthorDateEl) metaAuthorDateEl.textContent = ad;

    for (const a of state.clues.across) {
        const li = document.createElement('li');
        li.textContent = `${a.num}. ${a.clue || a.word} (${a.word.length})`;
        li.dataset.r = a.r.toString();
        li.dataset.c = a.c.toString();
        li.dataset.dir = 'across';
        li.onclick = () => focusEntry(a.r, a.c, 'across');
        if (acrossList) acrossList.appendChild(li);
    }
    for (const d of state.clues.down) {
        const li = document.createElement('li');
        li.textContent = `${d.num}. ${d.clue || d.word} (${d.word.length})`;
        li.dataset.r = d.r.toString();
        li.dataset.c = d.c.toString();
        li.dataset.dir = 'down';
        li.onclick = () => focusEntry(d.r, d.c, 'down');
        if (downList) downList.appendChild(li);
    }
}

export function selectCell(r: number, c: number) {
    state.selected = { r, c, dir: state.selected?.dir || 'across' };
    highlightSelected();
}

export function focusEntry(r: number, c: number, dir: 'across' | 'down') {
    state.selected = { r, c, dir };
    const list = dir === 'across' ? document.getElementById('acrossList') : document.getElementById('downList');
    if (list) {
        const liEls = list.querySelectorAll('li');
        liEls.forEach(li => {
            li.classList.toggle('active', li.dataset.r === r.toString() && li.dataset.c === c.toString());
        });
    }
    const span = getEntrySpan(r, c, dir);
    const pos = findFirstEmptyInSpan(span, dir) || { r, c };
    state.cells[pos.r][pos.c].inp.focus();
    highlightSelected();
}

export function highlightSelected() {
    const n = state.gridSize;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const cell = state.cells[r][c].cell;
            cell.classList.remove('correct', 'wrong', 'active-entry');
        }
    }
    if (!state.selected) return;
    const span = getEntrySpan(state.selected.r, state.selected.c, state.selected.dir as 'across' | 'down');
    forEachSpanCell(span, (rr, cc) => {
        state.cells[rr][cc].cell.classList.add('active-entry');
    });
}

export function getEntrySpan(r: number, c: number, dir: 'across' | 'down'): { r1: number, c1: number, r2: number, c2: number } {
    const n = state.gridSize;
    if (dir === 'across') {
        let sc = c;
        while (sc > 0 && state.grid[r][sc - 1]) sc--;
        let ec = c;
        while (ec < n && state.grid[r][ec]) ec++;
        return { r1: r, c1: sc, r2: r, c2: ec - 1 };
    } else {
        let sr = r;
        while (sr > 0 && state.grid[sr - 1][c]) sr--;
        let er = r;
        while (er < n && state.grid[er][c]) er++;
        return { r1: sr, c1: c, r2: er - 1, c2: c };
    }
}

export function forEachSpanCell(span: { r1: number, c1: number, r2: number, c2: number }, fn: (r: number, c: number) => void) {
    if (span.r1 === span.r2) {
        for (let cc = span.c1; cc <= span.c2; cc++) fn(span.r1, cc);
    } else {
        for (let rr = span.r1; rr <= span.r2; rr++) fn(rr, span.c1);
    }
}

export function findFirstEmptyInSpan(span: { r1: number, c1: number, r2: number, c2: number }, _dir?: 'across' | 'down'): { r: number, c: number } | null {
    if (span.r1 === span.r2) {
        for (let cc = span.c1; cc <= span.c2; cc++) {
            const inp = state.cells[span.r1][cc].inp;
            if (!inp.disabled && !inp.value) return { r: span.r1, c: cc };
        }
    } else {
        for (let rr = span.r1; rr <= span.r2; rr++) {
            const inp = state.cells[rr][span.c1].inp;
            if (!inp.disabled && !inp.value) return { r: rr, c: span.c1 };
        }
    }
    return null;
}

function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const v = target.value.toUpperCase();
    target.value = v.replace(/[^A-ZÄÖÜß]/g, '');
    const r = parseInt(target.dataset.r || '0', 10);
    const c = parseInt(target.dataset.c || '0', 10);
    const dir = state.selected?.dir || 'across';
    moveInEntry(r, c, dir, 1);
    saveState();
}

function handleKey(e: KeyboardEvent) {
    const target = e.target as HTMLInputElement;
    const r = parseInt(target.dataset.r || '0', 10);
    const c = parseInt(target.dataset.c || '0', 10);
    if (e.key === 'ArrowRight') { move(r, c, 0, 1); }
    else if (e.key === 'ArrowLeft') { move(r, c, 0, -1); }
    else if (e.key === 'ArrowDown') { move(r, c, 1, 0); }
    else if (e.key === 'ArrowUp') { move(r, c, -1, 0); }
    else if (e.key === 'Tab') { e.preventDefault(); toggleDir(); }
    else if (e.key === 'Enter') { e.preventDefault(); toggleDir(); }
    else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); pronounceActive(); }
    else if (e.key === 'Backspace') {
        e.preventDefault();
        const inp = state.cells[r][c].inp;
        if (inp.value) {
            inp.value = '';
        } else {
            const dir = state.selected?.dir || 'across';
            moveInEntry(r, c, dir, -1);
            if (state.selected) {
                const sinp = state.cells[state.selected.r][state.selected.c].inp;
                if (!sinp.disabled) sinp.value = '';
            }
        }
    }
    else if (e.key === 'Home') { e.preventDefault(); jumpToSpanEdge(r, c, state.selected?.dir || 'across', false); }
    else if (e.key === 'End') { e.preventDefault(); jumpToSpanEdge(r, c, state.selected?.dir || 'across', true); }
}

function moveInEntry(r: number, c: number, dir: 'across' | 'down', step: number) {
    const span = getEntrySpan(r, c, dir);
    if (dir === 'across') {
        let cc = c;
        while (true) {
            cc += step;
            if (cc < span.c1 || cc > span.c2) break;
            const t = state.cells[r][cc];
            if (!t.inp.disabled) { t.inp.focus(); state.selected = { r, c: cc, dir }; break; }
        }
    } else {
        let rr = r;
        while (true) {
            rr += step;
            if (rr < span.r1 || rr > span.r2) break;
            const t = state.cells[rr][c];
            if (!t.inp.disabled) { t.inp.focus(); state.selected = { r: rr, c, dir }; break; }
        }
    }
}

function jumpToSpanEdge(r: number, c: number, dir: 'across' | 'down', toEnd: boolean) {
    const span = getEntrySpan(r, c, dir);
    if (dir === 'across') {
        const cc = toEnd ? span.c2 : span.c1;
        const t = state.cells[r][cc];
        if (!t.inp.disabled) { t.inp.focus(); state.selected = { r, c: cc, dir }; }
    } else {
        const rr = toEnd ? span.r2 : span.r1;
        const t = state.cells[rr][c];
        if (!t.inp.disabled) { t.inp.focus(); state.selected = { r: rr, c, dir }; }
    }
}

function move(r: number, c: number, dr: number, dc: number) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= state.gridSize || nc >= state.gridSize) return;
    const target = state.cells[nr][nc];
    if (target.inp.disabled) return;
    target.inp.focus();
    const currentDir = state.selected?.dir || 'across';
    state.selected = { r: nr, c: nc, dir: currentDir };
}

function toggleDir() {
    if (!state.selected) return;
    state.selected.dir = state.selected.dir === 'across' ? 'down' : 'across';
    highlightSelected();
}

export function formatTime(secs: number): string {
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function startTimer() {
    const timerEl = document.getElementById('timer');
    stopTimer();
    state.timerStart = Date.now();
    if (timerEl) timerEl.textContent = '00:00';
    state.timerId = window.setInterval(() => {
        const secs = Math.floor((Date.now() - (state.timerStart || 0)) / 1000);
        if (timerEl) timerEl.textContent = `Time ${formatTime(secs)}`;
    }, 1000) as unknown as number;
}

export function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
}

export function setStatus(msg: string) {
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.textContent = msg;
}

export function collectUserGrid(): (string | null)[][] {
    const n = state.gridSize;
    const g: (string | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const inp = state.cells[r][c].inp;
            g[r][c] = inp.disabled ? null : (inp.value || null);
        }
    }
    return g;
}

export function renderKeyboard() {
    const vk = document.getElementById('virtualKeyboard');
    if (!vk) return;
    const layout = [
        ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Ü'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
        ['ENTER', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'ß', 'BACKSPACE']
    ];
    vk.innerHTML = '';
    layout.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'vk-row';
        row.forEach(key => {
            const keyEl = document.createElement('button');
            keyEl.className = 'vk-key';
            if (key === 'ENTER' || key === 'BACKSPACE') keyEl.classList.add('wide');
            keyEl.textContent = key === 'BACKSPACE' ? '⌫' : (key === 'ENTER' ? '↵' : key);
            keyEl.onclick = (e) => {
                e.preventDefault();
                handleVirtualKey(key);
            };
            rowEl.appendChild(keyEl);
        });
        vk.appendChild(rowEl);
    });
}

function handleVirtualKey(key: string) {
    const sel = state.selected;
    if (!sel || state.cells.length === 0) return;
    const { r, c } = sel;
    const target = state.cells[r][c];
    if (!target || target.inp.disabled) return;

    if (key === 'ENTER') {
        toggleDir();
    } else if (key === 'BACKSPACE') {
        if (target.inp.value) {
            target.inp.value = '';
        } else {
            const dir = sel.dir || 'across';
            moveInEntry(r, c, dir as 'across' | 'down', -1);
            if (state.selected) {
                const newSel = state.selected;
                const newTarget = state.cells[newSel.r][newSel.c];
                if (!newTarget.inp.disabled) newTarget.inp.value = '';
            }
        }
        saveState();
    } else {
        target.inp.value = key;
        const dir = sel.dir || 'across';
        moveInEntry(r, c, dir as 'across' | 'down', 1);
        saveState();
    }
}
