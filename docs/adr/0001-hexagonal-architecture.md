# ADR-0001: Architecture hexagonale + CQS

## Statut

Accepté (hérité du template)

## Contexte

Le scaffold livre un service Lambda avec une logique métier qui va grossir. On veut pouvoir :

- Tester le domaine sans AWS (jest + fixtures, pas de SDK mock partout).
- Changer de techno de persistance (DynamoDB → RDS, etc.) sans réécrire le domaine.
- Séparer les écritures (commands) des lectures (queries) pour optimiser indépendamment.

## Options considérées

### Option 1 : Hexagonal + CQS via inversify (choix du template)

- `src/domain/*` pur, `src/adapters/*` remplaçables, bus Command/Query.
- Boundaries enforced par eslint-plugin-boundaries.
- DI via inversify, `backend-core` fournit `CommandBus`/`QueryBus` + decorators.

### Option 2 : Handlers Lambda directs, pas de bus

Plus simple mais la logique métier s'infiltre dans les handlers HTTP, casse le testing sans AWS, et couple fort les adapters.

## Décision

**Option 1** — pattern homogène avec les autres domaines Garance, enforcement automatique par lint, surface de test pure.

## Conséquences

- Domain et application testables 100 % en mémoire.
- Ajouter un use-case = un `Command`/`Query` + handler + binding `configureCqs`.
- Un peu plus de boilerplate au départ (3-4 fichiers par use-case) — amorti dès le 2e ou 3e use-case.
- Les boundaries bloquent les raccourcis : écrire du code qui importe `@aws-sdk/*` depuis `domain/` ne compile pas.
