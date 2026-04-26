import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runGoldenSetRegression, type GoldenSetCase } from '@/lib/evaluation/golden-set';

describe('golden set regression', () => {
  it('고정 fixture 범위를 벗어나지 않는다', () => {
    const fixturePath = join(process.cwd(), 'fixtures', 'evaluation', 'golden-set.json');
    const fixtures = JSON.parse(readFileSync(fixturePath, 'utf-8')) as GoldenSetCase[];
    const results = runGoldenSetRegression(fixtures);

    expect(results.every((result) => result.passed)).toBe(true);
  });
});
