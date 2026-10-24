import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', testTimeout: 60000, hookTimeout: 120000, fileParallelism: false, env: { NODE_ENV: 'test', GEMMA_PROVIDER: 'mock', MONGO_URI: '' } } });
