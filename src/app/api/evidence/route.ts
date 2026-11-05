import { NextResponse } from 'next/server';
import discovery from '../../../../evidence/discovery.json';
import smoke from '../../../../evidence/smoke.json';
import verification from '../../../../evidence/verification.json';
import mcpStatus from '../../../../evidence/mcp-status.json';
import budgetReport from '../../../../evidence/budget-operator-report.json';
import routingProduction from '../../../../evidence/routing-production.json';
export function GET(request: Request) {
  const file = new URL(request.url).searchParams.get('file');
  return file === 'discovery.json'
    ? NextResponse.json(discovery)
    : file === 'smoke.json'
      ? NextResponse.json(smoke)
      : file === 'verification.json'
        ? NextResponse.json(verification)
        : file === 'mcp-status.json'
          ? NextResponse.json(mcpStatus)
          : file === 'routing-production.json'
            ? NextResponse.json(routingProduction)
            : file === 'budget-operator-report.json'
              ? NextResponse.json(budgetReport)
              : NextResponse.json({ error: 'Unknown evidence file.' }, { status: 404 });
}
