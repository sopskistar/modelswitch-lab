import { NextResponse } from 'next/server';
import discovery from '../../../../evidence/discovery.json';
import smoke from '../../../../evidence/smoke.json';
import verification from '../../../../evidence/verification.json';
export function GET(request: Request) {
  const file = new URL(request.url).searchParams.get('file');
  return file === 'discovery.json'
    ? NextResponse.json(discovery)
    : file === 'smoke.json'
      ? NextResponse.json(smoke)
      : file === 'verification.json'
        ? NextResponse.json(verification)
        : NextResponse.json({ error: 'Unknown evidence file.' }, { status: 404 });
}
