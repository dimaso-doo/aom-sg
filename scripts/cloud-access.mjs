import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
export function existingOpenAI(){return parseEnv(readFileSync('/Users/home/Documents/Codex/2026-06-28/uzm/dimaso-audit-tool/.env.local','utf8')).OPENAI_API_KEY}
