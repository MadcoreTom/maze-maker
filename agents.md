This document describes this MazeMaker project to AI agents.

This project generates a dungeon (or maze) via progressive phases, using classes that extend `LayerLogic`.
There's heavy use of generators so that the progress can be visualised.
Another design goal is to reduce runtime imports (dev dependencies are fine). 

* `Array2` is a 2D array type
* `XY` is a 2D point

# Layer Logic

Each layer implements the `LayerLogic` interface and provides:
- `apply()`: Generator that performs the agent's work
- `render()`: Renders the agent's results
- `name`: Display name for the UI

and the super constructor defines the UI components. Web Components are used.

# Code style

The project uses Biome for linting and formatting.

# Making changes

Any time changes are made
1. Append a bullet point to `agent-changes.md` describing the change in one line (and maybe the prompt in blockquotes if needed)
2. Add child bullet points listing the files changed
