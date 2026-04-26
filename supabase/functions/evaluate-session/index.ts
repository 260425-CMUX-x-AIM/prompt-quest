import { runEvaluationPipeline } from './pipeline.ts';

Deno.serve(async (request) => {
  const { sessionId } = await request.json();

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return new Response(JSON.stringify({ error: 'sessionId가 필요합니다.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  EdgeRuntime.waitUntil(runEvaluationPipeline(sessionId));

  return new Response(JSON.stringify({ status: 'started' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
