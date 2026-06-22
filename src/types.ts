export interface CrosswordEntry {
    word: string;
    clue: string;
}

export interface PlacedWord extends CrosswordEntry {
    r: number;
    c: number;
    dir: 'across' | 'down';
}

export interface Position {
    r: number;
    c: number;
    dir: 'across' | 'down';
}

export interface CellNode {
    inp: HTMLInputElement;
    cell: HTMLDivElement;
    num: HTMLDivElement;
}

export interface ClueItem {
    num: number;
    word: string;
    clue: string;
    r: number;
    c: number;
}

export interface AppState {
    gridSize: number;
    allowIsolated: boolean;
    entries: CrosswordEntry[];
    placed: PlacedWord[];
    grid: (string | null)[][];
    solution: (string | null)[][];
    cells: CellNode[][];
    selected: Position | null;
    timerStart: number | null;
    timerId: number | null;
    freq: Record<string, number>;
    numbers: Record<string, number>;
    clues: {
        across: ClueItem[];
        down: ClueItem[];
    };
    meta: {
        title: string;
        author: string;
        date: string;
    };
    voices: SpeechSynthesisVoice[];
    voice: SpeechSynthesisVoice | null;
}
