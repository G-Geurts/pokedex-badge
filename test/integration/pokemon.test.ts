import type { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';

import { describeDeployedApi } from './deployed-stack';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/v;

describeDeployedApi('Pokemon API (E2E)', baseUrl => {
    describe('health + routing', () => {
        it('exposes an https base URL', () => {
            expect(baseUrl).toMatch(/^https:\/\//v);
        });

        it('returns 403/404 for unknown path (API Gateway default)', async () => {
            const res = await fetch(`${baseUrl}/does-not-exist`);
            expect([403, 404]).toContain(res.status);
        });
    });

    describe('POST /pokemons — validation', () => {
        it('rejects empty body with a 4xx', async () => {
            const res = await fetch(`${baseUrl}/pokemons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}'
            });
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        });

        it('rejects invalid type enum', async () => {
            const res = await fetch(`${baseUrl}/pokemons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Bad',
                    type: 'unknown-type',
                    level: 5,
                    hp: 10,
                    stats: { attack: 10, defense: 10, speed: 10, specialAttack: 10, specialDefense: 10 },
                    moves: ['Tackle'],
                    captured: false
                })
            });
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        });

        it('rejects out-of-range stats', async () => {
            const res = await fetch(`${baseUrl}/pokemons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Bad',
                    type: 'normal',
                    level: 5,
                    hp: 10,
                    stats: { attack: 999, defense: 10, speed: 10, specialAttack: 10, specialDefense: 10 },
                    moves: ['Tackle'],
                    captured: false
                })
            });
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        });
    });

    describe('POST /pokemons — success path', () => {
        const pikachu = {
            name: 'Pikachu',
            type: 'electrique' as const,
            level: 50,
            hp: 200,
            stats: { attack: 120, defense: 110, speed: 90, specialAttack: 95, specialDefense: 80 },
            moves: ['Thunderbolt', 'Quick Attack'],
            captured: true
        };

        const bulbasaur = {
            name: 'Bulbasaur',
            type: 'plante' as const,
            level: 5,
            hp: 45,
            stats: { attack: 49, defense: 49, speed: 45, specialAttack: 65, specialDefense: 65 },
            moves: ['Tackle', 'Growl'],
            captured: false,
            evolutions: ['Ivysaur', 'Venusaur']
        };

        it('creates a pokemon with 201', async () => {
            const res = await fetch(`${baseUrl}/pokemons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pikachu)
            });
            expect(res.status).toBe(201);
            const created = (await res.json()) as PokemonAggregate;
            expect(created.id).toMatch(UUID_RE);
            expect(created).toMatchObject(pikachu);
            expect(created.createdAt).toBeGreaterThan(0);
            expect(created.updatedAt).toBe(created.createdAt);
        });

        it('generates distinct ids across requests', async () => {
            const [a, b] = await Promise.all([
                fetch(`${baseUrl}/pokemons`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bulbasaur)
                }).then(async r => r.json() as Promise<PokemonAggregate>),
                fetch(`${baseUrl}/pokemons`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bulbasaur)
                }).then(async r => r.json() as Promise<PokemonAggregate>)
            ]);
            expect(a.id).not.toBe(b.id);
            expect(a.id).toMatch(UUID_RE);
            expect(b.id).toMatch(UUID_RE);
        });

        it('preserves optional fields (evolutions)', async () => {
            const res = await fetch(`${baseUrl}/pokemons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bulbasaur)
            });
            const created = (await res.json()) as PokemonAggregate;
            expect(created.evolutions).toEqual(bulbasaur.evolutions);
        });
    });

    describe('GET /pokemons/{id}', () => {
        let createdId: string;

        beforeAll(async () => {
            const res = await fetch(`${baseUrl}/pokemons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Charmander',
                    type: 'feu',
                    level: 5,
                    hp: 39,
                    stats: { attack: 52, defense: 43, speed: 65, specialAttack: 60, specialDefense: 50 },
                    moves: ['Ember', 'Scratch'],
                    captured: true
                })
            });
            const body = (await res.json()) as PokemonAggregate;
            createdId = body.id;
        });

        it('retrieves a previously created pokemon', async () => {
            const res = await fetch(`${baseUrl}/pokemons/${createdId}`);
            expect(res.status).toBe(200);
            const fetched = (await res.json()) as PokemonAggregate;
            expect(fetched.id).toBe(createdId);
            expect(fetched.name).toBe('Charmander');
        });

        it('returns 404 for an unknown uuid', async () => {
            const res = await fetch(`${baseUrl}/pokemons/00000000-0000-4000-8000-000000000000`);
            expect(res.status).toBe(404);
        });

        it('returns 200 with the same payload shape on re-fetch', async () => {
            const first = await fetch(`${baseUrl}/pokemons/${createdId}`).then(
                async r => r.json() as Promise<PokemonAggregate>
            );
            const second = await fetch(`${baseUrl}/pokemons/${createdId}`).then(
                async r => r.json() as Promise<PokemonAggregate>
            );
            expect(first).toEqual(second);
        });
    });
});
