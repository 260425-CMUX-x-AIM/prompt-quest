import { describe, expect, it } from 'vitest';
import { getChallengeDefinition } from '@/lib/challenge';
import { readSeedTaskFiles } from '@/lib/tasks/seed';

describe('seed challenge consistency', () => {
  it('MVP seed task가 hardcoded challenge의 핵심 메타와 요구사항을 유지한다', () => {
    const seedFiles = readSeedTaskFiles();

    for (const seedFile of seedFiles) {
      const challenge = getChallengeDefinition(seedFile.definition.metadata.id);
      const task = seedFile.definition;

      expect(challenge.slug).toBe(task.metadata.id);
      expect(challenge.title).toBe(task.metadata.title);
      expect(challenge.difficulty).toBe(task.metadata.difficulty);
      expect(challenge.estimatedMinutes).toBe(task.metadata.estimated_minutes);
      expect(challenge.maxAttempts).toBe(task.constraints.max_attempts);
      expect(challenge.baseline.totalTokens).toBe(task.baseline?.median_total_tokens);
      expect(challenge.baseline.attempts).toBe(task.baseline?.median_attempts);
      expect(challenge.baseline.timeSeconds).toBe(task.baseline?.median_time_seconds);
      expect(challenge.requirements.map((item) => item.id)).toEqual(
        task.requirements.map((item) => item.id),
      );
      expect(challenge.testCases.map((item) => item.id)).toHaveLength(task.test_cases.length);
    }
  });
});
