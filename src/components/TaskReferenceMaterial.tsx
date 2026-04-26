import type { TaskDefinition } from '@/lib/types/task';

type TaskContext = TaskDefinition['context'];

interface SourceMaterialLike {
  title?: unknown;
  language?: unknown;
  content?: unknown;
}

function getSourceMaterial(context: TaskContext): SourceMaterialLike | null {
  const sourceMaterial = context.source_material;
  if (!sourceMaterial || typeof sourceMaterial !== 'object') return null;

  return sourceMaterial as SourceMaterialLike;
}

function cleanReferenceContent(content: string): string {
  return content.replace(/^다음 이커머스 데이터베이스 스키마를 사용합니다\.\n\n?/, '').trim();
}

export function getReferenceMaterial(context: TaskContext): {
  title: string;
  language: string;
  content: string;
} | null {
  const sourceMaterial = getSourceMaterial(context);
  const sourceContent =
    typeof sourceMaterial?.content === 'string'
      ? cleanReferenceContent(sourceMaterial.content)
      : '';

  if (sourceContent) {
    return {
      title: typeof sourceMaterial?.title === 'string' ? sourceMaterial.title : '제공 자료',
      language: typeof sourceMaterial?.language === 'string' ? sourceMaterial.language : 'text',
      content: sourceContent,
    };
  }

  const background = cleanReferenceContent(context.background);
  const scenario = context.scenario.trim();
  if (!background || background === scenario) return null;

  return {
    title: '제공 자료',
    language: /\bCREATE\s+TABLE\b/i.test(background) ? 'sql' : 'text',
    content: background,
  };
}

export default function TaskReferenceMaterial({ context }: { context: TaskContext }) {
  const reference = getReferenceMaterial(context);
  if (!reference) return null;

  return (
    <div className="mb-6">
      <div className="font-mono text-text-3 mb-2" style={{ fontSize: 10, letterSpacing: '0.08em' }}>
        REFERENCE · {reference.language.toUpperCase()}
      </div>
      <div className="border border-line rounded-md overflow-hidden bg-bg-1">
        <div
          className="font-mono text-text-3 border-b border-line bg-bg-2"
          style={{ fontSize: 10.5, padding: '7px 10px' }}
        >
          {reference.title}
        </div>
        <pre
          className="font-mono whitespace-pre overflow-x-auto custom-scroll"
          style={{
            fontSize: 11.5,
            lineHeight: 1.55,
            padding: '10px 12px',
            background: '#0a0c0f',
            maxHeight: 360,
          }}
        >
          {reference.content}
        </pre>
      </div>
    </div>
  );
}
