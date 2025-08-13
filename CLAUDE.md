# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SVGEdit is a fast, web-based, JavaScript-driven SVG drawing editor that works in any modern browser. It consists of two major components:
- **@svgedit/svgcanvas**: The underlying SVG editor engine (can be used to build custom editors)
- **editor**: The UI layer with menus, buttons, and interface elements

## Development Commands

### Initial Setup
```bash
# Install dependencies
npm i

# Build svgcanvas dependency (required before running or building editor)
npm run build --workspace @svgedit/svgcanvas
```

### Development
```bash
# Start development server (http://localhost:8000/src/editor/index.html)
npm run start

# Run linting (StandardJS - no semicolons, 2-space indentation)
npm run lint

# Run tests (Cypress E2E and unit tests)
npm run test

# Build production bundle
npm run build
```

### Testing Single Test
```bash
# Run Cypress in interactive mode to run individual tests
npx cypress open
```

## High-Level Architecture

### Module Structure
- **Editor.js**: Main editor entry point, can be instantiated in any div element
- **EditorStartup.js**: Handles editor initialization and setup
- **MainMenu.js**: Menu system implementation
- **components/**: Custom web components for UI elements (buttons, inputs, etc.)
- **extensions/**: Plugin system for extending editor functionality
- **panels/**: UI panels (TopPanel, LeftPanel, BottomPanel, LayersPanel)
- **dialogs/**: Modal dialogs for various editor functions

### Extension System
The editor supports a plugin architecture through extensions. Extensions can:
- Add new tools and functionality
- Modify existing behavior
- Integrate with external services
- Add custom UI elements

Extensions are loaded dynamically and communicate with the editor through events.

### Event System
The editor uses an event-driven architecture for communication between modules. Key events include:
- Canvas events (drawing, selection, transformation)
- Tool state changes
- Document changes
- Extension events

### Canvas Architecture
The svgcanvas package handles all SVG manipulation and drawing operations. It provides:
- SVG DOM manipulation
- Path operations
- Transformation matrices
- History/undo system
- Selection management
- Layer management

## Code Standards

### Linting
- Uses StandardJS (no semicolons, 2-space indentation)
- Run `npm run lint` before committing

### Commit Messages
All commits must be prefixed with one of these types:
- `Security fix: `
- `Fix: ` or `Fix (<component>): `
- `Enhancement: `
- `Optimization: ` (for performance improvements)
- `Docs: `
- `Refactoring: `
- `Testing (<UI|Unit>): `
- `Build: `

### Testing
- Cypress for E2E and unit tests
- Visual regression tests for UI scenarios
- Tests located in `cypress/e2e/` and `cypress/unit/`
- Run all tests with `npm run test`

## Key Integration Points

### Embedding SVGEdit
The editor can be embedded in any web application:
```javascript
import Editor from './Editor.js'
const svgEditor = new Editor(document.getElementById('container'))
svgEditor.setConfig({
  allowInitialUserOverride: true,
  extensions: [],
  noDefaultExtensions: false,
  userExtensions: []
})
svgEditor.init()
```

### Canvas API
The svgcanvas can be used independently:
```javascript
import SvgCanvas from '@svgedit/svgcanvas'
const canvas = new SvgCanvas(container, config)
```

## Browser Support
- Modern browsers only (Chrome, Firefox, Safari, Edge)
- No IE11 or Opera Mini support
- Requires ES6+ module support

## Build System
- Rollup for bundling
- Babel for transpilation
- Multiple output formats (ES modules, IIFE)
- Workspaces for managing svgcanvas package