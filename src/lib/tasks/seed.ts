import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTaskDefinition } from '@/lib/tasks/parser';
import type { TaskDefinition } from '@/lib/types/task';

export interface SeedTaskFile {
  fileName: string;
  yaml: string;
  definition: TaskDefinition;
}

export function readSeedTaskFiles(baseDir: string = process.cwd()): SeedTaskFile[] {
  const taskDir = join(baseDir, 'tasks', 'seed');

  return readdirSync(taskDir)
    .filter((fileName) => fileName.endsWith('.yaml'))
    .sort()
    .map((fileName) => {
      const yaml = readFileSync(join(taskDir, fileName), 'utf-8');
      return {
        fileName,
        yaml,
        definition: parseTaskDefinition(yaml),
      };
    });
}
