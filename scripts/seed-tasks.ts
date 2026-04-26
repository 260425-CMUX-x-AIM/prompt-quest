import { createClient } from '@supabase/supabase-js';
import { readSeedTaskFiles } from '@/lib/tasks/seed';

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 필요합니다.`);
  }

  return value;
}

async function main(): Promise<void> {
  const supabase = createClient(assertEnv('SUPABASE_URL'), assertEnv('SUPABASE_SERVICE_ROLE_KEY'));
  const seedFiles = readSeedTaskFiles();

  for (const seedFile of seedFiles) {
    const { definition, yaml } = seedFile;

    const { error } = await supabase.from('tasks').upsert(
      {
        slug: definition.metadata.id,
        title: definition.metadata.title,
        category_slug: definition.metadata.category,
        difficulty: definition.metadata.difficulty,
        estimated_minutes: definition.metadata.estimated_minutes,
        yaml_definition: yaml,
        is_published: true,
        published_at: new Date().toISOString(),
      },
      { onConflict: 'slug' },
    );

    if (error) {
      throw new Error(`${seedFile.fileName}: ${error.message}`);
    }

    console.log(`Seeded: ${definition.metadata.id}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
