## Phase : Exploration

### P1 - Choix de la stack et clarification des contraintes
**Prompt :**
> Hello there. We're going to start a project by using the wardley map method. The red chain and the blue chain. With the red one, we're going to chat and don't generate any code of this project. The only modification you'll need to do during this phase are in the PROMPTS.md file with the example in the DRAFT.md file. For now, we're not in any phase. I want you to suggest me three stacks with pros, cons, testability, or any criteria interesting to keep in mind. Knowing that for the front part, I am a good beginer with vue.js, and sometimes I use vanilla js instead of vue. For the back, I started PHP and Symfony, but I'm more confortable with js for back (I sometimes used Node, or Express). If you need more informations to search and compare, ask me before. Every time I ask you something. update the PROMPTS.md file with the example in the DRAFT.md file. And for this request, I will need you to update the "Stack" part of the DRAFT file when we'll choose the entire stack. I also have one question, what do you think about the third constraint "Un paiement peut être validé après expiration du stock réservé". If I understand clearly, even if the stock is not reserved, you can valid a payment. But is it not in opposition with the second constraint (Le stock doit être réservé atomiquement (pas de survente)) ? I think I misunderstand something, so if you think so, explain me this constraint please

**Résumé de la réponse :**
Explication de la contrainte "Paiement après expiration" comme étant un cas limite (race condition) et non une contradiction. Proposition de 3 stacks : MEVN (Express), NestJS (Structuré), et Fastify (Performance). Recommandation de NestJS pour l'aspect "micro-outils" ou Express pour la familiarité.

**Décision :**
À définir (Choix de la stack en attente).
