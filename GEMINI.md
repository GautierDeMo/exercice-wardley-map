# Gemini Context: Exercise Wardley Map

This document provides a comprehensive overview of the project's structure, technology stack, and development workflows to assist Gemini in understanding and contributing to the codebase.

## Project Overview

The **Exercise Wardley Map** project is a full-stack e-commerce application designed to implement complex business workflows, including cart management, order processing, and stock reservation. It serves as a practical implementation of various architectural patterns like Event Sourcing, the Outbox Pattern, and State Machines.

### Main Technologies

- **Frontend:** Vue.js 3 with Vite.
- **Backend:** Node.js with Express.js.
- **Database:** PostgreSQL managed via Prisma ORM.
- **Messaging:** RabbitMQ (utilizing the delayed message exchange plugin).
- **Caching/State:** Redis (for global promotion limits and counters).
- **State Management:** XState for order lifecycle management.
- **Testing:** Jest and Supertest.

### Architecture Highlights

- **Event Sourcing (Cart):** The cart's state is reconstructed by replaying events (e.g., `ITEM_ADDED`, `PROMO_APPLIED`) stored in the `CartEvent` table.
- **Outbox Pattern:** Ensures reliable message delivery to RabbitMQ by first persisting events in an `Outbox` table and then publishing them via a background worker.
- **Order State Machine:** Orders transition through various states (`Draft`, `Pending`, `Paid`, `Shipped`, etc.) governed by a formal XState machine.
- **Optimistic Locking:** Stock management uses a `version` field in the `Stock` table to prevent race conditions during concurrent updates.

---

## Getting Started

### Prerequisites

- Node.js & npm
- Docker and Docker Compose (for PostgreSQL, Redis, and RabbitMQ)

### Building and Running

#### 1. Infrastructure
Spin up the required services using Docker Compose:
```bash
docker-compose up -d
```

#### 2. Backend (Server)
Navigate to the `server` directory and install dependencies:
```bash
cd server
npm install
npx prisma migrate dev
npm run dev
```

#### 3. Frontend (Client)
Navigate to the `client` directory and install dependencies:
```bash
cd client
npm install
npm run dev
```

---

## Development Commands

### Server
- `npm start`: Runs the production server.
- `npm run dev`: Runs the server with `nodemon` for auto-reloading.
- `npm test`: Executes the test suite using `jest`.
- `npx prisma studio`: Opens the Prisma GUI to explore the database.

### Client
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.

---

## Development Conventions

### Structure
- **Modular Backend:** Logic is organized by domain in `server/src/modules/` (e.g., `cart`, `order`, `stock`).
- **Services:** Business logic resides in `.service.js` files within their respective modules.
- **Routes:** API endpoints are defined in `.routes.js` files.

### Testing
- **Unit Tests:** Located in `server/tests/unit/`, focusing on individual services and state machines.
- **Integration Tests:** Located in `server/tests/integration/`, focusing on database schemas, workers, and connectors.
- **Mocks:** Extensive use of `jest.mock` to isolate services and avoid external dependencies (like Redis or RabbitMQ) during unit tests.

### Event Handling
- When modifying state that affects other modules, always persist an event to the `Outbox` table rather than calling external services directly.
- The `outbox.worker.js` handles the actual publication of these events.
