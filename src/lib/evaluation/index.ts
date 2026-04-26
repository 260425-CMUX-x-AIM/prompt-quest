import { getChallengeDefinition } from '@/lib/challenge';
import { aggregateEvaluation } from '@/lib/evaluation/aggregator';
import { getEvaluationProviderConfig } from '@/lib/evaluation/providers';
import { analyzeQuantitative } from '@/lib/evaluation/quantitative';
import { judgeConversation } from '@/lib/evaluation/judge';
import type { EvaluationInput, EvaluationResult } from '@/lib/evaluation/types';
import { validateArtifact } from '@/lib/evaluation/validator';

export async function runEvaluationPipeline(input: EvaluationInput): Promise<EvaluationResult> {
  const challenge = getChallengeDefinition(input.slug);
  const config = getEvaluationProviderConfig();
  const validator = await validateArtifact(config, challenge, input.artifact);

  const quantitative = analyzeQuantitative(input, challenge.baseline);
  const judge = await judgeConversation(config, challenge, input.messages, input.artifact);

  return aggregateEvaluation({
    config,
    challenge,
    input,
    validator,
    quantitative,
    judge,
  });
}

export * from '@/lib/evaluation/types';
