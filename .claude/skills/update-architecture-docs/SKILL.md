---
name: update-architecture-docs
description: Met à jour la doc d'architecture et d'API du domaine après un changement de code (nouveau cas d'usage, endpoint, ressource SAM, dépendance externe). À appliquer à la fin de toute feature ou correction qui touche src/, sam/ ou un contrat d'API.
---

# Mettre à jour la doc d'architecture et d'API

## 1. Contrat d'API (généré)

```bash
npm run docs:generate   # docs/api/openapi.json depuis les routes SAM et les @apiEndpoint
```

Un endpoint doit documenter ses entrées (`request.body` / `params` / `query`) et chacune de ses réponses (`responses`) dans
`@apiEndpoint`, avec les schémas zod existants. Ne jamais éditer `openapi.json` à la main.

## 2. Diagrammes (écrits par l'agent, Mermaid)

| Changement                                                                   | Fichier                                                                                                                                                      |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| nouveau cas d'usage `src/application/{commands,queries}/<nom>/`              | créer `docs/architecture/flows/<nom>.md` (sequenceDiagram, sur le modèle des flux existants) et l'ajouter au tableau « Flux par cas d'usage » du `README.md` |
| cas d'usage modifié ou supprimé                                              | mettre à jour ou supprimer son fichier dans `flows/`                                                                                                         |
| nouvelle ressource (table, file, bucket), nouvel appelant ou service externe | `README.md`, section Architecture (contexte et conteneurs)                                                                                                   |

Règles : `flowchart` et `sequenceDiagram` uniquement (rendus par GitHub), libellés entre guillemets, noms identiques au code.

## 3. Vérifier

```bash
npm run docs:check      # OpenAPI à jour + un flux par cas d'usage (aussi lancé en fin de tour, au push et en CI)
```
