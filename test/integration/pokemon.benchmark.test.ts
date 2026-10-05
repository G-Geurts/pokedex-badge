/* eslint-disable @typescript-eslint/restrict-template-expressions -- benchmark emits numeric stats into template literals by design */
import { execSync } from 'node:child_process';
import fs from 'node:fs';

import type { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';

import { describeDeployedApi, env, region, stackName, stage } from './deployed-stack';

interface LatencyStats {
    samples: number;
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
    totalMs: number;
}

function computeStats(samples: number[]): LatencyStats {
    const sorted = [...samples].sort((a, b) => a - b);
    const sum = samples.reduce((acc, v) => acc + v, 0);
    const pct = (p: number): number => {
        const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
        return sorted[index] ?? 0;
    };
    return {
        samples: samples.length,
        min: sorted[0] ?? 0,
        max: sorted[sorted.length - 1] ?? 0,
        mean: sum / samples.length,
        median: pct(50),
        p95: pct(95),
        p99: pct(99),
        totalMs: sum
    };
}

function formatStats(label: string, stats: LatencyStats): string {
    const fmt = (n: number): string => `${n.toFixed(1).padStart(7)} ms`;
    return [
        `[${label.padEnd(22)}] ${stats.samples} calls, ${stats.totalMs.toFixed(0)} ms total`,
        `  min=${fmt(stats.min)}  mean=${fmt(stats.mean)}  median=${fmt(stats.median)}`,
        `  p95=${fmt(stats.p95)}  p99=${fmt(stats.p99)}  max=${fmt(stats.max)}`
    ].join('\n');
}

function fetchColdStartDurations(stackName: string, region: string, startMs: number, endMs: number): number[] {
    // Pull platform.initReport.durationMs from every Lambda log group of the stack.
    // Uses the AWS CLI to avoid adding a CloudWatch Logs SDK dep to the scaffold.
    let groupsRaw = '';
    try {
        groupsRaw = execSync(
            `aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/${stackName}-" --region ${region} --query "logGroups[].logGroupName" --output text`,
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
        ).trim();
    } catch {
        return [];
    }
    const groups = groupsRaw.split(/\s+/).filter(Boolean);
    const durations: number[] = [];
    for (const group of groups) {
        try {
            const raw = execSync(
                `aws logs filter-log-events --log-group-name "${group}" --region ${region} --start-time ${startMs} --end-time ${endMs} --filter-pattern 'initReport' --query "events[].message" --output text`,
                { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 10 * 1024 * 1024 }
            );
            for (const match of raw.matchAll(/"platform\.initReport"[^{]+\{[^}]+"durationMs":([0-9.]+)/g)) {
                durations.push(Number(match[1]));
            }
        } catch {
            // Missing log group or transient CLI error — skip.
        }
    }
    return durations;
}

const iterations = Number(process.env.BENCH_ITERATIONS ?? '100');
const concurrency = Number(process.env.BENCH_CONCURRENCY ?? '10');
const warmupCount = Number(process.env.BENCH_WARMUP ?? String(Math.max(concurrency, 10)));
// Client-side baseline round-trip to the target region (`ping`-like). Subtracted from every warm
// sample to reveal the stack's true latency — useful when benching from a laptop where network RTT
// dominates. Set to 0 (default) when running from an EC2 in the same region.
const pingDelay = Number(process.env.BENCH_PING_DELAY ?? '0');

describeDeployedApi('Pokemon API — benchmark', baseUrl => {
    beforeAll(() => {
        console.log(
            `\n--- Benchmark ---\nURL: ${baseUrl}\nIterations: ${iterations}\nConcurrency: ${concurrency}\nWarm-up: ${warmupCount} requests/endpoint (untimed)\nPing delay: ${pingDelay} ms (subtracted from warm samples)\n`
        );
    });

    const buildPayload = (seed: number) => ({
        name: `Bench-${seed}`,
        type: 'electrique' as const,
        level: 50,
        hp: 200,
        stats: { attack: 120, defense: 110, speed: 90, specialAttack: 95, specialDefense: 80 },
        moves: ['Thunderbolt', 'Quick Attack'],
        captured: true
    });

    async function runBatches<T>(total: number, size: number, task: (index: number) => Promise<T>): Promise<T[]> {
        const results: T[] = [];
        for (let start = 0; start < total; start += size) {
            const end = Math.min(start + size, total);
            const batch = Array.from({ length: end - start }, (_, i) => task(start + i));

            results.push(...(await Promise.all(batch)));
        }
        return results;
    }

    it(
        `POST /pokemons × ${iterations} then GET × ${iterations} (warm, cold-start reported separately)`,
        async () => {
            // Warm-up: primes TLS pool, DNS cache, and the Lambda sandboxes we will measure.
            // Any cold-start from this phase surfaces in the CloudWatch-derived stats below, not in the warm samples.
            const warmupStartMs = Date.now();
            const warmupPost = await runBatches(warmupCount, concurrency, async i => {
                const res = await fetch(`${baseUrl}/pokemons`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildPayload(-1 - i))
                });
                if (res.status !== 201) throw new Error(`Warm-up POST #${i} status ${res.status}`);
                const body = (await res.json()) as PokemonAggregate;
                return body.id;
            });
            await runBatches(warmupPost.length, concurrency, async i => {
                const id = warmupPost[i];
                if (id === undefined) throw new Error(`Missing warm-up id #${i}`);
                const res = await fetch(`${baseUrl}/pokemons/${id}`);
                if (res.status !== 200) throw new Error(`Warm-up GET #${i} status ${res.status}`);
            });

            // Phase 1 : POST en rafales (warm)
            const postSamples: number[] = [];
            const createdIds: string[] = [];

            await runBatches(iterations, concurrency, async i => {
                const start = performance.now();
                const res = await fetch(`${baseUrl}/pokemons`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildPayload(i))
                });
                const elapsed = performance.now() - start;
                postSamples.push(elapsed);
                if (res.status !== 201) {
                    throw new Error(`POST #${i} failed with status ${res.status}: ${await res.text()}`);
                }
                const body = (await res.json()) as PokemonAggregate;
                createdIds.push(body.id);
            });

            // Phase 2 : GET (warm)
            const getSamples: number[] = [];

            await runBatches(createdIds.length, concurrency, async i => {
                const id = createdIds[i];
                if (id === undefined) throw new Error(`Missing created id at index ${i}`);
                const start = performance.now();
                const res = await fetch(`${baseUrl}/pokemons/${id}`);
                const elapsed = performance.now() - start;
                getSamples.push(elapsed);
                if (res.status !== 200) {
                    throw new Error(`GET #${i} failed with status ${res.status}`);
                }
            });
            const runEndMs = Date.now();

            const adjust = (samples: number[]): number[] =>
                pingDelay > 0 ? samples.map(sample => Math.max(0, sample - pingDelay)) : samples;

            const postStats = computeStats(adjust(postSamples));
            const getStats = computeStats(adjust(getSamples));
            const postStatsRaw = pingDelay > 0 ? computeStats(postSamples) : null;
            const getStatsRaw = pingDelay > 0 ? computeStats(getSamples) : null;

            // Cold-start: pulled from Lambda platform.initReport within the run window.
            // Covers warm-up + timed phases so every init that happened during this benchmark is counted.
            const coldDurations = fetchColdStartDurations(stackName, region, warmupStartMs - 5_000, runEndMs + 5_000);
            const coldStats = coldDurations.length > 0 ? computeStats(coldDurations) : null;

            const warmLabel = pingDelay > 0 ? ` (warm, −${pingDelay}ms ping)` : ' (warm)';
            console.log(
                '\n' +
                    (postStatsRaw ? formatStats('POST /pokemons (raw)', postStatsRaw) + '\n' : '') +
                    formatStats(`POST /pokemons${warmLabel}`, postStats) +
                    '\n' +
                    (getStatsRaw ? formatStats('GET /pokemons/{id} (raw)', getStatsRaw) + '\n' : '') +
                    formatStats(`GET /pokemons/{id}${warmLabel}`, getStats) +
                    '\n' +
                    (coldStats
                        ? formatStats('Lambda cold-start init', coldStats)
                        : '[Lambda cold-start init      ] no samples (CloudWatch unreachable or zero inits)') +
                    '\n'
            );

            // Persist pour suivre l'évolution : une ligne JSON par run dans benchmarks/history.jsonl.
            fs.mkdirSync('benchmarks', { recursive: true });
            const entry = {
                timestamp: new Date().toISOString(),
                env,
                stackName,
                region,
                stage,
                iterations,
                concurrency,
                warmup: warmupCount,
                pingDelay,
                gitCommit: process.env.GITHUB_SHA ?? process.env.GIT_COMMIT ?? 'unknown',
                post: postStats,
                get: getStats,
                postRaw: postStatsRaw,
                getRaw: getStatsRaw,
                coldStart: coldStats
            };
            fs.appendFileSync('benchmarks/history.jsonl', JSON.stringify(entry) + '\n');
            fs.writeFileSync('benchmarks/latest.json', JSON.stringify(entry, null, 2) + '\n');

            expect(postStats.samples).toBe(iterations);
            expect(getStats.samples).toBe(iterations);
            // Warm sanity : warm median > 2 s means something broke.
            expect(postStats.median).toBeLessThan(2000);
            expect(getStats.median).toBeLessThan(2000);
        },
        15 * 60 * 1000
    );
});
