# Change: 001-project-bootstrap

## Metadata
- **Created**: 2026-06-04
- **Status**: proposed
- **Tags**: infrastructure, setup

## Intent
Bootstrap del monorepo Derinator con estructura base, configuraciones de build, y testing listo para usar.

## Scope
### In scope
- Estructura de carpetas /frontend y /backend
- package.json con scripts y dependencias base
- TypeScript config (tsconfig.json) en ambos lados
- ESLint + Prettier config
- Jest config base
- Git ignore básico

### Out of scope
- Lógica de negocio (API, componentes)
- Datos seed/characters
- Docker compose

## Approach
1. Crear package.json root con scripts workspaces
2. Crear package.json frontend con Vite + React + TypeScript
3. Crear package.json backend con Express + TypeScript
4. Configurar TypeScript paths (aliases)
5. Configurar Jest con coverage
6. Crear .gitignore que ignore node_modules, dist, coverage

## Rollback Plan
Eliminar los archivos creados y restaurar a estado anterior (carpetas vacías con src/).

## Affected Modules
- /frontend/package.json
- /backend/package.json
- /frontend/tsconfig.json
- /backend/tsconfig.json
- /frontend/vite.config.ts
- .eslintrc.js
- .prettierrc
- jest.config.js
- jest.setup.ts
- .gitignore

## Dependencies
Ninguna — proyecto nuevo desde cero.
