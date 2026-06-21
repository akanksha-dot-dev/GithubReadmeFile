/**
 * POST /api/plaid/create-link-token
 *
 * Generates a Plaid Link token server-side.
 * The client NEVER sees the Plaid secret key.
 *
 * Required env vars:
 *   PLAID_CLIENT_ID
 *   PLAID_SECRET
 *   PLAID_ENV (sandbox | development | production)
 */

import { NextRequest, NextResponse } from 'next/server';

const PLAID_BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};

export async function POST(req: NextRequest) {
  const { PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV = 'sandbox' } = process.env;

  // Graceful degradation — return a clear error if keys are not configured
  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    return NextResponse.json(
      {
        error: 'Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET environment variables.',
        code: 'PLAID_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId ?? 'anonymous';

    const baseUrl = PLAID_BASE_URLS[PLAID_ENV] ?? PLAID_BASE_URLS.sandbox;

    const response = await fetch(`${baseUrl}/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
      body: JSON.stringify({
        client_name: 'EcoTrack',
        language: 'en',
        country_codes: ['US'],
        user: { client_user_id: userId },
        products: ['transactions'],
        // Request 30 days of transactions for carbon analysis
        transactions: { days_requested: 30 },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error_message ?? 'Plaid API error', code: error.error_code },
        { status: 400 },
      );
    }

    const data = await response.json();
    return NextResponse.json({ linkToken: data.link_token });

  } catch (err) {
    console.error('[Plaid] create-link-token error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
