---
name: add-use-case
description: Ajoute un cas d'usage de bout en bout dans ce domaine (commande ou query CQS, Lambda API Gateway ou consommateur SQS, ressources SAM, tests). À utiliser pour « ajouter un endpoint », « nouvelle commande », « nouvelle query », « nouvelle Lambda ».
---

# Ajouter un cas d'usage

Modèles à suivre : `create-pokemon` (commande, POST, SQS) et `get-pokemon` (query, GET). Copier leur forme, pas leur contenu.

## 1. Domaine (si nécessaire)

- Nouveau schéma d'entrée : **dériver** celui de l'aggregate (`xxxSchema.omit(...)` / `.pick(...)`) dans `src/domain/aggregates/`, exporter le type `z.infer`.
- Nouvelle erreur : `src/domain/errors/`, étendre `NotFoundError` / `ConflictError` / `DomainError` de `@garance-retraite/backend-core/errors`, avec un `code` en SCREAMING_SNAKE_CASE.
- Nouveau port : interface + `XxxToken = Symbol.for('Xxx')` dans `src/domain/ports/`.

## 2. Application

`src/application/{commands|queries}/<cas>/` :

- `<cas>.command.ts` / `<cas>.query.ts` : classe qui implémente `ICommand` / `IQuery`, constructeur `public readonly` typé par le domaine.
- `<cas>.handler.ts` : `@CommandHandler(XxxCommand)` / `@QueryHandler(XxxQuery)`, implémente `ICommandHandler<C, R>` / `IQueryHandler<Q, R>`, injecte les ports par leur jeton (`@inject(XxxToken)`) et le logger (`@inject(LOGGER_TOKENS.Logger)`).

## 3. IoC

Enregistrer le handler dans `configureCqs(...)` du bon module : `src/infrastructure/ioc/*-write.module.ts` pour une commande, `*-read.module.ts` pour une query. Un nouveau port se binde dans `*-persistence.ts`.

## 4. Adapter primaire

`src/adapters/primary/serverless/<cas>.ts` :

- HTTP : `@apiEndpoint({ ... })` (+ `@cors()` au-dessus si l'endpoint est appelé depuis un navigateur), validation zod (`CustomApiGatewayEnvelope` pour un body, `createApiGatewayEventSchema` pour path/query), échec → `throw new RequestValidationError(...)`, puis `commandBus.execute` / `queryBus.execute`, réponse `HttpResponse.ok/created(...)`. Export `handler = createLambdaHandler(Classe, [Module], logger)`.
- SQS : classe `SqsRecordHandler`, `parseSqsJsonBody(record.body, schema)`, export `handler = createSqsBatchHandler(...)`. Rendre la commande idempotente (livraison au moins une fois).

## 5. SAM (`sam/template.yml`)

Copier le bloc de la Lambda modèle : `AWS::Serverless::Function` (même `Metadata` esbuild, `EntryPoints` et `Handler` mis à jour), politique IAM **minimale** (`DynamoDBReadPolicy` pour une query), événement `Api` (`RestApiId`, `Path`, `Method`) ou `SQS`, et son `AWS::Logs::LogGroup` dédié.

## 6. Tests

- `test/unit/application/...` : handler avec ports mockés — chemin nominal **et** chemin d'erreur.
- E2E si le contrat HTTP change : `test/integration/`.

## 7. Documenter

Skill `update-architecture-docs` : `npm run docs:generate` puis le diagramme de séquence du cas d'usage.

## 8. Vérifier

```bash
npm run typecheck && npm test && npm run docs:check && make build
```
