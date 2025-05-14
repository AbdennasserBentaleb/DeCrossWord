# System Architecture Design Document

**Project:** German Learning Crossword Application
**Version:** 1.0.0

## 1. Executive Summary

The German Learning Crossword Trainer is a client-side application that generates crossword puzzles from intersecting vocabulary words. It is built using TypeScript and Vite.

## 2. Distributed Module Flow

The application handles DOM manipulation directly via a centralized runtime state container (`state.ts`).

```mermaid
graph TD
    classDef core fill:#2a2a2a,stroke:#666,stroke-width:2px,color:#fff
    classDef module fill:#1a365d,stroke:#3182ce,stroke-width:2px,color:#fff
    classDef localDB fill:#276749,stroke:#48bb78,stroke-width:2px,color:#fff

    State("Global AppState Object<br/>(state.ts)"):::core
    
    Main["main.ts<br/>(Event Orchestrator)"]:::module
    Generator["generator.ts<br/>(Heuristics Logic)"]:::module
    UI["ui.ts<br/>(DOM Repainting & Forms)"]:::module
    Audio["audio.ts<br/>(Web Speech API)"]:::module
    Storage[("storage.ts<br/>(Persistence)")]:::localDB
    
    Main -->|Triggers calculate pass| Generator
    Generator -->|Writes mutated Placements| State
    Main -->|Calls re-render| UI
    State -->|Reads Solution/Cells| UI
    Main -->|Triggers TTS| Audio
    State -->|Reads Word strings| Audio
    
    UI -->|Keypress listener triggers manual save| Storage
    Storage -->|Serializes/Deserializes JSON| State
```

## 3. The `AppState` Container

The application utilizes strict TypeScript interfaces for state management. State prevents `any` references.

```mermaid
classDiagram
    class AppState {
      +Number gridSize
      +Boolean allowIsolated
      +List entries
      +List placed
      +Matrix grid
      +Matrix solution
      +Matrix cells
      +Object selected
      +Object freq
      +Object numbers
      +Object clues
      +Object meta
      +List voices
    }

    class CrosswordEntry {
      +String word
      +String clue
    }

    class PlacedWord {
      +Number r
      +Number c
      +String dir
    }

    AppState "1" *-- "*" CrosswordEntry : imports
    AppState "1" *-- "*" PlacedWord : places
```

## 4. Generator Algorithm

The generator logic resides in `generator.ts`.
This service determines overlapping X,Y coordinates for the vocabulary words using a backtracking algorithm.

### Algorithmic Pipeline

1. **Initialize State**: The `AppState` matrix is cleared to `null`.
2. **Frequency Map Generation**: `initCharFreq()` calculates a density map of letters.
3. **Primary Anchor Setting**: The longest word is placed in the center of the grid horizontally.
4. **Iteration**:
    * Unplaced words are evaluated against potential start coordinates.
    * `canPlace()` checks array bounds and character collisions.
    * Valid spots are ranked via `scorePlacement()`.

```mermaid
sequenceDiagram
    participant Index as HTML DOM
    participant Main as main.ts
    participant Gen as generator.ts
    participant State as state.ts
    
    Index->>Main: Click #generateBtn
    Main->>Main: Scrape form entries
    Main->>Gen: generate(entries)
    Gen->>State: initGrid()
    Gen->>Gen: Sort entries by highest length
    Gen->>State: Place primary length anchor at (7, 4)
    loop Every remaining input word
        loop Attempt row 0 to 15
            loop Attempt col 0 to 15
                Gen->>Gen: evaluate canPlace() boolean ruleset
                alt Spot Valid
                    Gen->>Gen: calculate heuristic scorePlacement()
                end
            end
        end
        Gen->>State: applyPlacement() at coordinate with highest density score
    end
    Gen->>Main: Generation Complete
```

## 5. Storage and Export Serialization

The application runs entirely client-side. Data serialization facilitates URL sharing and `localStorage` saving.

```mermaid
graph LR
    classDef obj fill:#4a5568,stroke:#a0aec0,stroke-width:2px,color:#fff
    classDef store fill:#6b46c1,stroke:#9f7aea,stroke-width:2px,color:#fff
    classDef action fill:#c53030,stroke:#fc8181,stroke-width:2px,color:#fff

    State[("Active Runtime AppState")]:::obj
    Serialized["Partial JSON:<br/>* Grid Size<br/>* Meta Data<br/>* Solution Array<br/>* User Input Array"]:::obj
    
    LocalStorage[("Local Storage")]:::store
    BTOA["URL Base64 Parameter"]:::action
    BLOB["JSON File Blob Export"]:::action
    
    State -- "serializeState()" --> Serialized
    Serialized --> LocalStorage
    Serialized --> BTOA
    Serialized --> BLOB
```

### Persistence Triggers

The state is persisted to `localStorage` via `saveState()` on the following actions:

* Physical keystrokes in `ui.ts` grid inputs.
* Virtual keyboard keystrokes via `renderKeyboard()`.
* Execution of `generate()`.
