type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  [key: string]: unknown;
}

export function logEvent(level: LogLevel, event: string, payload: LogPayload = {}): void {
  const entry = {
    level,
    event,
    payload,
    timestamp: new Date().toISOString(),
  };

  if (level === 'error') {
    console.error(entry);
    return;
  }

  if (level === 'warn') {
    console.warn(entry);
    return;
  }

  console.info(entry);
}

export function logEvaluationStage(
  stage: 'validator' | 'quantitative' | 'judge' | 'aggregator',
  payload: LogPayload = {},
): void {
  logEvent('info', `evaluation.stage.${stage}`, payload);
}
