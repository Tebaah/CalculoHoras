# AGENTS.md

## Commands

```bash
npm run dev       # dev server at localhost:3000, auto-opens browser
npm run build     # production build -> dist/
npm run preview   # preview production build
```

No test, lint, or typecheck scripts exist. ESLint config (`.eslintrc.json`) is present but ESLint is not installed -- run manually with `npx eslint` if needed.

## Architecture

- **Pure vanilla JS ES modules** -- zero runtime dependencies, only `vite` as devDependency.
- **Clean architecture**: `src/core/` (pure domain logic, no DOM) -> `src/store/` (observer-pattern singleton + localStorage) -> `src/ui/` (DOM/events/rendering).
- `src/core/` must never import from `src/store/` or `src/ui/`.
- **Multi-page app**: 5 HTML entry points (`index.html`, `ordenes.html`, `reportes.html`, `pagos.html`, `historial.html`), each with a matching `src/<name>.js` entry. All pages duplicate the sidebar HTML inline -- they are not templated.

## Vite specifics

- **Path aliases** (defined in `vite.config.js`): `@core`, `@infrastructure`, `@store`, `@ui`, `@assets`.
- `@infrastructure` alias is defined but the directory does not exist -- do not use it.
- Multi-page build configured in `vite.config.js` `rollupOptions.input`. When adding a new page, update both the build input list and add the HTML + JS entry.
- CSS entry is `css/main.css` which uses `@import` to compose all modules.

## Cross-page communication

- `sessionStorage` key `editarRegistro` passes record data between pages (history -> edit in ordenes/reportes/pagos).
- URL query param `?editar=<indice>` triggers loading from `sessionStorage`.

## Business logic constraints

- All time calculations use **minutes from midnight** (0-1440); overnight shifts handled via modulus math in `src/core/utils/timeUtils.js`.
- Day-type rules (normal/Saturday/Sunday-holiday) determine surcharge and double-hour cutoffs -- see `src/core/constants.js`.
- Currency is CLP (Chilean Peso), locale `es-CL`.

## Project conventions

- Commit messages: `<type>(scope): <description>` (see `.clinerules/Commits Convencionales.md`).
- All UI text is in Spanish.
- The `pagos` page (payment states) exists but is not documented in README.
