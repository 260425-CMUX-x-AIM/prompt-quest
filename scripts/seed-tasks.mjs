import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const taskDir = join(repoRoot, 'tasks', 'seed');

function assertEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 필요합니다.`);
  }

  return value;
}

function validateTaskDefinition(definition, fileName) {
  if (!definition?.metadata?.id) {
    throw new Error(`${fileName}: metadata.id가 필요합니다.`);
  }

  if (!Array.isArray(definition.requirements) || definition.requirements.length === 0) {
    throw new Error(`${fileName}: requirements가 비어 있습니다.`);
  }

  if (!Array.isArray(definition.test_cases) || definition.test_cases.length === 0) {
    throw new Error(`${fileName}: test_cases가 비어 있습니다.`);
  }
}

async function main() {
  const supabase = createClient(assertEnv('SUPABASE_URL'), assertEnv('SUPABASE_SERVICE_ROLE_KEY'));
  const files = readdirSync(taskDir)
    .filter((file) => file.endsWith('.yaml'))
    .sort();

  for (const file of files) {
    const yaml = readFileSync(join(taskDir, file), 'utf-8');
    const definition = parse(yaml);
    validateTaskDefinition(definition, file);

    const { error } = await supabase.from('tasks').upsert(
      {
        slug: definition.metadata.id,
        title: definition.metadata.title,
        category_slug: definition.metadata.category,
        difficulty: definition.metadata.difficulty,
        yaml_definition: yaml,
        is_published: true,
        published_at: new Date().toISOString(),
      },
      { onConflict: 'slug' },
    );

    if (error) {
      throw new Error(`${file}: ${error.message}`);
    }

    console.log(`Seeded: ${definition.metadata.id}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
