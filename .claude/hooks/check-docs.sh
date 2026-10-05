#!/usr/bin/env sh
# Hook Stop de Claude Code : l'agent ne rend pas la main avec une doc qui ne suit plus le code.
# Exit 2 = Claude reprend la main avec le message ci-dessous (voir .claude/settings.json).
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# Déjà relancé une fois par ce hook : on laisse finir (pas de boucle).
grep -q '"stop_hook_active": *true' && exit 0
# Rien de modifié dans le code ou la doc depuis le dernier commit, ou dépendances absentes : rien à vérifier.
[ -z "$(git status --porcelain -- src sam docs 2>/dev/null)" ] && exit 0
[ -d node_modules ] || exit 0

if ! npm run --silent docs:check >&2; then
  echo "Appliquer le skill update-architecture-docs avant de terminer." >&2
  exit 2
fi
