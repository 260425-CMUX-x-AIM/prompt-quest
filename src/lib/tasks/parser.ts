import { parse as parseYaml } from 'yaml';
import type { TaskDefinition } from '@/lib/types/task';

interface ValidationResult {
  parsed: TaskDefinition | null;
  errors: string[];
}

export function parseTaskDefinition(yaml: string): TaskDefinition {
  const parsed = parseYaml(yaml);
  const { errors, parsed: taskDefinition } = validateTaskDefinition(parsed);

  if (!taskDefinition || errors.length > 0) {
    throw new Error(
      `유효하지 않은 task YAML입니다.\n${errors.map((error) => `- ${error}`).join('\n')}`,
    );
  }

  return taskDefinition;
}

export function validateTaskDefinition(value: unknown): ValidationResult {
  const task = value as Partial<TaskDefinition>;
  const errors: string[] = [];

  if (!task || typeof task !== 'object') {
    return { parsed: null, errors: ['루트 값은 객체여야 합니다.'] };
  }

  if (!task.metadata || typeof task.metadata !== 'object') {
    errors.push('metadata 객체가 필요합니다.');
  }

  if (!task.context || typeof task.context !== 'object') {
    errors.push('context 객체가 필요합니다.');
  }

  if (!Array.isArray(task.requirements) || task.requirements.length === 0) {
    errors.push('requirements 배열이 비어 있으면 안 됩니다.');
  }

  if (!task.artifact_format || typeof task.artifact_format !== 'object') {
    errors.push('artifact_format 객체가 필요합니다.');
  }

  if (!Array.isArray(task.test_cases) || task.test_cases.length === 0) {
    errors.push('test_cases 배열이 비어 있으면 안 됩니다.');
  }

  if (!task.constraints || typeof task.constraints !== 'object') {
    errors.push('constraints 객체가 필요합니다.');
  }

  assertString(task.metadata?.id, 'metadata.id', errors);
  assertString(task.metadata?.title, 'metadata.title', errors);
  assertString(task.metadata?.category, 'metadata.category', errors);
  assertOneOf(task.metadata?.difficulty, 'metadata.difficulty', ['easy', 'medium', 'hard'], errors);
  assertNumber(task.metadata?.estimated_minutes, 'metadata.estimated_minutes', errors);
  assertNumber(task.metadata?.version, 'metadata.version', errors);
  assertString(task.metadata?.author, 'metadata.author', errors);
  assertString(task.metadata?.created_at, 'metadata.created_at', errors);

  assertString(task.context?.background, 'context.background', errors);
  assertString(task.context?.scenario, 'context.scenario', errors);
  assertString(task.artifact_format?.type, 'artifact_format.type', errors);
  assertString(task.artifact_format?.language, 'artifact_format.language', errors);
  if (task.artifact_format?.stub != null) {
    assertString(task.artifact_format.stub, 'artifact_format.stub', errors);
  }

  task.requirements?.forEach((requirement, index) => {
    assertString(requirement?.id, `requirements[${index}].id`, errors);
    assertString(requirement?.description, `requirements[${index}].description`, errors);
    if (requirement?.weight != null) {
      assertNumber(requirement.weight, `requirements[${index}].weight`, errors);
    }
  });

  task.test_cases?.forEach((testCase, index) => {
    assertString(testCase?.id, `test_cases[${index}].id`, errors);
    assertOneOf(
      testCase?.type,
      `test_cases[${index}].type`,
      ['positive', 'negative', 'edge_case', 'error_handling'],
      errors,
    );

    if (testCase?.description != null) {
      assertString(testCase.description, `test_cases[${index}].description`, errors);
    }

    if (testCase?.expected_output == null && testCase?.expected_matches == null) {
      errors.push(
        `test_cases[${index}]는 expected_output 또는 expected_matches 중 하나가 필요합니다.`,
      );
    }
  });

  assertNumber(task.constraints?.max_attempts, 'constraints.max_attempts', errors);
  assertNumber(task.constraints?.time_limit_seconds, 'constraints.time_limit_seconds', errors);
  if (
    task.constraints?.forbidden_patterns != null &&
    !Array.isArray(task.constraints.forbidden_patterns)
  ) {
    errors.push('constraints.forbidden_patterns는 배열이어야 합니다.');
  }

  if (task.baseline) {
    if (task.baseline.median_total_tokens != null) {
      assertNumber(task.baseline.median_total_tokens, 'baseline.median_total_tokens', errors);
    }
    if (task.baseline.median_attempts != null) {
      assertNumber(task.baseline.median_attempts, 'baseline.median_attempts', errors);
    }
    if (task.baseline.median_time_seconds != null) {
      assertNumber(task.baseline.median_time_seconds, 'baseline.median_time_seconds', errors);
    }
    if (task.baseline.computed_from_sessions != null) {
      assertNumber(task.baseline.computed_from_sessions, 'baseline.computed_from_sessions', errors);
    }
  }

  return {
    parsed: errors.length === 0 ? (task as TaskDefinition) : null,
    errors,
  };
}

function assertString(value: unknown, label: string, errors: string[]): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${label}는 비어 있지 않은 문자열이어야 합니다.`);
  }
}

function assertNumber(value: unknown, label: string, errors: string[]): void {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    errors.push(`${label}는 숫자여야 합니다.`);
  }
}

function assertOneOf(value: unknown, label: string, allowed: string[], errors: string[]): void {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    errors.push(`${label}는 ${allowed.join(', ')} 중 하나여야 합니다.`);
  }
}
