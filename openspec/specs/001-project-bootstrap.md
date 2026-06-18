# Spec: 001-project-bootstrap

## 1. Overview

Este documento especifica la configuración inicial del proyecto Derinator — estructura de carpetas, dependencias base, y tooling de desarrollo.

**Proyecto**: Derinator  
**Tipo**: Infrastructure / Bootstrap  
**Cambio**: 001-project-bootstrap

---

## 2. Estructura de Carpetas

### 2.1 Estructura del Monorepo

```
derinator/
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # Llamadas API
│   │   ├── types/            # Tipos TypeScript
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/               # Assets estáticos
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── routes/           # Endpoints API
│   │   ├── controllers/      # Controladores
│   │   ├── services/         # Lógica de negocio
│   │   ├── models/           # Modelos de datos
│   │   ├── db/                # Conexión y migraciones DB
│   │   ├── types/            # Tipos TypeScript
│   │   └── index.ts          # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── package.json              # Root (scripts shared)
├── .gitignore
├── .eslintrc.js
├── .prettierrc
└── jest.config.js
```

### 2.2 Convenciones de Nomenclatura

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Archivos | kebab-case | `game-screen.tsx` |
| Componentes React | PascalCase | `GameScreen.tsx` |
| Hooks | camelCase con `use` | `useGameState.ts` |
| Types/Interfaces | PascalCase | `CharacterProps.ts` |
| Rutas API | kebab-case | `/api/characters` |
| Variables | camelCase | `gameSession` |

---

## 3. Root Package.json

### 3.1 Configuración

```json
{
  "name": "derinator",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "npm run dev --workspace=frontend",
    "dev:backend": "npm run dev --workspace=backend",
    "build": "npm run build --workspaces",
    "build:frontend": "npm run build --workspace=frontend",
    "build:backend": "npm run build --workspace=backend",
    "test": "npm run test --workspaces",
    "test:frontend": "npm run test --workspace=frontend",
    "test:backend": "npm run test --workspace=backend",
    "lint": "npm run lint --workspaces",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\""
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 4. Frontend Configuration

### 4.1 Dependencias

**Production:**
- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.20.0

**Development:**
- typescript: ^5.3.0
- vite: ^5.0.0
- @vitejs/plugin-react-swc: ^4.0.0
- @types/react: ^18.2.0
- @types/react-dom: ^18.2.0

### 4.2 Vite Config

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
```

### 4.3 tsconfig.json Frontend

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 5. Backend Configuration

### 5.1 Dependencias

**Production:**
- express: ^4.18.0
- pg: ^8.11.0
- cors: ^2.8.5
- dotenv: ^16.3.0

**Development:**
- typescript: ^5.3.0
- @types/express: ^4.17.0
- @types/node: ^20.0.0
- @types/pg: ^8.10.0
- @types/cors: ^2.8.0
- ts-node-dev: ^2.0.0
- jest: ^29.7.0
- @types/jest: ^29.5.0
- ts-jest: ^29.1.0
- supertest: ^6.3.0
- @types/supertest: ^6.0.0

### 5.2 tsconfig.json Backend

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5.3 Backend Entry Point

```typescript
// backend/src/index.ts
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

---

## 6. Testing Configuration

### 6.1 Jest Config (Root)

```javascript
// jest.config.js
module.exports = {
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'backend/tsconfig.json' }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/backend/src/$1',
      },
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/frontend/**/*.test.{ts,tsx}'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'frontend/tsconfig.json' }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/frontend/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'frontend/src/**/*.{ts,tsx}',
    'backend/src/**/*.{ts}',
    '!frontend/src/**/*.d.ts',
    '!backend/src/**/*.d.ts',
  ],
}
```

### 6.2 Jest Setup

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
```

---

## 7. ESLint + Prettier

### 7.1 .eslintrc.js

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
}
```

### 7.2 .prettierrc

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

---

## 8. .gitignore

```
# Dependencies
node_modules/

# Build outputs
dist/
build/
*.tsbuildinfo

# Test coverage
coverage/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Runtime
pids/
*.pid
*.seed
```

---

## 9. Criterios de Aceptación

### 9.1 Infraestructura
- [ ] `npm install` instala todas las dependencias del workspace
- [ ] `npm run dev:frontend` levanta el servidor Vite en puerto 3000
- [ ] `npm run dev:backend` levanta el servidor Express en puerto 4000
- [ ] `npm run build` compila ambos proyectos sin errores
- [ ] `npm test` corre los tests de ambos proyectos

### 9.2 Frontend
- [ ] Vite servea index.html correctamente
- [ ] TypeScript compila sin errores en modo strict
- [ ] Alias `@/*` funciona en imports

### 9.3 Backend
- [ ] Express responde en `/api/health`
- [ ] TypeScript compila a `dist/`
- [ ] ts-node-dev permite hot-reload

### 9.4 Testing
- [ ] Jest detecta tests en ambos proyectos
- [ ] Testing Library está configurado para React
- [ ] Coverage se genera correctamente

### 9.5 Quality
- [ ] ESLint no tira errores en código limpio
- [ ] Prettier formatea correctamente
- [ ] Gitignore ignora node_modules, dist, coverage
