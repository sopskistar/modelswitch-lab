import { NextResponse } from 'next/server';
import { demoEnabled, discover, roleModels } from '@/lib/server';
import { OtariError } from '@/lib/otari';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function GET() {
  const roles = roleModels();
  const base = {
    roles,
    demoEnabled: demoEnabled(),
    configured: Boolean(process.env.OTARI_API_KEY),
    region: process.env.OTARI_BASE_URL?.includes('eu.api.') ? 'EU' : 'US',
  };
  if (!base.configured)
    return NextResponse.json({
      ...base,
      models: [],
      tools: [],
      error: {
        code: 'configuration_required',
        message: 'Set OTARI_API_KEY and both role models on the server.',
      },
    });
  try {
    const data = await discover();
    const allowed = new Set([roles.evaluator, roles.analyst, roles.policy]);
    const missing = [roles.evaluator, roles.analyst].filter(
      (id) => !id || !data.models.some((m) => m.id === id),
    );
    return NextResponse.json(
      {
        ...base,
        models: data.models.filter((m) => allowed.has(m.id)),
        catalogCount: data.models.length,
        tools: data.tools,
        checkedAt: new Date(data.at).toISOString(),
        ...(missing.length
          ? {
              error: {
                code: 'model_unavailable',
                message:
                  'One or both configured role models are absent from the accessible Otari catalog.',
              },
            }
          : roles.evaluator === roles.analyst
            ? {
                error: {
                  code: 'distinct_roles_required',
                  message: 'Configure different evaluator and analyst models.',
                },
              }
            : {}),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return NextResponse.json(
      {
        ...base,
        models: [],
        tools: [],
        error:
          e instanceof OtariError
            ? e.safe
            : {
                code: 'discovery_failed',
                message: 'Could not validate the hosted catalog. Check server configuration.',
              },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
