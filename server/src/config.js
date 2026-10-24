import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  gemma: {
    provider: (process.env.GEMMA_PROVIDER || 'gemini').toLowerCase(),
    visionModel: process.env.GEMMA_VISION_MODEL || 'gemma-4-31b-it',
    textModel: process.env.GEMMA_TEXT_MODEL || 'gemma-4-26b-a4b-it',
    timeoutMs: Number(process.env.GEMMA_TIMEOUT_MS || 75000),
    retries: Number(process.env.GEMMA_RETRIES ?? 2),
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
