// src/state.ts
import { AppState } from './types.js';

export const state: AppState = {
    gridSize: 15,
    allowIsolated: false,
    entries: [],
    placed: [],
    grid: [],
    solution: [],
    cells: [],
    selected: null,
    timerStart: null,
    timerId: null,
    freq: {},
    numbers: {},
    clues: { across: [], down: [] },
    meta: {
        title: '',
        author: '',
        date: ''
    },
    voices: [],
    voice: null
};
