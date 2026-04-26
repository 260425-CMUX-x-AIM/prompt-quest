import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTaskDefinition, validateTaskDefinition } from '@/lib/tasks';

describe('task parser', () => {
  it('seed YAML을 TaskDefinition으로 파싱한다', () => {
    const yaml = readFileSync(
      join(process.cwd(), 'tasks', 'seed', 'regex-email-001.yaml'),
      'utf-8',
    );
    const task = parseTaskDefinition(yaml);

    expect(task.metadata.id).toBe('regex-email-001');
    expect(task.requirements).toHaveLength(3);
    expect(task.test_cases.length).toBeGreaterThan(0);
  });

  it('필수 필드가 없으면 검증 오류를 반환한다', () => {
    const result = validateTaskDefinition({
      metadata: {
        id: '',
      },
    });

    expect(result.parsed).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
