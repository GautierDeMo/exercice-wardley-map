# Draft

## Workflow

- Créer une commande à partir d'un panier
- Pouvoir appliquer des promos (codes ou remises automatiques)
- Réserver une quantité pendant le paiement pour bloquer cette unité de stock
- Gérer les transitions d'état de la commande (créée, payée, préparée, expédiée)
- Libérer le stock si paiement échoue ou expire
- Relancer les paniers abandonnés via un mail ou autre solution pertinente après 24h

## Contraintes à prendre en compte

- Une promo peut être incompatible avec une autre
- Le stock doit être réservé atomiquement (pas de survente)
- Un paiement peut être validé après expiration du stock réservé
- Les transitions d'état ont des règles métier (on ne peut expédier, sans avoir préparé la commande au préalable par exemple)

## Stack

- Frontend : Vue.js (Vite)
- Backend : Express.js
- Base de données : PostgreSQL (via Prisma ORM)

## Livrables du projet

- Le code source, en micro-outils composables
- Le journal des prompts, le fichier PROMPTS.md

  - Il faudra bien indiquer le numéro du prompt,
  - la phase de la Wardley map dans laquelle on se trouve (Décision, Hypothèse, Exploration, Conversation, Moldable, Modèle, Génération, Specific
Coding, Composition)
  - le prompt exact envoyé
  - un résumé de la réponse obtenu
  - la décision suite à l'échange (ce qui a été modifié, gardé, jeté...)

**Ex de format attendu :**

```markdown
## Phase : [nom de la phase]
### P1 - [titre court]
**Prompt :**
> [votre prompt exact ici]
**Résumé de la réponse :** [2-3 lignes]
**Décision :** [ce que vous en avez fait]
```

### Règles markdown du fichier PROMPT.md à ne pas oublier

- les headers ont des saut de ligne au dessus et en dessous d'eux
- globalement, il faut suivre les règles de markdownlint, de DavidAnson
