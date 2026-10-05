---
name: replace-example
description: Remplace l'exemple Pokemon livré par le scaffold par le vrai domaine (renommage des fichiers, ressources SAM, tests, docs). À utiliser une fois, au démarrage du domaine, ou quand on demande de « supprimer l'exemple Pokemon ».
---

# Remplacer l'exemple Pokemon

Demander d'abord le nom de l'aggregate réel et ses champs, et les cas d'usage à garder (création, lecture, consommation SQS).

## Fichiers de l'exemple

| Couche      | Fichiers                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domaine     | `src/domain/aggregates/pokemon.aggregate.ts`, `src/domain/errors/pokemon.errors.ts`, `src/domain/ports/pokemon.repository.port.ts`                         |
| Application | `src/application/commands/create-pokemon/`, `src/application/queries/get-pokemon/`                                                                         |
| Adapters    | `src/adapters/primary/serverless/{create-pokemon,get-pokemon,consume-pokemon-events}.ts`, `src/adapters/secondary/database/dynamodb/pokemon.repository.ts` |
| IoC         | `src/infrastructure/ioc/pokemon-{read,write}.module.ts`, `src/infrastructure/ioc/pokemon-persistence.ts`                                                   |
| Tests       | `test/unit/**/pokemon*`, `test/unit/**/*-pokemon*`, `test/integration/pokemon*.ts`                                                                         |
| SAM         | `PokemonTable`, `GetPokemonLambda`, `CreatePokemonLambda`, `ConsumePokemonEventsLambda`, leurs log groups, `PokemonEvents*Queue`, outputs `Pokemon*`       |

## Étapes

1. Renommer fichiers, classes, jetons et schémas (`Pokemon` → aggregate réel) couche par couche, en gardant la structure.
2. Supprimer les cas d'usage non retenus (fichiers, `configureCqs`, ressources SAM, tests) — pas de code mort.
3. Mettre à jour `POKEMON_TABLE_NAME` (SAM + repository) et les outputs lus par `test/integration/`.
4. Réécrire les exemples de `ARCHITECTURE.md` (flux d'une requête) et de `benchmarks/README.md`.
5. Vérifier qu'il ne reste rien : `grep -ri pokemon src test sam docs *.md` doit être vide.
6. `npm run typecheck && npm test && make build`.
