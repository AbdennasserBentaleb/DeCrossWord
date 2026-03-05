# German Learning Crossword Generator


A full client side dynamic German vocabulary crossword generator. Input German words and their English clues, and the application generates a playable puzzle.

## Features

* **Infinite Generation:** Dynamically builds a crossword puzzle tailored to your inputted word list.
* **Intelligent Placement Algorithm:** Custom scoring heuristic optimally places crossing words and detects unplaceable terms.
* **Type Safety:** Written in strict **TypeScript** for better maintainability.
* **Audio Pronunciation:** Integrates with the HTML5 Web Speech API to pronounce German words out loud.
* **Mobile Touch Support:** Custom responsive virtual keyboard for mobile devices rendering Ä, Ö, Ü, ß.
* **Save & Resume:** Puzzle progress is automatically saved to localStorage.
* **Import / Export:** Share puzzles via URL encoding, JSON exports, or CSV wordlists.
* **Theming:** Clean UI with both Light and Dark mode capabilities.

## How to Run & Test Locally

This application utilizes a modern Vite and TypeScript build pipeline.

### Prerequisites

* Node.js v16 or higher installed on your machine.
* Git installed on your machine.

### Installation

1. Clone the repository:

   ```bash
   git clone <your repo link here>
   cd crossword
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

1. **Input Vocabulary:** On the left panel add your German words and their English definitions. You can type them manually or paste a list formatted as Word : Clue or import a CSV.
   Note: Words must only contain alphabetical characters and valid German umlauts or eszett.
2. **Generate Puzzle:** Click **Generate**. The algorithm will intelligently overlap the words to create a crossword grid.
3. **Play:** Click on any cell in the grid to begin typing.
   * Use your physical keyboard or the on screen mobile virtual keyboard.
   * Use Arrow Keys to navigate the grid natively.
   * Use Tab or Enter to switch between Across and Down directions.
4. **Learning Tools:**
   * Click the audio icon next to any clue to hear the native German pronunciation.
   * Click **Hint** to reveal the first letter of the currently selected word.
   * Click **Check Word** or **Check Letter** to verify your spelling against the solution.
5. **Share:** Click **Copy Link** to share your current puzzle list with other students or teachers without needing a database.
