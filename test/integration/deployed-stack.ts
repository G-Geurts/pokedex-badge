import fs from 'node:fs';
import path from 'node:path';

import { describe } from '@jest/globals';

// Contexte commun des suites E2E et benchmark, lancées contre une stack déployée via
// `make test-e2e` / `make test-benchmark` (qui renseignent ces variables).
export const env = process.env.env ?? 'dev';
export const region = process.env.AWS_REGION ?? 'eu-west-1';
export const stackName = process.env.stackName ?? `garance-domain-pokedex-gauvain-${env}`;
export const stage = process.env.apiStageName ?? 'v1';

function readStackOutputs(): Record<string, string> {
    const file = path.resolve(process.cwd(), `${stackName}.outputs`);
    if (!fs.existsSync(file)) {
        throw new Error(
            `${file} introuvable : lancer \`make test-e2e env=${env}\`, qui le génère depuis la stack déployée.`
        );
    }
    const outputs: Record<string, string> = {};
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const [key, ...rest] = line.split('\t');
        if (key && rest.length > 0) {
            outputs[key] = rest.join('\t').trim();
        }
    }
    return outputs;
}

function resolveApiBaseUrl(outputs: Record<string, string>): string {
    const custom = outputs.PokedexGauvainApiEndpointUrl;
    if (custom?.startsWith('https://')) {
        return custom.replace(/\/$/, '');
    }
    const apiId = outputs.PokedexGauvainApiId;
    const execute =
        outputs.PokedexGauvainApiExecuteUrl ??
        (apiId === undefined ? undefined : `${apiId}.execute-api.${region}.amazonaws.com`);
    if (!execute) {
        throw new Error(
            `Aucune URL d'API dans ${stackName}.outputs (attendu : PokedexGauvainApiExecuteUrl ou PokedexGauvainApiId).`
        );
    }
    return `https://${execute}/${stage}`;
}

/**
 * Déclare une suite contre l'API déployée, exécutée seulement si E2E_RUN=true.
 * L'URL est résolue à la collecte : une stack absente donne un seul échec lisible,
 * pas une erreur par test.
 */
export function describeDeployedApi(name: string, suite: (baseUrl: string) => void): void {
    if (process.env.E2E_RUN !== 'true') {
        describe.skip(name, () => {
            suite('');
        });
        return;
    }
    describe(name, () => {
        suite(resolveApiBaseUrl(readStackOutputs()));
    });
}
