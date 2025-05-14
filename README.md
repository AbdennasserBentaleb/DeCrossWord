# German Learning Crossword Generator


Client-side German vocabulary crossword generator built with TypeScript and Vite. Uses a backtracking heuristic to calculate grid intersections for word lists.

![App Demo](demo.gif)
*Screen recording of puzzle generation and touch keyboard.*
## Features

* **Dynamic Generation:** Matches crossword puzzle to inputted word list.
* **Placement Algorithm:** Scoring heuristic places crossing words and flags unplaceable terms.
* **TypeScript:** Strict typing for application state.
* **Audio:** Uses HTML5 Web Speech API for German pronunciation.
* **Virtual Keyboard:** Touch-responsive keyboard rendering Ä, Ö, Ü, ß.
* **Persistence:** Progress saved to `localStorage`.
* **Import / Export:** Supports URL encoding, JSON, and CSV.
* **Theming:** Light and Dark modes.

## Architecture Decisions & Trade-offs

*   **Synchronous Generation:** The backtracking algorithm runs on the main thread. Performance degradation occurs for grids exceeding 50 words. Migration to Web Workers is planned.
*   **Vanilla TypeScript:** Eliminates external dependencies and reduces bundle size at the cost of manual DOM synchronization.
*   **Containerization:** Multi-stage Docker build running unprivileged Nginx (UID 65532). Implements read-only root filesystem and Actuator-compatible liveness/readiness endpoints for Kubernetes.


## How to Run & Test Locally

This application utilizes a modern Vite and TypeScript build pipeline.

### Prerequisites

* Docker Desktop (for one-click startup)
* Node.js v20+ (for local development)
* Git

### Quickstart (Docker)

To run the application in a hardened, unprivileged Nginx container:

```bash
docker-compose up -d --build
```
The application will be available at `http://localhost:8080`.

### Local Development Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/abdennasserbentaleb/DeCrossWord.git
   cd DeCrossWord
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the local development server:

   ```bash
   npm run dev
   ```

   The application will automatically open in your default browser at <http://localhost:3000>

### Running the Test Suite

The logic responsible for calculating intersection overlaps is covered by Vitest. To run tests:

```bash
npm run test
```

### Building for Production

To compile the TypeScript bundle into optimized static assets for deployment:

```bash
npm run build
```

## User Guide

1. **Input Vocabulary:** Add German words and definitions in the left panel (manual input, Word:Clue format, or CSV). Only alphabetical characters and German umlauts are supported.
2. **Generate Puzzle:** Click Generate.
3. **Play:** Click on any cell to begin typing. Use physical or virtual keyboard. Arrow keys navigate. Tab/Enter switch across and down directions.
4. **Learning Tools:** Audio icon for pronunciation, Hint for first letter, Check Word/Letter for validation.
5. **Share:** Copy Link for URL-encoded state sharing.
