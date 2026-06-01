import { describe, it, expect, beforeEach } from 'vitest';
import { canPlace, scorePlacement } from './generator';
import { state } from './state';
import { initGrid } from './ui';

describe('Crossword Generator Heuristics', () => {
    beforeEach(() => {
        // Mock DOM element dependencies
        document.body.innerHTML = '<div id="grid"></div>';

        // Reset state
        state.gridSize = 5;
        initGrid(5);
        state.freq = { 'A': 2, 'B': 1 };
    });

    describe('canPlace', () => {
        it('should allow placing a valid horizontal word', () => {
            expect(canPlace('TEST', 0, 0, 'across')).toBe(true);
        });

        it('should block a horizontal word that exceeds grid bounds', () => {
            expect(canPlace('TESTING', 0, 0, 'across')).toBe(false);
            expect(canPlace('TEST', 0, 3, 'across')).toBe(false);
        });

        it('should allow overlapping a matching character', () => {
            state.grid[0][1] = 'E'; // Mock 'E' in grid
            expect(canPlace('TEST', 0, 0, 'across')).toBe(true);
        });

        it('should block overlapping conflicting characters', () => {
            state.grid[0][1] = 'X'; // Mock 'X' in grid
            expect(canPlace('TEST', 0, 0, 'across')).toBe(false);
        });

        it('should block parallel adjacent placements', () => {
            state.grid[0][0] = 'X';
            expect(canPlace('TEST', 1, 0, 'across')).toBe(false); // Can't drop right below parallel without sharing
        });
    });

    describe('scorePlacement', () => {
        it('should score intersecting placements higher than non-intersecting ones', () => {
            state.grid[2][2] = 'E';
            const intersectingScore = scorePlacement('TEST', 2, 1, 'across');

            // Re-init empty grid
            initGrid(5);
            const nonIntersectingScore = scorePlacement('TEST', 2, 1, 'across');

            expect(intersectingScore).toBeGreaterThan(nonIntersectingScore);
        });
    });
});
