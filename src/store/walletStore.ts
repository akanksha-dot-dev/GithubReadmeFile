/**
 * EcoTrack Wallet Store (Zustand)
 *
 * Manages Eco-Token balance and transaction ledger.
 * Uses optimistic updates — pending amount is shown immediately,
 * confirmed once Firestore acknowledges.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TokenTransaction, TokenBalance, TokenTransactionType } from '@/types/social';
import {
  createEarnTransaction,
  createSpendTransaction,
  canEarnToday,
  getTokenLevel,
  validateRedemption,
} from '@/lib/tokenEngine';

interface WalletState {
  balance: TokenBalance;
  transactions: TokenTransaction[];
  isSyncing: boolean;

  // Actions
  earnTokens: (type: TokenTransactionType, metadata?: Record<string, unknown>) => TokenTransaction | null;
  spendTokens: (type: TokenTransactionType, amount: number, label: string, metadata?: Record<string, unknown>) => TokenTransaction | null;
  addPendingTokens: (amount: number) => void;
  confirmPendingTokens: () => void;
  resetWallet: () => void;
  setSyncing: (v: boolean) => void;

  // Selectors
  getLevel: () => ReturnType<typeof getTokenLevel>;
  getRecentTransactions: (limit?: number) => TokenTransaction[];
}

const INITIAL_BALANCE: TokenBalance = {
  available: 0,
  lifetime: 0,
  pending: 0,
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: INITIAL_BALANCE,
      transactions: [],
      isSyncing: false,

      earnTokens: (type, metadata) => {
        const { balance, transactions } = get();

        // Check daily limits
        if (!canEarnToday(type, transactions)) return null;

        const tx = createEarnTransaction(type, balance.available, metadata);
        set((s) => ({
          balance: {
            available: s.balance.available + tx.amount,
            lifetime: s.balance.lifetime + tx.amount,
            pending: s.balance.pending,
          },
          transactions: [tx, ...s.transactions].slice(0, 500), // keep last 500
        }));
        return tx;
      },

      spendTokens: (type, amount, label, metadata) => {
        const { balance } = get();
        const validation = validateRedemption(amount, balance);
        if (!validation.valid) return null;

        const tx = createSpendTransaction(type, amount, balance.available, label, metadata);
        if (!tx) return null;

        set((s) => ({
          balance: {
            available: s.balance.available + tx.amount, // tx.amount is negative
            lifetime: s.balance.lifetime,
            pending: s.balance.pending,
          },
          transactions: [tx, ...s.transactions].slice(0, 500),
        }));
        return tx;
      },

      addPendingTokens: (amount) =>
        set((s) => ({ balance: { ...s.balance, pending: s.balance.pending + amount } })),

      confirmPendingTokens: () =>
        set((s) => ({
          balance: {
            available: s.balance.available + s.balance.pending,
            lifetime: s.balance.lifetime + s.balance.pending,
            pending: 0,
          },
        })),

      resetWallet: () => set({ balance: INITIAL_BALANCE, transactions: [] }),

      setSyncing: (v) => set({ isSyncing: v }),

      getLevel: () => getTokenLevel(get().balance.lifetime),

      getRecentTransactions: (limit = 20) => get().transactions.slice(0, limit),
    }),
    {
      name: 'ecotrack-wallet',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export const useTokenBalance = () => useWalletStore((s) => s.balance);
export const useTokenLevel = () => useWalletStore((s) => s.getLevel());
export const useEarnTokens = () => useWalletStore((s) => s.earnTokens);
export const useSpendTokens = () => useWalletStore((s) => s.spendTokens);
