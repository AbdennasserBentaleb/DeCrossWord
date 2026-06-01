// src/generator.ts
import { state } from './state.js';
import { CrosswordEntry } from './types.js';
import {
    initGrid,
    numberAndClues,
    renderSolution,
    renderGrid,
    renderClues,
    decorateClues,
    startTimer
} from './ui.js';

export function normalizeGerman(s: string): string {
    const u = (s || '').toLocaleUpperCase('de-DE');
    return u.replace(/ẞ/g, 'ß');
}

export function parseInput(text: string): CrosswordEntry[] {
    return text.split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => {
        const m = l.split(/\s*:\s*/);
        const w = normalizeGerman(m[0] || '').replace(/[^A-ZÄÖÜß]/g, '');
        return { word: w, clue: m[1] || '' };
    }).filter(x => /^[A-ZÄÖÜß]+$/.test(x.word));
}

export function canPlace(word: string, r: number, c: number, dir: 'across' | 'down'): boolean {
    const n = state.gridSize;
    if (dir === 'across') {
        if (c + word.length > n) return false;
        if (c > 0 && state.grid[r][c - 1]) return false;
        if (c + word.length < n && state.grid[r][c + word.length]) return false;
        for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            const cell = state.grid[r][c + i];
            if (cell && cell !== ch) return false;
            if (!cell) {
                if (r > 0 && state.grid[r - 1][c + i]) return false;
                if (r < n - 1 && state.grid[r + 1][c + i]) return false;
            }
        }
        return true;
    } else {
        if (r + word.length > n) return false;
        if (r > 0 && state.grid[r - 1][c]) return false;
        if (r + word.length < n && state.grid[r + word.length][c]) return false;
        for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            const cell = state.grid[r + i][c];
            if (cell && cell !== ch) return false;
            if (!cell) {
                if (c > 0 && state.grid[r + i][c - 1]) return false;
                if (c < n - 1 && state.grid[r + i][c + 1]) return false;
            }
        }
        return true;
    }
}

export function scorePlacement(word: string, r: number, c: number, dir: 'across' | 'down'): number {
    let overlaps = 0;
    let hooks = 0;
    let nonOverlap = 0;
    for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        if (dir === 'across') {
            if (state.grid[r][c + i] === ch) { overlaps++; }
            else if (!state.grid[r][c + i]) { hooks += state.freq[ch] || 0; nonOverlap++; }
        } else {
            if (state.grid[r + i][c] === ch) { overlaps++; }
            else if (!state.grid[r + i][c]) { hooks += state.freq[ch] || 0; nonOverlap++; }
        }
    }
    const n = state.gridSize;
    const center = Math.floor(n / 2);
    let dr, dc;
    if (dir === 'across') {
        dr = Math.abs(r - center);
        const mid = c + Math.floor(word.length / 2);
        dc = Math.abs(mid - center);
    } else {
        const mid = r + Math.floor(word.length / 2);
        dr = Math.abs(mid - center);
        dc = Math.abs(c - center);
    }
    const dist = dr + dc;
    const overlapBonus = overlaps * 20 + (overlaps >= 2 ? 10 : 0);
    const hookBonus = hooks * 0.2;
    const distPenalty = dist * 1.2;
    const fragPenalty = nonOverlap * 0.8;
    return overlapBonus + hookBonus - distPenalty - fragPenalty;
}

function applyPlacement(entry: CrosswordEntry, r: number, c: number, dir: 'across' | 'down') {
    for (let i = 0; i < entry.word.length; i++) {
        if (dir === 'across') { state.grid[r][c + i] = entry.word[i]; }
        else { state.grid[r + i][c] = entry.word[i]; }
    }
    state.placed.push({ ...entry, r, c, dir });
}

function initCharFreq(entries: CrosswordEntry[]) {
    state.freq = {};
    for (const e of entries) {
        for (const ch of e.word) {
            state.freq[ch] = (state.freq[ch] || 0) + 1;
        }
    }
}

function updateFreqForWord(word: string, delta: number) {
    for (const ch of word) {
        state.freq[ch] = (state.freq[ch] || 0) + delta;
        if (state.freq[ch] < 0) state.freq[ch] = 0;
    }
}

function filledRatio(): number {
    let filled = 0;
    const n = state.gridSize;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (state.grid[r][c]) filled++;
        }
    }
    return filled / (n * n);
}

export function generate(entries: CrosswordEntry[]) {
    const gridSizeSel = document.getElementById('gridSize') as HTMLSelectElement | null;
    const allowIso = document.getElementById('allowIsolated') as HTMLInputElement | null;
    if (gridSizeSel) state.gridSize = parseInt(gridSizeSel.value, 10);
    if (allowIso) state.allowIsolated = allowIso.checked;

    let fallback = false;

    function run() {
        initGrid(state.gridSize);
        state.entries = entries.slice().sort((a, b) => b.word.length - a.word.length);
        state.placed = [];
        initCharFreq(state.entries);

        // Place First
        if (!state.entries[0]) return;
        applyPlacement(
            { word: state.entries[0].word, clue: state.entries[0].clue },
            Math.floor(state.gridSize / 2),
            Math.max(0, Math.floor((state.gridSize - state.entries[0].word.length) / 2)),
            'across'
        );
        updateFreqForWord(state.entries[0].word, -1);

        // Iterative Placements
        for (let k = 1; k < state.entries.length; k++) {
            const e = state.entries[k];
            let best: { r: number, c: number, dir: 'across' | 'down' } | null = null;
            let bestScore = -1;
            for (let r = 0; r < state.gridSize; r++) {
                for (let c = 0; c < state.gridSize; c++) {
                    for (const dir of ['across', 'down'] as const) {
                        if (!canPlace(e.word, r, c, dir)) continue;
                        const s = scorePlacement(e.word, r, c, dir);
                        if (s > bestScore) {
                            bestScore = s;
                            best = { r, c, dir };
                        }
                    }
                }
            }
            if (best && bestScore > 0) {
                applyPlacement(e, best.r, best.c, best.dir);
                updateFreqForWord(e.word, -1);
            } else if (state.allowIsolated) {
                outer: for (let r = 0; r < state.gridSize; r++) {
                    for (let c = 0; c < state.gridSize; c++) {
                        for (const dir of ['across', 'down'] as const) {
                            if (canPlace(e.word, r, c, dir)) {
                                applyPlacement(e, r, c, dir);
                                updateFreqForWord(e.word, -1);
                                best = { r, c, dir };
                                break outer;
                            }
                        }
                    }
                }
            }
        }
    }

    run();

    if (filledRatio() < 0.28 && !fallback && entries.length > 0) {
        const longest = [...entries].sort((a, b) => b.word.length - a.word.length)[0].word.length;
        const target = Math.max(longest + 2, state.gridSize - 2);
        if (target !== state.gridSize) {
            state.gridSize = target;
            fallback = true;
            run();
        }
    }

    numberAndClues();
    renderSolution();
    renderGrid();
    renderClues();
    decorateClues();
    startTimer();
}
