import { Router, Request, Response } from 'express';

type PlanId = 'free' | 'starter' | 'pro' | 'scale';
type StripeSubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

interface StripeCustomer {
  id: string;
  email?: string | null;
}

interface StripePrice {
  id: string;
}

interface StripeSubscriptionItem {
  price?: StripePrice | null;
}

interface StripeSubscription {
  id: string;
  status: StripeSubscriptionStatus;
  items?: {
    data?: StripeSubscriptionItem[];
  };
}

interface StripeCheckoutSession {
  id: string;
  url?: string | null;
  customer?: string | StripeCustomer | null;
  customer_email?: string | null;
  subscription?: string | StripeSubscription | null;
  payment_status?: string | null;
  status?: string | null;
  metadata?: Record<string, string>;
}

const router = Router();

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

const PLAN_PRICE_ENV: Record<Exclude<PlanId, 'free'>, string> = {
  starter: 'STRIPE_PRICE_STARTER',
  pro: 'STRIPE_PRICE_PRO',
  scale: 'STRIPE_PRICE_SCALE',
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set<StripeSubscriptionStatus>([
  'trialing',
  'active',
  'past_due',
]);

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }
  return key;
}

function getFrontendUrl(): string {
  return process.env.FRONTEND_URL ?? 'http://localhost:3001';
}

function getStripePriceId(planId: PlanId): string | null {
  if (planId === 'free') return null;
  const envName = PLAN_PRICE_ENV[planId];
  return process.env[envName] ?? null;
}

function getPlanIdFromPriceId(priceId?: string | null): PlanId {
  if (!priceId) return 'free';

  for (const [planId, envName] of Object.entries(PLAN_PRICE_ENV) as Array<
    [Exclude<PlanId, 'free'>, string]
  >) {
    if (process.env[envName] === priceId) return planId;
  }

  return 'free';
}

function buildStripeBody(
  payload: Record<string, string | number | boolean | null | undefined>
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === '') continue;
    params.append(key, String(value));
  }

  return params.toString();
}

async function stripeRequest<T>(
  path: string,
  init?: {
    method?: 'GET' | 'POST';
    body?: Record<string, string | number | boolean | null | undefined>;
  }
): Promise<T> {
  const method = init?.method ?? 'GET';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getStripeSecretKey()}`,
  };

  let body: string | undefined;
  if (init?.body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = buildStripeBody(init.body);
  }

  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers,
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

async function getSubscriptionById(subscriptionId: string): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`);
}

async function getCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
  return stripeRequest<StripeCheckoutSession>(
    `/checkout/sessions/${sessionId}?expand[]=customer&expand[]=subscription`
  );
}

async function getActiveSubscriptionForCustomer(
  customerId: string
): Promise<StripeSubscription | null> {
  const result = await stripeRequest<{ data: StripeSubscription[] }>(
    `/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=10`
  );

  return (
    result.data.find((subscription) =>
      ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
    ) ?? null
  );
}

function hasActiveSubscription(subscription: StripeSubscription | null): boolean {
  return Boolean(subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status));
}

function planIdFromSubscription(subscription: StripeSubscription | null): PlanId {
  if (!hasActiveSubscription(subscription)) return 'free';
  const priceId = subscription?.items?.data?.[0]?.price?.id;
  return getPlanIdFromPriceId(priceId);
}

router.post('/checkout-session', async (req: Request, res: Response) => {
  const { planId, email, customerId, successUrl, cancelUrl, promoCode } = req.body as {
    planId?: PlanId;
    email?: string;
    customerId?: string;
    successUrl?: string;
    cancelUrl?: string;
    promoCode?: string;
  };

  if (!planId || !['starter', 'pro', 'scale'].includes(planId)) {
    res.status(400).json({ error: 'A paid planId is required.' });
    return;
  }

  const priceId = getStripePriceId(planId);
  if (!priceId) {
    res.status(500).json({ error: `Stripe price is not configured for ${planId}.` });
    return;
  }

  try {
    const frontendUrl = getFrontendUrl();

    // Resolve promo code to a Stripe promotion_code ID if provided
    let resolvedPromoId: string | undefined;
    if (promoCode) {
      try {
        const promoResult = await stripeRequest<{ data: { id: string; active: boolean }[] }>(
          `/promotion_codes?code=${encodeURIComponent(promoCode)}&active=true&limit=1`
        );
        resolvedPromoId = promoResult.data[0]?.id;
      } catch {
        // Invalid promo code — ignore and let Stripe handle it
      }
    }

    const session = await stripeRequest<StripeCheckoutSession>('/checkout/sessions', {
      method: 'POST',
      body: {
        mode: 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': 1,
        success_url:
          successUrl ??
          `${frontendUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl ?? `${frontendUrl}/pricing?checkout=canceled`,
        ...(resolvedPromoId
          ? { 'discounts[0][promotion_code]': resolvedPromoId }
          : { allow_promotion_codes: true }),
        ...(customerId ? { customer: customerId } : {}),
        ...(!customerId && email ? { customer_email: email } : {}),
        'metadata[planId]': planId,
      },
    });

    res.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error('[Route] /api/billing/checkout-session error:', err?.message ?? err);
    res.status(500).json({ error: err?.message ?? 'Unable to create checkout session.' });
  }
});

router.post('/portal-session', async (req: Request, res: Response) => {
  const { customerId, returnUrl } = req.body as {
    customerId?: string;
    returnUrl?: string;
  };

  if (!customerId) {
    res.status(400).json({ error: 'customerId is required.' });
    return;
  }

  try {
    const session = await stripeRequest<{ url: string }>('/billing_portal/sessions', {
      method: 'POST',
      body: {
        customer: customerId,
        return_url: returnUrl ?? `${getFrontendUrl()}/settings`,
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[Route] /api/billing/portal-session error:', err?.message ?? err);
    res.status(500).json({ error: err?.message ?? 'Unable to create billing portal session.' });
  }
});

router.get('/session/:sessionId', async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;

  try {
    const session = await getCheckoutSession(sessionId);
    const customer =
      typeof session.customer === 'string' ? { id: session.customer } : session.customer;
    const subscription =
      typeof session.subscription === 'string'
        ? await getSubscriptionById(session.subscription)
        : session.subscription ?? null;

    res.json({
      sessionId: session.id,
      customerId: customer?.id ?? null,
      email: customer?.email ?? session.customer_email ?? null,
      paymentStatus: session.payment_status ?? null,
      checkoutStatus: session.status ?? null,
      planId: planIdFromSubscription(subscription),
      subscriptionStatus: hasActiveSubscription(subscription) ? subscription?.status ?? null : null,
    });
  } catch (err: any) {
    console.error('[Route] /api/billing/session/:sessionId error:', err?.message ?? err);
    res.status(500).json({ error: err?.message ?? 'Unable to load checkout session.' });
  }
});

router.get('/subscription', async (req: Request, res: Response) => {
  const customerId = String(req.query.customerId ?? '');

  if (!customerId) {
    res.status(400).json({ error: 'customerId is required.' });
    return;
  }

  try {
    const subscription = await getActiveSubscriptionForCustomer(customerId);
    res.json({
      customerId,
      planId: planIdFromSubscription(subscription),
      subscriptionStatus: hasActiveSubscription(subscription) ? subscription?.status ?? null : null,
      hasActiveSubscription: hasActiveSubscription(subscription),
    });
  } catch (err: any) {
    console.error('[Route] /api/billing/subscription error:', err?.message ?? err);
    res.status(500).json({ error: err?.message ?? 'Unable to load subscription.' });
  }
});

export default router;
