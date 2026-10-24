import { Router } from 'express';
import { Protocol } from '../models/index.js';
const r = Router();
r.get('/', async (_req, res) => res.json(await Protocol.find().sort({ kind: -1 }).lean()));
r.get('/:key', async (req, res) => {
  const p = await Protocol.findOne({ key: req.params.key }).lean();
  p ? res.json(p) : res.status(404).json({ error: 'not_found' });
});
export default r;
