# Architecture — `pokedex-gauvain`

Service AWS Lambda + API Gateway, architecture hexagonale. Le scaffold livre un exemple Pokemon complet — à customiser pour votre domaine.

## Principes

1. **Domaine pur.** `src/domain/*` ne connaît ni AWS, ni HTTP, ni inversify. Uniquement des types TypeScript, des zod schemas, des errors, et des ports (interfaces).
2. **Adapters remplaçables.** Les adapters secondaires (DynamoDB, S3, etc.) implémentent des ports du domaine. Changer de techno = changer d'adapter, pas le domaine.
3. **CQS.** Commands (écrivent) et Queries (lisent) passent par le `CommandBus` / `QueryBus`. Les Lambdas sont de fins dispatchers — pas de logique métier dans un handler.
4. **zod au bord.** Validation au Lambda + adapters. Le domaine manipule des types narrow, jamais des `ZodSchema`.
5. **DI via inversify.** Le domaine possède le container. `backend-core` et `aws` fournissent des injectables et des tokens.
6. **Observabilité injectée.** `Logger` résolu via DI (`LOGGER_TOKENS.Logger`), corrélé par handler, zéro `console.log`.
7. **Une seule définition.** Les schémas d'entrée dérivent de l'aggregate (`pokemonSchema.omit(...)`) ; le jeton d'un port est déclaré à côté du port.

## Layout

Arborescence commentée du repo : [`README.md` § Où mettre le code](./README.md#où-mettre-le-code).

## Boundaries hexagonales

Règles eslint (`@garance-retraite/eslint-config/hexagonal`, `eslint-plugin-boundaries` avec resolver TypeScript pour les alias) :

| Depuis                 | Peut importer                            | Interdit en plus                                        |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------- |
| `src/domain/*`         | `src/domain/*`, paquets purs (zod)       | `@aws-sdk/*`, `@garance-retraite/aws`, handlers, parser |
| `src/application/*`    | `src/domain/*`, `src/application/*`      | —                                                       |
| `src/adapters/*`       | tout (racine de composition des Lambdas) | —                                                       |
| `src/infrastructure/*` | tout                                     | —                                                       |

L'API des packages `@garance-retraite/*` est documentée dans le README de chaque package du repo `garance-domain-template`.

## Flux d'une requête

Exemple `POST /pokemons` :

```
API Gateway
   ↓
Lambda handler (adapters/primary/serverless/create-pokemon.ts)
   ↓ CustomApiGatewayEnvelope.safeParse(event, newPokemonSchema)  ← zod au bord
   ↓ CommandBus.execute(new CreatePokemonCommand(body))
CreatePokemonHandler (application)
   ↓ repository.save(aggregate)
DynamoDBPokemonRepository (adapters/secondary)
   ↓ DynamoDBDocument.send(PutCommand)
DynamoDB
```

Erreurs : `@apiEndpoint` convertit les erreurs typées en réponse HTTP (`PokemonNotFoundError` → 404, `RequestValidationError` → 422) ; toute autre exception → 500 générique, loggée avec sa stack. Les détails des erreurs techniques restent dans les logs. Hors HTTP (SQS), l'erreur remonte : le message est rejoué puis part en DLQ.

## Lambda bundling (résumé)

Hérité du template — voir `sam/template.yml` :

| Paramètre              | Valeur                                                                                                                             | Raison                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `Runtime`              | `nodejs24.x`                                                                                                                       | le plus récent supporté                        |
| `Architectures`        | `[arm64]`                                                                                                                          | Graviton — -20 % coût, -10 % cold-start        |
| `BuildMethod`          | `esbuild`                                                                                                                          | bundle par Lambda, externals via layer         |
| `Format`               | `esm`                                                                                                                              | inversify 8 / zod 4 sont ESM-only              |
| `OutExtension`         | `.js=.mjs`                                                                                                                         | Node charge le bundle en ESM                   |
| `External`             | `@aws-sdk/*`, `@aws-lambda-powertools/*`, `@garance-retraite/*`, `@smithy/*`, `inversify`, `reflect-metadata`, `zod`, `aws-lambda` | runtime Lambda + `DependenciesLayer`           |
| `Minify` / `Sourcemap` | `!Ref MinifyingEnabled` (`minifyingEnabled` du Makefile, `false` en `dev`) / `inline`                                              | bundle compact hors `dev`, stack trace lisible |

Mesures de référence (arm64, Node 24, 512 MB) :

- Lambda CodeSize : ~2 kB.
- DependenciesLayer zip : ~1.5 MB.
- Cold-start init : median ~900 ms, p95 ~1 100 ms.
- Warm handler : ~10-30 ms côté serveur (mesuré via `platform.report`).

## Observabilité

| Signal                  | Outil                              | Où                                                                            |
| ----------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| Logs structurés JSON    | `@aws-lambda-powertools/logger`    | CloudWatch Logs, un log group par Lambda                                      |
| Traces                  | X-Ray (`Tracing: Active` dans SAM) | console X-Ray, corrélation automatique par `requestId`                        |
| Métriques               | CloudWatch (auto Lambda metrics)   | dashboards à ajouter dans `sam/template.yml`                                  |
| Benchmark de régression | `make test-benchmark env=<env>`    | `benchmarks/history.jsonl` (commité), `benchmarks/latest.json` (dernière run) |

## Déploiement

```bash
make build env=dev          # build-DependenciesLayer + sam build (esbuild)
make deploy env=dev         # sam deploy, écrit <stackName>.outputs
make autodeploy env=dev     # clean + build + deploy
make test-e2e env=dev       # E2E sur la stack déployée
```

Stacks par environnement : `garance-domain-pokedex-gauvain-<env>` ; une stack éphémère `garance-domain-pokedex-gauvain-pr-<n>` par PR, supprimée à la fermeture. La table DynamoDB est en `Retain` partout sauf sur les stacks de PR. Outputs exposés : `PokedexGauvainApiExecuteUrl`, `PokedexGauvainApiId`, `PokemonTableName`, `PokemonEventsQueueUrl`.

Pour un sous-domaine custom (`pokedex-gauvain.api.<base-domain>`) : passer `apiDomainName=` au `make deploy`, qui crée un `BasePathMapping`. Sinon l'URL est `https://<ApiId>.execute-api.<region>.amazonaws.com/<stage>`.

## Infra partagée requise

Sur chaque compte AWS cible :

- `init-stack` (provisionne `TemplateBucket`, `CloudformationRole`).
- `environment-init-stack` (provisionne `DomainName`, `RegionalCertificateArn`).
- SSM parameters : `/garance-deploy-params/mapServerId`, `ApiGatewayAccessLogsFormat`.

## ADRs

Toute décision architecturale (schéma de données, choix d'un service AWS, contrat d'API, flow d'erreur transverse) s'écrit dans `docs/adr/` au format MADR. Template : `docs/adr/0000-template.md`. Append-only, numérotation continue.
