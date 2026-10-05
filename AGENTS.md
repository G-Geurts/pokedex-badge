# AGENTS.md

Domaine `pokedex-gauvain` : service Lambda + API Gateway, architecture hexagonale + CQS, scaffoldé depuis `@garance-retraite/create-domain`. **Toujours en français** (docs, commentaires, commits, PR). L'exemple **Pokemon** est à remplacer par le vrai domaine (skill `replace-example`).

## Carte

Arborescence commentée et diagrammes : [`README.md` § Architecture](./README.md#architecture).

## Commandes

```bash
npm run typecheck && npm test   # à lancer avant de rendre la main (npm test lance aussi le lint)
make build                      # layer + sam build (esbuild), sans AWS
make deploy env=dev             # déploie <pkg>-dev et écrit <stack>.outputs
make test-e2e env=dev           # E2E contre la stack déployée ([prId=N] pour une stack de PR)
npm run docs:generate           # régénère docs/api/openapi.json (à importer tel quel dans Postman)
```

## Pièges

- **Jamais de `console.log`** : `Logger` injecté (`LOGGER_TOKENS.Logger`). Jamais de `new Error('…')` : étendre `DomainError`, `NotFoundError`, `ConflictError`… de `@garance-retraite/backend-core/errors`.
- **Erreurs HTTP** : lever une erreur typée ; `@apiEndpoint` la convertit (404, 409, 422…). Pas de réponse d'erreur construite à la main. Hors HTTP (SQS, Step Functions), l'erreur doit remonter.
- **Schémas** : dériver du schéma de l'aggregate (`pokemonSchema.omit(...)`, `.pick(...)`), ne jamais recopier les champs.
- **Jetons d'injection** : déclarés à côté du port dans `src/domain/ports/`. L'application ne doit jamais importer `@infrastructure/*` (règle eslint boundaries).
- **Modules IoC lecture / écriture séparés** (cold start) : un handler de query va dans `*-read.module.ts`, un handler de command dans `*-write.module.ts`.
- **CORS** : `make deploy` refuse `allowedOrigins=*` en uat/prod. Déclarer les origines du front par environnement dans le `Makefile` avant la première release.
- **Déploiement CI** : compte CORE, outputs d'autres stacks ou cibles post-déploiement → `.github/deploy.env`, jamais une copie du workflow.
- `tsconfig.json` garde `experimentalDecorators` en local : ne pas le retirer, `sam build` ne voit pas l'`extends`.
- Les workflows `.github/workflows/*.yml`, `mk/*.mk` (dans `domain-tooling`) et les versions `@garance-retraite/*` appartiennent à la plateforme : on les met à jour via Dependabot, pas à la main.

## Recettes

- Ajouter une commande, une query ou une Lambda : skill `add-use-case` (`.claude/skills/add-use-case/SKILL.md`).
- **Toute feature ou correction qui touche `src/`, `sam/` ou un contrat d'API se termine par le skill `update-architecture-docs`.** `docs:check` le vérifie en fin de tour (hook Stop), au push et en CI.
- Remplacer l'exemple Pokemon : skill `replace-example`.

## Non-négociables

1. **Hexagonal enforced** (`@garance-retraite/eslint-config/hexagonal`) : `domain → domain`, `application → domain`, adapters et infrastructure → tout. CI rouge sinon.
2. **TS strict** (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) : pas de `any`, pas de `unknown` non narrowé, pas de `as X` pour faire taire le compilateur.
3. **zod au bord** (Lambdas, adapters) ; le domaine manipule des types TypeScript.
4. **Conventional commits** : scopes de `commitlint.config.mjs` (`domain`, `application`, `adapters`, `infrastructure`, `ci`, `docs`, `deps`, `config`).
5. **Pas de secrets commités** : `.dogfood/`, `test.sh`, `.env*` sont ignorés.

Détails : [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`docs/adr/`](./docs/adr/).
