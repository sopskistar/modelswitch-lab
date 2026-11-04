import { writeFile } from 'node:fs/promises';
import { OtariClient, OtariError } from '../src/lib/otari';
const client = new OtariClient();
const evidence: unknown[] = [];
for (const path of [
  '/models',
  '/tools',
  '/tool-settings/guardrails/profiles',
  '/routing/policies',
  '/budgets',
]) {
  try {
    const result = await client.request(path);
    // Never persist management bodies. Catalog and tool availability are public evidence.
    evidence.push({
      at: new Date().toISOString(),
      path,
      status: 200,
      ...(['/models', '/tools', '/tool-settings/guardrails/profiles'].includes(path)
        ? { data: result.body }
        : {}),
    });
    console.log(path, '200');
  } catch (e) {
    if (e instanceof OtariError) {
      evidence.push({ at: new Date().toISOString(), path, error: e.safe });
      console.log(path, e.safe.code);
    } else throw e;
  }
}
await writeFile('evidence/discovery.json', JSON.stringify(evidence, null, 2) + '\n');
