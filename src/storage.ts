// src/storage.ts
import { state } from './state.js';
import { AppState } from './types.js';
import {
    initGrid,
    renderGrid,
    renderClues,
    decorateClues,
    startTimer,
    setStatus,
    collectUserGrid
} from './ui.js';

export function serializeState(): Partial<AppState> & { userGrid: (string | null)[][] } {
    return {
        gridSize: state.gridSize,
        solution: state.solution,
        numbers: state.numbers,
        clues: state.clues,
        meta: state.meta,
        userGrid: collectUserGrid(),
        timerStart: state.timerStart
    };
}

export function saveState() {
    try {
        localStorage.setItem('crosswordState', JSON.stringify(serializeState()));
        setStatus('Saved');
    } catch (e) {
        setStatus('Save failed');
    }
}

export function loadState() {
    try {
        const raw = localStorage.getItem('crosswordState');
        if (!raw) {
            setStatus('No saved puzzle');
            return;
        }
        const s = JSON.parse(raw);
        state.gridSize = s.gridSize || state.gridSize;

        initGrid(state.gridSize);

        state.solution = s.solution || state.solution;
        state.grid = s.solution || state.grid;
        state.numbers = s.numbers || {};
        state.clues = s.clues || { across: [], down: [] };
        state.meta = s.meta || state.meta;

        renderGrid();
        renderClues();
        decorateClues();

        const ug = s.userGrid || [];
        for (let r = 0; r < state.gridSize; r++) {
            for (let c = 0; c < state.gridSize; c++) {
                const inp = state.cells[r][c].inp;
                const v = ug[r] && ug[r][c];
                if (!inp.disabled) {
                    inp.value = v || '';
                }
            }
        }
        setStatus('Loaded');
        if (s.timerStart) {
            state.timerStart = s.timerStart;
            startTimer();
        }
    } catch (e) {
        setStatus('Load failed');
    }
}

export function exportJson() {
    try {
        const blob = new Blob([JSON.stringify(serializeState(), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'crossword.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setStatus('Exported JSON');
    } catch (e) {
        setStatus('Export failed');
    }
}

export function importJsonFile(file: File) {
    const r = new FileReader();
    r.onload = () => {
        try {
            localStorage.setItem('crosswordState', String(r.result));
            loadState();
        } catch (e) {
            setStatus('Import failed');
        }
    };
    r.readAsText(file);
}

export function copyLink() {
    try {
        const data = { entries: state.entries, gridSize: state.gridSize };
        const enc = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(data)))));
        const url = `${location.origin}${location.pathname}?list=${enc}`;
        navigator.clipboard.writeText(url);
        setStatus('Link copied');
    } catch (e) {
        setStatus('Copy failed');
    }
}
