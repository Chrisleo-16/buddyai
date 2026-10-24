import { Router } from 'express';
import { z } from 'zod';
import { InventoryItem } from '../models/index.js';
import { requireRole } from '../middleware/auth.js';
const r = Router();
r.get('/', async (_req, res) => res.json(await InventoryItem.find().populate('unit', 'name code').sort({ sku: 1 }).lean()));
const Item = z.object({ sku: z.string().min(2), name: z.object({ en: z.string(), sw: z.string().optional() }), category: z.string().optional(), unit: z.string().optional(), quantity: z.number().int().min(0), reorderLevel: z.number().int().min(0) });
r.post('/', requireRole('supervisor', 'admin'), async (req, res) => {
  const p = Item.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'invalid_input' });
  res.status(201).json(await InventoryItem.create(p.data));
});
r.patch('/:id', requireRole('supervisor', 'admin'), async (req, res) => {
  const q = z.object({ quantity: z.number().int().min(0) }).safeParse(req.body);
  if (!q.success) return res.status(400).json({ error: 'invalid_input' });
  res.json(await InventoryItem.findByIdAndUpdate(req.params.id, q.data, { new: true }));
});
export default r;
