import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGoldenSetRegression, type GoldenSetCase } from '../src/lib/evaluation/golden-set';

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = join(dirname(scriptPath), '..');
const fixturePath = join(repoRoot, 'fixtures', 'evaluation', 'golden-set.json');

const fixtures = JSON.parse(readFileSync(fixturePath, 'utf-8')) as GoldenSetCase[];
const results = runGoldenSetRegression(fixtures);

const failed = results.filter((result) => !result.passed);

for (const result of results) {
  console.log(
    `${result.passed ? 'PASS' : 'FAIL'} ${result.id} -> score=${result.result.total_score}, low_confidence=${result.result.meta.is_low_confidence}`,
  );
}

if (failed.length > 0) {
  process.exitCode = 1;
}
