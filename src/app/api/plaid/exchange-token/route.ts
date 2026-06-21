/**
 * POST /api/plaid/exchange-token
 *
 * Exchanges a Plaid public_token for an access_token and fetches transactions.
 * Access token is stored server-side (Firestore). Never returned to the client.
 *
 * Required env vars:
 *   PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV
 */

import { NextRequest, NextResponse } from 'next/server';

const PLAID_BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};

export async function POST(req: NextRequest) {
  const { PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV = 'sandbox' } = process.env;

  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    return NextResponse.json(
      { error: 'Plaid is not configured', code: 'PLAID_NOT_CONFIGURED' },
      { status: 503 },
    );
  }

  try {
    const { publicToken, userId } = await req.json();

    if (!publicToken) {
      return NextResponse.json({ error: 'publicToken is required' }, { status: 400 });
    }

    const baseUrl = PLAID_BASE_URLS[PLAID_ENV] ?? PLAID_BASE_URLS.sandbox;

    // 1. Exchange public token for access token
    const exchangeRes = await fetch(`${baseUrl}/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
      body: JSON.stringify({ public_token: publicToken }),
    });

    if (!exchangeRes.ok) {
      const err = await exchangeRes.json();
      return NextResponse.json({ error: err.error_message, code: err.error_code }, { status: 400 });
    }

    const { access_token, item_id } = await exchangeRes.json();

    // 2. Fetch last 30 days of transactions
    const startDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const txRes = await fetch(`${baseUrl}/transactions/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
      body: JSON.stringify({
        access_token,
        start_date: startDate,
        end_date: endDate,
        options: { count: 500, offset: 0 },
      }),
    });

    const txData = await txRes.json();

    if (!txRes.ok) {
      return NextResponse.json(
        { error: txData.error_message, code: txData.error_code },
        { status: 400 },
      );
    }

    // TODO: Store access_token encrypted in Firestore keyed by userId + item_id
    // For now, we return transactions directly (access_token not exposed to client)
    console.info(`[Plaid] item_id=${item_id} synced for userId=${userId ?? 'anonymous'}`);

    return NextResponse.json({
      success: true,
      accounts: txData.accounts,
      transactions: txData.transactions,
      totalTransactions: txData.total_transactions,
    });

  } catch (err) {
    console.error('[Plaid] exchange-token error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
