/**
 * EcoTrack Eco-Token Engine
 *
 * Manages token earning rules, spending validation, and optimistic balance updates.
 * Fully client-side — syncs to Firestore when available.
 */

import type { TokenTransactionType, TokenTransaction, TokenBalance } from '@/types/social';

// ─── Earning Rules ────────────────────────────────────────────────────────────

export const TOKEN_EARN_RULES: Record<string, { tokens: number; label: string; maxPerDay?: number }> = {
  first_calculation: { tokens: 100, label: '🎉 First footprint calculation' },
  daily_login: { tokens: 10, label: '📅 Daily check-in', maxPerDay: 1 },
  streak_7: { tokens: 75, label: '🔥 7-day streak bonus' },
  streak_30: { tokens: 300, label: '🏆 30-day streak bonus' },
  streak_100: { tokens: 1000, label: '💎 100-day streak bonus' },
  below_national_avg: { tokens: 200, label: '📉 Below national average' },
  paris_aligned: { tokens: 500, label: '🌍 Paris Agreement aligned' },
  reduce_10_percent: { tokens: 150, label: '📊 10% reduction achieved' },
  reduce_25_percent: { tokens: 400, label: '📊 25% reduction achieved' },
  reduce_50_percent: { tokens: 1000, label: '📊 50% reduction achieved' },
  complete_challenge: { tokens: 250, label: '⚡ Challenge completed' },
  win_league: { tokens: 500, label: '🥇 League winner' },
  offset_purchase: { tokens: 100, label: '🌿 Carbon offset purchased' },
  tree_donation: { tokens: 50, label: '🌳 Tree donated' },
  receipt_scan: { tokens: 25, label: '📷 Receipt scanned', maxPerDay: 5 },
  connect_bank: { tokens: 200, label: '🏦 Bank account connected' },
  connect_iot: { tokens: 150, label: '🏠 Smart device connected' },
  referral: { tokens: 300, label: '👥 Friend referred' },
};

// ─── Redemption Rules ─────────────────────────────────────────────────────────

export const TOKEN_REDEMPTION_RULES = {
  /** Minimum balance required to redeem any offer */
  minimumBalance: 50,
  /** Maximum tokens redeemable per transaction */
  maxPerTransaction: 10000,
};

// ─── Token Math ───────────────────────────────────────────────────────────────

/**
 * Generate a new token earn transaction.
 */
export function createEarnTransaction(
  type: TokenTransactionType,
  currentBalance: number,
  metadata?: Record<string, unknown>,
): TokenTransaction {
  const rule = TOKEN_EARN_RULES[type];
  const amount = rule?.tokens ?? 10;
  const label = rule?.label ?? `Earned: ${type}`;

  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    amount,
    balance: currentBalance + amount,
    label,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

/**
 * Generate a token spend transaction.
 */
export function createSpendTransaction(
  type: TokenTransactionType,
  amount: number,
  currentBalance: number,
  label: string,
  metadata?: Record<string, unknown>,
): TokenTransaction | null {
  if (currentBalance < amount) return null; // insufficient balance

  return {
    id: `spend_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    amount: -amount, // negative = spend
    balance: currentBalance - amount,
    label,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

/**
 * Validate whether a redemption is possible.
 */
export function validateRedemption(
  tokenCost: number,
  currentBalance: TokenBalance,
): { valid: boolean; reason?: string } {
  if (currentBalance.available < TOKEN_REDEMPTION_RULES.minimumBalance) {
    return { valid: false, reason: `You need at least ${TOKEN_REDEMPTION_RULES.minimumBalance} tokens to redeem` };
  }
  if (currentBalance.available < tokenCost) {
    return {
      valid: false,
      reason: `You need ${tokenCost} tokens but only have ${currentBalance.available}`,
    };
  }
  if (tokenCost > TOKEN_REDEMPTION_RULES.maxPerTransaction) {
    return { valid: false, reason: 'Redemption amount exceeds single transaction limit' };
  }
  return { valid: true };
}

/**
 * Check if a daily-limited action has already been performed today.
 * Checks the transaction ledger for same-type transactions today.
 */
export function canEarnToday(
  type: TokenTransactionType,
  recentTransactions: TokenTransaction[],
): boolean {
  const rule = TOKEN_EARN_RULES[type];
  if (!rule?.maxPerDay) return true;

  const today = new Date().toISOString().split('T')[0];
  const todayCount = recentTransactions.filter(
    (tx) => tx.type === type && tx.timestamp.startsWith(today) && tx.amount > 0,
  ).length;

  return todayCount < rule.maxPerDay;
}

/**
 * Calculate the level title based on lifetime tokens earned.
 */
export function getTokenLevel(lifetimeTokens: number): {
  level: number;
  title: string;
  emoji: string;
  nextLevelAt: number;
  progressPercent: number;
} {
  const levels = [
    { min: 0, title: 'Seedling', emoji: '🌱' },
    { min: 250, title: 'Sprout', emoji: '🌿' },
    { min: 750, title: 'Eco Ally', emoji: '🍃' },
    { min: 1500, title: 'Green Guardian', emoji: '🌳' },
    { min: 3000, title: 'Climate Hero', emoji: '⚡' },
    { min: 6000, title: 'Earth Champion', emoji: '🌍' },
    { min: 12000, title: 'Carbon Neutral', emoji: '♻️' },
    { min: 25000, title: 'Net Zero Legend', emoji: '🌟' },
  ];

  const levelIndex = levels.reduce((idx, lvl, i) => (lifetimeTokens >= lvl.min ? i : idx), 0);
  const current = levels[levelIndex];
  const next = levels[levelIndex + 1];

  const nextLevelAt = next?.min ?? current.min * 3;
  const prevMin = current.min;
  const progressPercent = next
    ? Math.min(100, ((lifetimeTokens - prevMin) / (nextLevelAt - prevMin)) * 100)
    : 100;

  return {
    level: levelIndex + 1,
    title: current.title,
    emoji: current.emoji,
    nextLevelAt,
    progressPercent,
  };
}
