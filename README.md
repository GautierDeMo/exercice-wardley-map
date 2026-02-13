# Exercice Wardley Map - E-commerce App

Ce projet est une application e-commerce complète développée dans le cadre d'un exercice sur les Wardley Maps. Il met en œuvre des patterns architecturaux avancés pour répondre à des contraintes métier complexes (réservation de stock, expiration, promotions).

## 📋 Fonctionnalités & Workflow

Basé sur le périmètre défini dans `DRAFT.md` et implémenté au fil du journal `PROMPTS.md` :

1. **Gestion du Panier (Event Sourcing)** : Ajout d'articles et application de codes promo. L'état du panier est reconstruit à partir d'une suite d'événements.
2. **Commande & Paiement** : Tunnel d'achat avec machine à états stricte (XState).
3. **Réservation de Stock** : Mécanisme de verrouillage optimiste pour garantir l'atomicité et éviter la survente.
4. **Expiration des Réservations** : Libération automatique du stock après un délai (TTL) via RabbitMQ.
5. **Gestion des "Paiements Zombies"** : Gestion des cas où un paiement arrive après l'expiration de la réservation (État `Conflict`).
6. **Promotions** : Gestion des limites globales d'utilisation via Redis.
7. **Relance Panier** : Simulation d'envoi d'email pour les paniers abandonnés.

## 🛠 Stack Technique

* **Frontend** : Vue.js 3 (Vite)
* **Backend** : Node.js (Express)
* **Base de données** : PostgreSQL (via Prisma ORM)
* **Messaging** : RabbitMQ (avec plugin `delayed_message_exchange`)
* **Cache** : Redis

## 🏗 Architecture

Le backend suit une architecture de **Monolithe Modulaire** avec **Injection de Dépendances**.

* **Modules** (`server/src/modules/`) : Séparation par domaine (Cart, Order, Stock, Payment).
* **Workers** (`server/src/workers/`) : Processus d'arrière-plan pour la fiabilité (Outbox Pattern) et les tâches planifiées (Expiration).
* **Container** (`server/src/container.js`) : Gestion centralisée des dépendances.

### Patterns Clés

* **Event Sourcing** (Panier)
* **Outbox Pattern** (Fiabilité DB -> Messaging)
* **Optimistic Locking** (Concurrence Stock)
* **State Machine** (Cycle de vie Commande)

## 🚀 Installation et Démarrage

### Prérequis

* Node.js (v18+)
* Docker & Docker Compose

### 1. Infrastructure

Lancez les services externes (Postgres, RabbitMQ, Redis) :

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd server
cp .env.example .env # Assurez-vous que les variables correspondent à docker-compose
npm install
npx prisma migrate dev # Création des tables
npm run dev
```

Le serveur démarre sur `http://localhost:3000`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

## ✅ Tests

Le projet inclut des tests unitaires et d'intégration couvrant les invariants critiques.

```bash
cd server
npm test
```

## 📄 Documentation

* **PROMPTS.md** : Journal complet du développement, listant chaque prompt, décision et étape de refactoring (Red/Blue Chains).
* **DRAFT.md** : Brouillon initial des contraintes et du workflow.
