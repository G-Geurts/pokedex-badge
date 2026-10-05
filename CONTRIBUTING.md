# Contribuer à `pokedex-gauvain`

Comment ajouter du code, tester, et pousser en prod.

## Setup local

```bash
nvm use                   # Node 24+ (voir .nvmrc)
npm ci                    # installe deps + hooks husky (pre-commit : lint-staged ; pre-push : typecheck + tests)
npm run typecheck         # tsc --noEmit
npm test                  # lint puis tests unitaires
```

Si `@garance-retraite/*` ne s'installe pas : le registre est GitHub Packages, il faut un token personnel dans `~/.npmrc` :

```
//npm.pkg.github.com/:_authToken=<PAT avec read:packages>
@garance-retraite:registry=https://npm.pkg.github.com
```

## Conventional commits (obligatoires)

Pattern : `<type>(<scope>): <sujet>`. Commitlint bloque le reste.

| Type                                                               | Effet                        |
| ------------------------------------------------------------------ | ---------------------------- |
| `feat:`                                                            | Nouvelle fonctionnalité      |
| `fix:`                                                             | Correction de bug            |
| `feat!:` / footer `BREAKING CHANGE:`                               | Breaking — nécessite un ADR  |
| `build:`, `chore:`, `ci:`, `docs:`, `refactor:`, `style:`, `test:` | Maintenance, pas user-facing |

Types et scopes autorisés : ceux de [`commitlint.config.mjs`](./commitlint.config.mjs) (scopes : `domain`, `application`, `adapters`, `infrastructure`, `ci`, `docs`, `deps`, `config`).

Exemple : `feat(application): add BumpPokemonLevelCommand`.

## Flow d'une contribution

```bash
git checkout -b feat/bump-pokemon-level
# … code + tests + update ADR si décision architecturale …
git commit -am "feat(application): add BumpPokemonLevelCommand"
git push -u origin feat/bump-pokemon-level
# Ouvrir la PR avec le template pré-rempli → review → merge
```

**Toujours tester en local avant de pousser** :

```bash
npm run typecheck && npm test   # typecheck, lint (boundaries incluses), unit
make build                      # bundle SAM, sans AWS
make deploy env=dev       # sur votre compte de dev perso si applicable
make test-e2e env=dev     # E2E sur l'API déployée
```

## TDD

1. Écrire le test qui échoue (unit si possible, E2E uniquement si le comportement n'est observable qu'end-to-end).
2. Implémenter le strict minimum pour le faire passer.
3. Refactorer si nécessaire.
4. Commit.

Les tests unitaires mockent les adapters secondaires (repositories, clients AWS via `aws-sdk-client-mock`). Les E2E tapent une vraie API déployée — lents et coûteux, à utiliser pour verrouiller les contrats transverses, pas pour chaque branche logique.

## Pull Request

Remplir le `.github/pull_request_template.md` — ne pas supprimer de sections. Cases obligatoires :

- Ticket Jira lié.
- Tests ajoutés ou mis à jour.
- ADR ajouté si décision architecturale ou breaking.
- Note de migration si breaking pour un consumer (API, event schema, SSM).

La CI (`pull_request.yml` → workflows réutilisables de la plateforme) lance :

1. `verify` : cfn-lint, typecheck, lint (boundaries hexagonales incluses), tests unitaires + coverage, `make build`.
2. `deploy-pr` : stack éphémère `garance-domain-pokedex-gauvain-pr-<n>` sur l'environnement `test` (sauf PR Dependabot).

La stack de PR (et sa table, en `Delete` sur ces seules stacks) est supprimée par `cleanup.yml` à la fermeture de la PR.

## Flow de déploiement (merge → prod)

1. Merge sur `main` (`main.yml`) → déploie `test` et `aging`.
2. Tag `X.Y.Z` (`release.yml`) → release GitHub → déploie `uat` puis `prod` (protections portées par les environnements GitHub). Un nouveau tag n'annule jamais un déploiement en cours.

Chaque environnement est une stack CloudFormation séparée : `garance-domain-pokedex-gauvain-<env>`.

## Breaking change

Checklist avant de merger un commit `feat!:` / `BREAKING CHANGE:` :

1. ADR dans `docs/adr/` qui documente le changement et la raison.
2. Guide de migration dans la description de PR (ou lien vers un `MIGRATING.md`).
3. Warnings `@deprecated` poussés dans une version précédente depuis au moins une sprint → les consumers ont vu le signal.
4. Synchro avec les équipes consommatrices (event bus, API REST).

## Mise à jour des libs plateforme

Dependabot (voir `.github/dependabot.yml`) ouvre des PRs groupées pour `@garance-retraite/*` (npm) et pour les workflows plateforme `domain-*.yml` (github-actions). Ne pas modifier ces workflows ni la plomberie make à la main : les corriger dans `garance-domain-template`. Revue standard :

1. Lire la release note (breaking ? déprécation ?).
2. Laisser la CI PR faire son tour.
3. Merger si vert. Sinon investiguer — si c'est un bug plateforme, ouvrir une issue sur `garance-domain-template`.

## Rollback d'urgence

Deux stratégies selon la gravité :

- **CloudFormation rollback** : depuis la console, `UPDATE_ROLLBACK_COMPLETE` ramène le stack à la dernière version stable. N'affecte pas les données (DynamoDB preservée).
- **Re-deploy de la version précédente** : `git revert <sha>` du commit fautif, push, le flow `main.yml` re-déploie automatiquement.

**Ne jamais** supprimer la stack manuellement pour « repartir propre » : la table DynamoDB (en `Retain`) survivrait orpheline et la nouvelle stack repartirait sur une table vide.

## Observabilité

- Logs : CloudWatch Logs, log group par Lambda (`/aws/lambda/<stackName>-<FnName>-<hash>`).
- Traces : X-Ray (`Tracing: Active` dans `sam/template.yml`).
- Metrics : CloudWatch, dashboards custom à ajouter dans `sam/template.yml` si besoin.
- Benchmark : `make test-benchmark env=<env>` écrit `benchmarks/latest.json` + append `benchmarks/history.jsonl`. Commiter `history.jsonl` pour suivre les régressions.
