# Benchmarks

Suivi de la performance du domaine `pokedex-gauvain` sur les endpoints POST / GET.

## Fichiers

- **`history.jsonl`** — une ligne JSON append-only par exécution du benchmark. Diffable dans git, pas besoin d'outil externe pour suivre l'évolution.
- **`latest.json`** — snapshot du dernier run (lisible à l'œil nu, pratique pour coller dans une review).

## Format d'une entrée

```json
{
    "timestamp": "2026-04-23T14:30:00.000Z",
    "env": "dev",
    "stackName": "garance-domain-pokedex-gauvain-dev",
    "region": "eu-west-1",
    "stage": "v1",
    "iterations": 100,
    "concurrency": 10,
    "gitCommit": "abc1234",
    "post": {
        "samples": 100,
        "min": 42.1,
        "mean": 78.5,
        "median": 65.0,
        "p95": 180.2,
        "p99": 350.0,
        "max": 420.1,
        "totalMs": 7850
    },
    "get": {
        "samples": 100,
        "min": 18.0,
        "mean": 32.1,
        "median": 28.0,
        "p95": 62.5,
        "p99": 85.0,
        "max": 95.5,
        "totalMs": 3210
    }
}
```

## Lancer un run

```bash
make deploy env=dev              # s'assure que le stack est à jour
make test-benchmark env=dev      # génère/append history.jsonl + latest.json
```

Variables d'env pour tuner la charge :

| Variable            | Défaut | Rôle                           |
| ------------------- | ------ | ------------------------------ |
| `BENCH_ITERATIONS`  | `100`  | nombre d'appels par endpoint   |
| `BENCH_CONCURRENCY` | `10`   | taille des rafales parallèles  |
| `GITHUB_SHA`        | auto   | SHA commit pour la traçabilité |

```bash
BENCH_ITERATIONS=500 BENCH_CONCURRENCY=20 make test-benchmark env=dev
```

## Suivre l'évolution

```bash
# médiane POST sur les 10 derniers runs
tail -10 benchmarks/history.jsonl | jq -r '[.timestamp, .post.median, .get.median] | @tsv'

# régression : médiane > 100 ms
jq 'select(.post.median > 100)' benchmarks/history.jsonl
```

## Quand relancer

- Après une modif d'un Lambda handler, du container IoC, ou d'un repository.
- Après un bump `@garance-retraite/backend-core` ou `@garance-retraite/aws`.
- Après un changement de taille mémoire ou de cold-start config dans `sam/template.yml`.

Commiter `history.jsonl` à chaque run pertinent — c'est la meilleure trace d'évolution pour les reviews.
