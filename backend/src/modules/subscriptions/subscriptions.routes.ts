import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { serialize } from '../../utils/serialize.js';

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  amount: z.number().nonnegative().optional(),
  status: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  is_free_trial: z.boolean().optional(),
  trial_expiration_date: z.string().nullable().optional(),
  subscribed_by: z.string().nullable().optional(),
});

const idParam = z.object({ id: z.string().uuid() });

export const subscriptionsRouter = Router();
subscriptionsRouter.use(requireAuth);

// How many subscriptions lapse on or before a given date.
//
// The sidebar badge only ever needed this number, but previously pulled the
// entire subscriptions table on an interval, for every Admin/super-admin
// session, and counted client-side. Counting in the database sends back one
// integer instead.
//
// The cutoff is supplied by the caller rather than computed here on purpose:
// the sidebar derives it from the *browser's* local date, and moving that
// arithmetic to the server would shift the boundary by a day for anyone whose
// timezone differs from the server's. Same rows counted, same rule.
subscriptionsRouter.get(
  '/expiring-count',
  validate({ query: z.object({ before: z.string() }) }),
  asyncHandler(async (req, res) => {
    const before = new Date(req.query.before as string);
    // Strictly-before, not on-or-before. The client used to compare a
    // serialized timestamp ("2026-09-06T00:00:00.000Z") against a bare date
    // string ("2026-09-06"); lexically the longer string sorts greater, so a
    // subscription lapsing *exactly* on the cutoff never counted. `lt`
    // reproduces that exactly. (It is arguably an off-by-one in the original
    // rule — but changing which subscriptions the badge counts is a product
    // decision, not part of moving the count into the database.)
    const count = await prisma.subscription.count({
      where: {
        OR: [{ end_date: { lt: before } }, { trial_expiration_date: { lt: before } }],
      },
    });
    res.json({ count });
  }),
);

subscriptionsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.subscription.findMany({ orderBy: { created_at: 'desc' } });
    res.json(serialize(rows));
  }),
);

subscriptionsRouter.post(
  '/',
  validate({ body: bodySchema }),
  asyncHandler(async (req, res) => {
    const row = await prisma.subscription.create({ data: req.body });
    res.status(201).json(serialize(row));
  }),
);

subscriptionsRouter.patch(
  '/:id',
  validate({ params: idParam, body: bodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const row = await prisma.subscription.update({ where: { id: req.params.id }, data: req.body });
    res.json(serialize(row));
  }),
);

subscriptionsRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await prisma.subscription.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);
