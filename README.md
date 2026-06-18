<p align="center">
  <img src="frontend/public/favicon-192x192.png" alt="Derinator Logo" width="120" />
</p>

<h1 align="center">🎮 Derinator</h1>

<p align="center">
  <strong>Un juego de adivinanzas con inteligencia artificial que aprende de vos.</strong><br/>
  Pensá en un personaje, animal o persona famosa. Derinator te hace preguntas hasta adivinarlo.<br/>
  Si no lo conoce, podés enseñarle personajes nuevos.
</p>

<p align="center">
  <a href="https://derinator.vercel.app">
    <img src="https://img.shields.io/badge/🚀_Demo-Vercel-000?style=for-the-badge&logo=vercel" alt="Demo" />
  </a>
  <a href="https://derinator-api.onrender.com/api/health">
    <img src="https://img.shields.io/badge/⚙️_API-Render-2e7d32?style=for-the-badge&logo=render" alt="API" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Express-4-000?style=flat&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Tests-300+-4CAF50?style=flat" alt="Tests" />
</p>

---

## 📑 Tabla de contenido

- [✨ Features](#-features)
- [📐 Arquitectura](#-arquitectura)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [🧪 Testing](#-testing)
- [📊 Algoritmos](#-algoritmos)
- [🚢 Deploy](#-deploy)
- [🤔 Decisiones técnicas](#-decisiones-técnicas)
- [🎓 Qué aprendí](#-qué-aprendí)
- [🔮 Mejoras futuras](#-mejoras-futuras)

---

## ✨ Features

### 🎯 4 modos de juego

| Modo | Descripción |
|------|------------|
| **Adivinar** | Derinator hace preguntas hasta adivinar tu personaje. Categorías: Ficción, Famosos, Animales |
| **Invertido** | Los roles se invierten: vos preguntás, Derinator piensa en uno |
| **Aprender** | Cuando Derinator falla, le enseñás un personaje nuevo con un flujo guiado paso a paso |
| **Personaje del día** | Un personaje único por día, igual para todos (semilla determinística, sin servidor) |

### 🧠 Motor de juego

```
227 preguntas × 241 personajes × 5 opciones = millones de combinaciones posibles
```

- **Scoring ponderado** con entropía de Shannon para maximizar información por pregunta
- **100+ reglas de implicación** (forward-chaining en 5 pasadas)
- **300+ reglas de contradicción** para exclusión mutua
- **7 fases de selección** adaptativas según la cantidad de candidatos
- **Métricas de confianza** con umbrales dinámicos (5-10 preguntas mínimas)

### 🏆 Progresión

- **9 logros** con progreso persistente (Primera victoria, Racha de 3, Imparable, Adivino perfecto, etc.)
- **Hall of Fame**: Top 10 personajes adivinados + últimas 5 derrotas del Derinator
- **Estadísticas**: Racha actual, mejor racha, total de partidas, personaje más derrotado
- **Avatar con 7 emociones**: Pensando, confiado, sorprendido, preocupado, triunfante, derrotado, neutral

### 📱 PWA + Offline

- **Funciona 100% offline** — el juego completo vive en localStorage
- **Service Worker** con cache de red para la API (Workbox)
- **Sync automático** cuando hay conexión (merge strategy: MAX entre local y server)
- Indicador de estado de conexión en tiempo real

---

## 📐 Arquitectura

### Visión general

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  React 18 + Vite + TypeScript                           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Pages    │  │  Game    │  │  UI      │              │
│  │  Home     │  │  Engine  │  │  Avatar  │              │
│  │  Game     │←→│  Scoring │  │  Achieve │              │
│  │  Hall     │  │  Rules   │  │  Stats   │              │
│  │  Daily    │  │  Select  │  │  Footer  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│       ↕                                                │
│  ┌──────────────────────────────────────────┐           │
│  │  data/ (lógica de negocio, sin UI)       │           │
│  │  game/ → scoring, logics, rules, flows   │           │
│  │  stats/ → achievements, daily, persistence│          │
│  │  api/ → cliente HTTP                     │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API
┌─────────────────────┴───────────────────────────────────┐
│                      BACKEND                            │
│  Express + SQLite + TypeScript                          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Routes   │→ │  Domain  │← │  Infra   │              │
│  │  stats    │  │  Ports   │  │  SQLite  │              │
│  │  chars    │  │  Entities│  │  Repos   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  Arquitectura Hexagonal (Ports & Adapters)              │
│  Routes → Domain Ports ← Infrastructure                 │
└─────────────────────────────────────────────────────────┘
```

### Frontend: Organización por feature

```
src/
├── components/
│   ├── game/           # Game.tsx, useGame.ts, LearnMode, ReverseMode
│   ├── pages/          # Home, GamePage, HallOfFame, DailyCharacter
│   ├── ui/             # Achievements, Avatar, DerinatorAvatar, ErrorBoundary
│   └── layout/         # Footer, NetworkIndicator
├── data/
│   ├── game/           # Motor: scoring, logics, rules, validation
│   ├── stats/          # Persistencia: achievements, daily, hallOfFame
│   ├── characters/     # Base de datos (JSON: animales, personajes, famosos)
│   └── api/            # Cliente HTTP
└── types.ts            # Tipos compartidos
```

### Backend: Arquitectura Hexagonal

```
Routes → Domain Ports ← Infrastructure (SQLite)
```

| Capa | Qué contiene | Dependencias |
|------|-------------|--------------|
| **Domain** | Entidades + puertos (interfaces) | Ninguna |
| **Infrastructure** | Implementaciones SQLite de los puertos | Domain |
| **Routes** | Express routers | Domain (puertos) |
| **Middleware** | Rate limit, error handler | Express |
| **Validation** | Sanitización de input | Ninguna |

> **Por qué hexagonal?** Separar el domain de la infrastructure permite cambiar SQLite por PostgreSQL sin tocar una sola route. Los puertos documentan qué necesita el domain sin acoplar implementaciones.

---

## 🛠️ Tech Stack

<table>
<tr>
<td><strong>Frontend</strong></td>
<td>React 18 · Vite 5 · TypeScript 5 · React Router 6 · SWC · canvas-confetti</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>Express 4 · TypeScript 5 · SQLite (WAL mode) · dotenv · cors</td>
</tr>
<tr>
<td><strong>Testing</strong></td>
<td>Vitest · Testing Library · Playwright · Supertest · @vitest/coverage-v8</td>
</tr>
<tr>
<td><strong>Quality</strong></td>
<td>ESLint (max-warnings 0) · Prettier · TypeScript strict mode</td>
</tr>
<tr>
<td><strong>Deploy</strong></td>
<td>Vercel (frontend) · Render (backend) · npm workspaces (monorepo)</td>
</tr>
</table>

---

## 🚀 Quick Start

### Requisitos

- Node.js >= 18
- npm >= 9

### Instalación

```bash
# Clonar
git clone https://github.com/TU_USUARIO/derinator.git
cd derinator

# Instalar dependencias (npm workspaces instala todo junto)
npm install
```

### Desarrollo

```bash
# Correr frontend + backend en paralelo
npm run dev

# O por separado
npm run dev:frontend   # http://localhost:3000
npm run dev:backend    # http://localhost:4000
```

### Build & Test

```bash
npm run build    # Build de todos los workspaces
npm test         # Tests de todos los workspaces
npm run lint     # Lint de todos los workspaces
```

---

## 🧪 Testing

<table>
<tr>
<th>Capa</th><th>Runner</th><th>Archivos</th><th>Tests</th>
</tr>
<tr>
<td>Frontend unit/integration</td><td>Vitest (jsdom)</td><td>11</td><td>~265</td>
</tr>
<tr>
<td>Backend integration</td><td>Vitest + Supertest</td><td>4</td><td>~37</td>
</tr>
<tr>
<td>E2E</td><td>Playwright (Chromium)</td><td>2</td><td>~20</td>
</tr>
<tr>
<td><strong>Total</strong></td><td></td><td><strong>17</strong></td><td><strong>~322</strong></td>
</tr>
</table>

**Coverage thresholds**: Statements 80% · Branches 70% · Functions 80% · Lines 80%

### Estrategia de testing

- **Unit tests**: Funciones puras del motor de juego (scoring, logics, validation)
- **Integration tests**: Hooks de React con Testing Library + mocks de localStorage
- **API tests**: Supertest contra Express real con DB SQLite aislada (`derinator-test.db`)
- **E2E tests**: Playwright contra el app corriendo (flujo completo de juego)

```bash
npm test                              # Todos los tests
npx vitest run src/data/game/         # Solo el motor de juego
npx vitest run --reporter=verbose     # Output detallado
```

---

## 📊 Algoritmos

### Selección de preguntas (7 fases)

El motor selecciona la pregunta óptima según el estado del juego:

```
Fase 0    → Separar ficción vs realidad (pool mixto >10 candidatos)
Fase 0.5  → Forzar "¿Es Pokemon?" si hay ≥2 Pokemon
Fase 1    → Universo amplio (>10 candidatos)
Fase 1.5  → Drill-down de universo específico
Fase 1.6  → Tipo de Pokemon (si confirmó Pokemon)
Fase 2    → Categoría / rol / profesión / nacionalidad (4-10 candidatos)
Fase 3    → Fallback por entropía (pocos candidatos)
```

### Scoring ponderado

Cada respuesta se evalúa contra el candidato con pesos por tipo de pregunta:

```
┌─────────────────────────┬────────────────────┐
│ Tipo de match           │ Score              │
├─────────────────────────┼────────────────────┤
│ Match exacto            │ +peso              │
│ Contradicción directa   │ -peso × 1.2       │
│ Mismatch parcial        │ -peso × 0.6       │
│ Match parcial           │ +peso × 0.5       │
│ Probably agreement      │ +peso × 0.5       │
│ Default mismatch        │ -peso × 0.15      │
│ dont_know               │ Sin impacto        │
└─────────────────────────┴────────────────────┘

Pesos: Universe 2.5x · Role/Power 1.8x · Category 1.5x · Default 1.0x
```

### Motor de implicaciones (forward-chaining)

```javascript
// Ejemplo de reglas en acción:
// Jugador dice "Es Pokemon" →
//   implicación: "Es ficticio" = yes
//   implicación: "Es animal" = no
//   implicación: "Es humano" = no

// 100+ reglas en 5 pasadas:
// Pasada 1: Categorías (animal → vivo, humano → vivo, ficción → probablemente_no_vivo)
// Pasada 2: Universos (Pokemon → ficticio, Marvel → ficticio, etc.)
// Pasada 3: Nacionalidades (argentino → no americano, japonés → no americano, etc.)
// Pasada 4: Deportes (futbolista → no basquetbolista, etc.)
// Pasada 5: Género (mujer → no hombre, hombre → no mujer)
```

### Confianza adaptativa

```
Mínimo preguntas: 5 (normal) / 8 (pool de ficción pesada)
Gap dinámico:     0.40 → 0.30 → 0.20 (se relaja con más preguntas)
Score final:      60% confianza absoluta + 40% confianza relativa (gap al 2do)
```

---

## 🚢 Deploy

### Frontend (Vercel)

1. Crear cuenta en [vercel.com](https://vercel.com)
2. **New Project** → importar repo de GitHub
3. Configurar:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment variable:
   ```
   VITE_API_URL = https://derinator-api.onrender.com
   ```
5. Deployar

### Backend (Render)

1. Crear cuenta en [render.com](https://render.com)
2. **New → Web Service** → importar repo de GitHub
3. Configurar:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Environment variables:
   ```
   NODE_ENV = production
   DATABASE_PATH = /data/derinator.db
   CORS_ORIGIN = https://derinator.vercel.app
   ```
5. **Disks** → crear `derinator-data`, mount `/data`, 1GB
6. Deployar

> **Nota sobre SQLite en Render**: El plan gratuito tiene filesystem efímero (se borra en cada deploy). Con un disk persistente ($5/mes) los datos sobreviven. Para un portfolio, el plan gratuito es suficiente.

---

## 🤔 Decisiones técnicas

### ¿Por qué SQLite y no PostgreSQL?

| SQLite | PostgreSQL |
|--------|-----------|
| Sin setup externo | Requiere servidor separado |
| Un archivo = una DB | Configuración de usuarios/permisos |
| WAL mode para lecturas concurrentes | Mejor para miles de conexiones simultáneas |
| Perfecto para apps single-user | Overkill para un juego individual |

**Veredicto**: Para un juego donde un usuario juega contra sí mismo, SQLite es la opción correcta. Si escalara a multiplayer real-time, migraría a PostgreSQL.

### ¿Por qué arquitectura hexagonal?

```
// Sin hexagonal (acoplado):
routes/stats.ts → import { sqlite3 } from 'sqlite3'  // ❌ Hardcoded a SQLite

// Con hexagonal (desacoplado):
routes/stats.ts → import { PlayerStatsRepository } from '../domain/ports'  // ✅ Interfaz
```

- El domain no conoce la implementación de persistencia
- Los tests unitarios mockean puertos sin necesitar una DB real
- Cambiar de SQLite a PostgreSQL = implementar un nuevo repository, cero cambios en routes

### ¿Por qué localStorage + sync?

```
Jugador → localStorage (fuente de verdad) → sync → Server (backup)
              ↓                                    ↓
         Juega offline                     Merge strategy MAX
         0 latencia                       (gana el valor más alto)
```

- **Offline-first**: El juego funciona sin internet
- **Sync fire-and-forget**: No bloquea la UI, falla silenciosamente
- **Merge MAX**: Si local tiene 5 wins y server tiene 3, queda 5

### ¿Por qué Vite y no Create React App?

| Vite | CRA |
|------|-----|
| Dev server instantáneo (ESM) | Dev server lento (webpack bundling) |
| HMR en milliseconds | HMR en seconds |
| SWC compiler (10x más rápido que Babel) | Babel compiler |
| Build optimizado | Build más lento |

---

## 🎓 Qué aprendí

### Arquitectura de software
- **Arquitectura hexagonal** en la práctica: cómo los puertos desacoplan el domain de la infraestructura
- **Separación de capas** real: lógica de negocio en `data/`, UI en `components/`, infraestructura en `infrastructure/`
- **Barrel exports** para simplificar imports y crear APIs públicas por módulo

### Algoritmos
- **Entropía de Shannon** aplicada a selección de preguntas: la información máxima se obtiene cuando la respuesta divide los candidatos 50/50
- **Forward-chaining** para reglas de implicación: propagar conocimiento implícito a partir de respuestas explícitas
- **Scoring ponderado** con normalización: no todas las preguntas aportan la misma información

### Ingeniería de software
- **Testing en capas**: unit → integration → E2E, cada uno con su runner y scope
- **Monorepo con npm workspaces**: gestionar frontend + backend en un solo repo
- **PWA con Vite**: service worker, cache strategies, offline-first
- **Merge strategy MAX**: resolución de conflictos simple pero efectiva para sync local↔server

### Lo que me hubiera gustado saber antes
- SQLite WAL mode no es la panacea — tiene limitaciones con escrituras concurrentes
- `vi.doMock` con dynamic imports en Vitest es frágil — `vi.mock` a nivel de módulo es más confiable
- Los barrel exports pueden causar circular dependencies si no se cuida el orden
- Un README bueno vale más que 1000 líneas de código perfecto para un portfolio

---

## 🔮 Mejoras futuras

- [ ] **Autenticación** con JWT para separar stats por usuario
- [ ] **WebSockets** para juego multiplayer en tiempo real
- [ ] **Dashboard de estadísticas** con gráficos (Chart.js / Recharts)
- [ ] **CI/CD** con GitHub Actions (test + lint en cada push)
- [ ] **Logging estructurado** (pino/winston) en el backend
- [ ] **Migración a PostgreSQL** si el juego crece
- [ ] **Leaderboard global** con ranking de jugadores
- [ ] **Modo torneo** con límite de tiempo
- [ ] **IA mejorada** con embeddings para similitud de personajes

---

## 📁 Estructura del repo

```
derinator/
├── package.json              # Monorepo config (npm workspaces)
├── render.yaml               # Render deployment (backend)
├── README.md                 # Este archivo
│
├── frontend/                 # React 18 + Vite + TypeScript
│   ├── vercel.json           # Vercel deployment (SPA rewrites)
│   ├── src/
│   │   ├── components/       # UI por feature
│   │   ├── data/             # Lógica de negocio (sin UI)
│   │   └── types.ts          # Tipos compartidos
│   └── public/               # Favicon, manifest PWA
│
└── backend/                  # Express + SQLite + TypeScript
    └── src/
        ├── domain/           # Entidades + puertos
        ├── infrastructure/   # Repositorios SQLite
        ├── routes/           # Express routers
        ├── middleware/       # Rate limit, error handler
        └── validation/       # Sanitización de input
```

---

## 📝 Licencia

MIT

---

<p align="center">
  Hecho con ❤️ en Argentina 🇦🇷
</p>
