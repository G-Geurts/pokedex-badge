// Config eslint du domaine — étend @garance-retraite/eslint-config/hexagonal.
// Le consommateur ajoute son propre tsconfigRootDir (nécessaire pour les règles type-aware).

import hexagonal from '@garance-retraite/eslint-config/hexagonal';

export default [
    ...hexagonal,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['*.js', '*.mjs'],
                    defaultProject: 'tsconfig.eslint.json'
                },
                tsconfigRootDir: import.meta.dirname
            }
        }
    }
];
