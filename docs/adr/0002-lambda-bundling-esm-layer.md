# ADR-0002: Bundling Lambda — ESM + externals + DependenciesLayer

## Statut

Accepté (hérité du template, voir ADR-0010 de `garance-domain-template`)

## Contexte

Chaque Lambda est bundlée par `sam build` (esbuild). Deux contraintes guident la config :

- **ESM obligatoire** : `inversify` 8, `zod` 4 et les libs plateforme `@garance-retraite/*` sont ESM-only. Un bundle CJS qui `require()` une dep ESM échoue avec `ERR_REQUIRE_ESM`.
- **Taille du zip impacte le cold-start** : chaque KB compte, surtout sur les fonctions peu invoquées.

## Décision

`sam/template.yml` applique :

- `Runtime: nodejs24.x`, `Architectures: [arm64]` (Graviton — -20 % coût).
- `BuildMethod: esbuild` avec `Format: esm` et `OutExtension: .js=.mjs`.
- `External: [@aws-sdk/*, @aws-lambda-powertools/*, @garance-retraite/*, @smithy/*, inversify, reflect-metadata, zod, aws-lambda]`.
- `DependenciesLayer` construit par `build-DependenciesLayer` avec `npm ci --omit=dev --omit=peer`, attaché via `Globals.Function.Layers`.
- `@aws-sdk/*` en `devDependencies` uniquement — Lambda les résout depuis `/var/runtime/node_modules/`.

## Conséquences

- Lambda CodeSize ~2 kB, layer ~1.5 MB, cold-start init ~900 ms median.
- Si vous avez besoin d'un command SDK trop récent pour le runtime Lambda (mis à jour par AWS tous les 3-6 mois) : ajoutez le client concerné à `dependencies`, il finira dans le layer et override la version runtime.
- Le layer doit être reconstruit à chaque bump de dep runtime — géré par le `make build` du Makefile.
- Si `sam build` régresse un jour sur `Format: esm`, le fallback serait de repasser en CJS avec des versions antérieures d'inversify/zod — à éviter.

## Revisiter si

- AWS SDK v3 passe full ESM dans le runtime (libérerait des externals).
- Cold-start devient un problème produit → considérer Lambda SnapStart Node.js 24 avant toute optimisation de bundling.
- Les Lambdas deviennent > 1 MB malgré les externals : signal qu'une dep lourde a slipé dans le bundle.
