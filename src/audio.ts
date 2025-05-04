// src/audio.ts
import { state } from './state.js';
import { getEntrySpan, forEachSpanCell } from './ui.js';

export function loadVoices() {
    state.voices = speechSynthesis.getVoices();
    state.voice = state.voices.find(v => String(v.lang).toLowerCase().startsWith('de')) || null;
}

export function pronounceText(text: string) {
    if (!text) return;
    if (!state.voices || !state.voices.length) {
        loadVoices();
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.95;
    u.pitch = 1;
    if (state.voice) u.voice = state.voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
}

export function getActiveWord(): string {
    const sel = state.selected;
    if (!sel) return '';
    const span = getEntrySpan(sel.r, sel.c, sel.dir);
    let word = '';
    forEachSpanCell(span, (r, c) => {
        word += state.solution[r][c] || '';
    });
    return word;
}

export function pronounceActive() {
    const w = getActiveWord();
    if (w) pronounceText(w);
}

if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => loadVoices();
}
