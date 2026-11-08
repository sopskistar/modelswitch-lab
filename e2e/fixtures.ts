export const catalog = {
  configured: true,
  demoEnabled: true,
  region: 'US',
  roles: {
    evaluator: 'alibaba/qwen3.8-27b',
    analyst: 'meta/llama-3.3-70b-instruct',
    policy: 'modelswitch-fallback',
  },
  models: [
    { id: 'alibaba/qwen3.8-27b', name: 'Qwen3.8 27B' },
    { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
    { id: 'modelswitch-fallback' },
  ],
  tools: [
    { id: 'otari_web_fetch', available: false, reason: 'workspace_disabled' },
    { id: 'otari_code_execution', available: true },
  ],
};
