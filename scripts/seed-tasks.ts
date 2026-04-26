import { createClient } from '@supabase/supabase-js';
import { stringify as stringifyYaml } from 'yaml';
import { HARD_CODED_CHALLENGES, type ChallengeDefinition } from '@/lib/challenge';
import type { TaskDefinition } from '@/lib/types/task';

const CATEGORY_LABELS: Record<
  string,
  { label_ko: string; label_en: string; display_order: number }
> = {
  implementation: { label_ko: '구현', label_en: 'Implementation', display_order: 1 },
  diagnosis: { label_ko: '진단/디버깅', label_en: 'Diagnosis', display_order: 2 },
  review: { label_ko: '코드 리뷰', label_en: 'Review', display_order: 3 },
  component: { label_ko: 'UI 컴포넌트', label_en: 'Component', display_order: 4 },
  architecture: { label_ko: '아키텍처', label_en: 'Architecture', display_order: 5 },
  test: { label_ko: '테스트', label_en: 'Testing', display_order: 6 },
  security: { label_ko: '보안', label_en: 'Security', display_order: 7 },
  communication: { label_ko: '커뮤니케이션', label_en: 'Communication', display_order: 8 },
  creative: { label_ko: '크리에이티브', label_en: 'Creative', display_order: 9 },
  analysis: { label_ko: '분석', label_en: 'Analysis', display_order: 10 },
  workflow: { label_ko: '워크플로우', label_en: 'Workflow', display_order: 11 },
  strategy: { label_ko: '전략', label_en: 'Strategy', display_order: 12 },
  sql: { label_ko: 'SQL', label_en: 'SQL', display_order: 13 },
};

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 필요합니다.`);
  }

  return value;
}

function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL || assertEnv('NEXT_PUBLIC_SUPABASE_URL');
}

function getSupabaseKey(): string {
  return assertEnv('SUPABASE_SERVICE_ROLE_KEY');
}

function inferArtifactType(challenge: ChallengeDefinition): string {
  if (challenge.outputFormat.toLowerCase().includes('regex')) return 'regex';
  if (challenge.starterArtifact.includes('```') || challenge.outputFormat.includes('function')) {
    return 'code';
  }
  return 'text';
}

function inferArtifactLanguage(challenge: ChallengeDefinition): string {
  if (
    challenge.starterArtifact.includes('sql') ||
    challenge.outputFormat.toLowerCase().includes('sql')
  ) {
    return 'sql';
  }
  if (challenge.outputFormat.toLowerCase().includes('json')) return 'json';
  if (challenge.outputFormat.toLowerCase().includes('markdown')) return 'markdown';
  if (challenge.category === 'component' || challenge.category === 'implementation')
    return 'typescript';
  return 'text';
}

function toTaskDefinition(challenge: ChallengeDefinition): TaskDefinition {
  return {
    metadata: {
      id: challenge.slug,
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
      estimated_minutes: challenge.estimatedMinutes,
      version: challenge.version,
      author: '운영자',
      created_at: '2026-04-26',
    },
    context: {
      background: challenge.sourceMaterial?.content ?? challenge.scenario,
      scenario: challenge.scenario,
      source_document: challenge.sourceDocument,
      input_spec: challenge.inputSpec,
      source_material: challenge.sourceMaterial,
      hidden_checks: challenge.hiddenChecks,
      pass_conditions: challenge.passConditions,
      high_score_guides: challenge.highScoreGuides,
      pattern_bonus: challenge.patternBonus,
    },
    requirements: challenge.requirements,
    artifact_format: {
      type: inferArtifactType(challenge),
      language: inferArtifactLanguage(challenge),
      stub: challenge.starterArtifact || challenge.outputFormat,
    },
    test_cases: challenge.testCases.map((testCase) => ({
      id: testCase.id,
      input: testCase.input ?? testCase.scenario ?? '',
      expected_output: testCase.expected,
      type: testCase.type,
      description: testCase.scenario,
    })),
    constraints: {
      max_attempts: challenge.maxAttempts,
      time_limit_seconds: challenge.estimatedMinutes * 120,
    },
    baseline: {
      median_total_tokens: challenge.baseline.totalTokens,
      median_attempts: challenge.baseline.attempts,
      median_time_seconds: challenge.baseline.timeSeconds,
      computed_from_sessions: 0,
    },
  };
}

async function main(): Promise<void> {
  const supabase = createClient(getSupabaseUrl(), getSupabaseKey());
  const publishedAt = new Date().toISOString();
  const categories = Object.entries(CATEGORY_LABELS).map(([slug, category]) => ({
    slug,
    ...category,
    is_active: true,
  }));

  const { error: categoryError } = await supabase
    .from('task_categories')
    .upsert(categories, { onConflict: 'slug' });

  if (categoryError) {
    throw new Error(`카테고리 seed 실패: ${categoryError.message}`);
  }

  for (const challenge of HARD_CODED_CHALLENGES) {
    const definition = toTaskDefinition(challenge);
    const yaml = stringifyYaml(definition);

    const { error } = await supabase.from('tasks').upsert(
      {
        slug: definition.metadata.id,
        title: definition.metadata.title,
        category_slug: definition.metadata.category,
        difficulty: definition.metadata.difficulty,
        estimated_minutes: definition.metadata.estimated_minutes,
        yaml_definition: yaml,
        is_published: true,
        published_at: publishedAt,
      },
      { onConflict: 'slug' },
    );

    if (error) {
      throw new Error(`${challenge.slug}: ${error.message}`);
    }

    console.log(`Seeded: ${definition.metadata.id}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
