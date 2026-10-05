// Config commitlint du domaine — étend @garance-retraite/commitlint-config + scopes spécifiques au domaine pokedex-gauvain.

import base from '@garance-retraite/commitlint-config';

export default {
    ...base,
    rules: {
        ...base.rules,
        'scope-enum': [
            2,
            'always',
            ['domain', 'application', 'adapters', 'infrastructure', 'ci', 'docs', 'deps', 'config']
        ]
    }
};
