# Project Context

## Stack
- TypeScript everywhere (frontend, backend, shared)
- Node.js (API/backend)
- React (frontend)
- Zod for API input validation
- REST API

## Environment Variables
- See .env.example for required variables

## Routes
- REST API endpoints (see BUILD_SPEC.md for details)
- Frontend routes: /dashboard, /wallet, /chat, etc.

## Conventions
- Use TypeScript for all code
- Zod validation for all API inputs
- Minimal changes per commit
- Only touch files specified in each task
- Add TODOs for unclear/missing requirements

## Do Not Refactor Rule
- Do NOT refactor unrelated code
- Only change what is required by the current task
