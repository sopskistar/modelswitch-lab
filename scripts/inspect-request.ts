import { OtariClient, OtariError } from '../src/lib/otari';

const requestId = process.argv[2];
if (!requestId || !/^[0-9a-f-]{36}$/i.test(requestId)) {
  console.error('Usage: npm run otari:request -- <Otari request UUID>');
  process.exit(2);
}

try {
  const { body, headers } = await new OtariClient().request(`/usage/requests/${requestId}`);
  const safe = {
    requestId: typeof body.request_id === 'string' ? body.request_id : requestId,
    status: typeof body.status === 'string' ? body.status : null,
    costUsd:
      typeof body.cost_usd === 'string' || typeof body.cost_usd === 'number' ? body.cost_usd : null,
    promptTokens: typeof body.prompt_tokens === 'number' ? body.prompt_tokens : null,
    completionTokens: typeof body.completion_tokens === 'number' ? body.completion_tokens : null,
    totalTokens: typeof body.total_tokens === 'number' ? body.total_tokens : null,
    rowCount: typeof body.row_count === 'number' ? body.row_count : null,
    gatewayErrorCode: headers.get('otari-error-code'),
  };
  console.log(JSON.stringify(safe, null, 2));
} catch (error) {
  if (error instanceof OtariError) {
    console.error(
      JSON.stringify(
        { status: error.safe.status, code: error.safe.code, requestId: error.safe.requestId },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } else {
    console.error('Could not inspect the Otari usage record.');
    process.exitCode = 1;
  }
}
