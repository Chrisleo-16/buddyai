import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  demoMode: process.env.DEMO_MODE === 'true',
  demoLatencyMs: Number(process.env.DEMO_LATENCY_MS || 1500),
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  gemma: {
    provider: (process.env.GEMMA_PROVIDER || 'gemini').toLowerCase(),
    // Live checks: the 26B MoE (4B active) is far faster and steadier than 31B on the Gemini API.
    visionModel: process.env.GEMMA_VISION_MODEL || 'gemma-4-26b-a4b-it',
    fallbackVisionModel: process.env.GEMMA_FALLBACK_VISION_MODEL || 'gemma-4-31b-it',
    // End-of-session coaching summary (text only, not latency critical).
    textModel: process.env.GEMMA_TEXT_MODEL || 'gemma-4-31b-it',
    // Gemma 4 thinking is on/off: 'minimal' = off, 'high' = on.
    liveThinking: process.env.GEMMA_LIVE_THINKING || 'minimal',
    liveMaxOutputTokens: Number(process.env.GEMMA_LIVE_MAX_TOKENS || 320),
    timeoutMs: Number(process.env.GEMMA_TIMEOUT_MS || 45000),
    retries: Number(process.env.GEMMA_RETRIES ?? 1),
    ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'gemma4',
  },
  sms: {
    enabled: process.env.AT_SMS_ENABLED === 'true',
    username: process.env.AT_USERNAME || '',
    apiKey: process.env.AT_API_KEY || '',
    supervisorPhone: process.env.AT_SUPERVISOR_PHONE || '',
    riskThreshold: Number(process.env.AT_RISK_THRESHOLD || 70),
  },
};
