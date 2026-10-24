import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const r = Router();
const Login = z.object({ email: z.string().email(), password: z.string().min(1) });
const Register = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) });

r.post('/login', async (req, res) => {
  const p = Login.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'invalid_input' });
  const u = await User.findOne({ email: p.data.email.toLowerCase() }).populate('unit');
  if (!u || !(await bcrypt.compare(p.data.password, u.passwordHash))) return res.status(401).json({ error: 'invalid_credentials' });
  res.json({ token: signToken(u), user: u.toSafe() });
});

r.post('/register', async (req, res) => {
  const p = Register.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'invalid_input' });
  if (await User.exists({ email: p.data.email.toLowerCase() })) return res.status(409).json({ error: 'email_taken' });
  const u = await User.create({ name: p.data.name, email: p.data.email, passwordHash: await bcrypt.hash(p.data.password, 10), role: 'worker' });
  res.status(201).json({ token: signToken(u), user: u.toSafe() });
});

r.get('/me', requireAuth, async (req, res) => {
  const u = await User.findById(req.user.sub).populate('unit');
  if (!u) return res.status(404).json({ error: 'not_found' });
  res.json({ user: u.toSafe() });
});

r.patch('/me', requireAuth, async (req, res) => {
  const lang = req.body?.language;
  const u = await User.findByIdAndUpdate(req.user.sub, lang ? { language: lang === 'sw' ? 'sw' : 'en' } : {}, { new: true });
  res.json({ user: u.toSafe() });
});
export default r;
