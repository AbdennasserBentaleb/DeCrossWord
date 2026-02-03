/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        port: 3000,
        open: true
    },
    test: {
        environment: 'jsdom'
    }
});
