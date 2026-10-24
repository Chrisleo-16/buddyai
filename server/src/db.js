import mongoose from 'mongoose';
import { config } from './config.js';

let memServer = null;

/** Connect to MONGO_URI, or spin up an in-memory MongoDB for zero-setup dev/tests. */
export async function connectDb(uri = config.mongoUri) {
  let target = uri;
  if (!target) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memServer = await MongoMemoryServer.create();
    target = memServer.getUri();
    console.log('[db] using in-memory MongoDB (data resets on restart)');
  }
  await mongoose.connect(target);
  return { inMemory: !!memServer };
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memServer) await memServer.stop();
  memServer = null;
}
