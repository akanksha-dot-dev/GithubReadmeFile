/**
 * EcoTrack Transaction → CO₂ Mapper
 *
 * Maps Plaid transaction categories and MCC codes to kgCO₂e emission factors.
 * Source: EPA SupplyChain GHG Emission Factors, CMU EIO-LCA model.
 *
 * All factors are in kgCO₂e per USD spent.
 */

import type { PlaidTransaction, MappedTransaction } from '@/types/integrations';
import type { EmissionCategory } from '@/types/carbon';

// ─── Plaid Category → Emission Factor Map ────────────────────────────────────

interface CategoryRule {
  ecoCategory: EmissionCategory | 'ignore';
  /** kgCO₂e per USD */
  factor: number;
  label: string;
}

/**
 * Maps Plaid's hierarchical category strings to emission factors.
 * Plaid provides categories as arrays like: ["Transportation", "Gas Stations"]
 * We match on the most specific (last) category first.
 */
const CATEGORY_RULES: Record<string, CategoryRule> = {
  // ── Transport ──────────────────────────────────────────────────────────────
  'Gas Stations': { ecoCategory: 'transport', factor: 0.41, label: 'Fuel purchase' },
  'Gasoline': { ecoCategory: 'transport', factor: 0.41, label: 'Fuel purchase' },
  'Auto Transport': { ecoCategory: 'transport', factor: 0.19, label: 'Car use' },
  'Car and Truck Rental': { ecoCategory: 'transport', factor: 0.22, label: 'Car rental' },
  'Parking': { ecoCategory: 'transport', factor: 0.05, label: 'Parking (indirect)' },
  'Tolls and Fees': { ecoCategory: 'transport', factor: 0.04, label: 'Road tolls' },
  'Airlines': { ecoCategory: 'transport', factor: 0.18, label: 'Flight' },
  'Air Travel': { ecoCategory: 'transport', factor: 0.18, label: 'Flight' },
  'Public Transportation': { ecoCategory: 'transport', factor: 0.03, label: 'Transit' },
  'Taxis': { ecoCategory: 'transport', factor: 0.16, label: 'Taxi/rideshare' },
  'Ride Share': { ecoCategory: 'transport', factor: 0.16, label: 'Rideshare' },
  'Lyft': { ecoCategory: 'transport', factor: 0.16, label: 'Rideshare' },
  'Uber': { ecoCategory: 'transport', factor: 0.16, label: 'Rideshare' },
  'Car Service': { ecoCategory: 'transport', factor: 0.16, label: 'Rideshare' },
  'Boat': { ecoCategory: 'transport', factor: 0.12, label: 'Ferry/boat' },
  'Car Repair and Maintenance': { ecoCategory: 'transport', factor: 0.08, label: 'Vehicle maintenance' },

  // ── Energy ─────────────────────────────────────────────────────────────────
  'Utilities': { ecoCategory: 'energy', factor: 0.25, label: 'Utility bill' },
  'Electric': { ecoCategory: 'energy', factor: 0.22, label: 'Electricity bill' },
  'Natural Gas': { ecoCategory: 'energy', factor: 0.31, label: 'Gas bill' },
  'Heating Oil': { ecoCategory: 'energy', factor: 0.35, label: 'Heating oil' },
  'Home Improvement': { ecoCategory: 'energy', factor: 0.12, label: 'Home materials' },

  // ── Diet ───────────────────────────────────────────────────────────────────
  'Groceries': { ecoCategory: 'diet', factor: 0.023, label: 'Grocery shopping' },
  'Supermarkets and Groceries': { ecoCategory: 'diet', factor: 0.023, label: 'Grocery shopping' },
  'Restaurants': { ecoCategory: 'diet', factor: 0.031, label: 'Dining out' },
  'Fast Food': { ecoCategory: 'diet', factor: 0.028, label: 'Fast food' },
  'Coffee Shop': { ecoCategory: 'diet', factor: 0.019, label: 'Coffee shop' },
  'Food and Drink': { ecoCategory: 'diet', factor: 0.025, label: 'Food & drink' },
  'Bakeries': { ecoCategory: 'diet', factor: 0.018, label: 'Bakery' },
  'Alcohol': { ecoCategory: 'diet', factor: 0.021, label: 'Alcohol' },
  'Farmers Markets': { ecoCategory: 'diet', factor: 0.012, label: 'Farmers market' },
  'Food Delivery': { ecoCategory: 'diet', factor: 0.035, label: 'Food delivery' },

  // ── Consumption ────────────────────────────────────────────────────────────
  'Clothing and Apparel': { ecoCategory: 'consumption', factor: 0.028, label: 'Clothing' },
  'Department Stores': { ecoCategory: 'consumption', factor: 0.022, label: 'Dept. store' },
  'Electronics': { ecoCategory: 'consumption', factor: 0.035, label: 'Electronics' },
  'Computers': { ecoCategory: 'consumption', factor: 0.035, label: 'Computer' },
  'Sporting Goods': { ecoCategory: 'consumption', factor: 0.025, label: 'Sporting goods' },
  'Hardware Store': { ecoCategory: 'consumption', factor: 0.018, label: 'Hardware' },
  'Furniture and Fixtures': { ecoCategory: 'consumption', factor: 0.027, label: 'Furniture' },
  'Bookstores': { ecoCategory: 'consumption', factor: 0.01, label: 'Books' },
  'Shopping': { ecoCategory: 'consumption', factor: 0.021, label: 'General shopping' },

  // ── Ignore (financial, healthcare, entertainment) ──────────────────────────
  'Transfer': { ecoCategory: 'ignore', factor: 0, label: 'Transfer' },
  'Payment': { ecoCategory: 'ignore', factor: 0, label: 'Payment' },
  'Payroll': { ecoCategory: 'ignore', factor: 0, label: 'Income' },
  'Interest Earned': { ecoCategory: 'ignore', factor: 0, label: 'Interest' },
  'Credit Card': { ecoCategory: 'ignore', factor: 0, label: 'Credit' },
  'Banks': { ecoCategory: 'ignore', factor: 0, label: 'Banking' },
  'Healthcare': { ecoCategory: 'ignore', factor: 0, label: 'Healthcare' },
  'Medical': { ecoCategory: 'ignore', factor: 0, label: 'Medical' },
  'Insurance': { ecoCategory: 'ignore', factor: 0, label: 'Insurance' },
  'Subscription': { ecoCategory: 'ignore', factor: 0.002, label: 'Subscription' },
  'Entertainment': { ecoCategory: 'ignore', factor: 0.008, label: 'Entertainment' },
};

/** Default fallback for unmapped categories */
const DEFAULT_RULE: CategoryRule = {
  ecoCategory: 'consumption',
  factor: 0.015,
  label: 'General purchase',
};

// ─── Mapper Functions ─────────────────────────────────────────────────────────

/**
 * Find the best matching emission rule for a Plaid category array.
 * Tries each category from most specific (last) to least specific (first).
 */
function findRule(categories: string[]): CategoryRule {
  // Check most-specific category first
  for (let i = categories.length - 1; i >= 0; i--) {
    const cat = categories[i];
    if (CATEGORY_RULES[cat]) return CATEGORY_RULES[cat];
    // Partial match
    const partialKey = Object.keys(CATEGORY_RULES).find((k) =>
      cat.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(cat.toLowerCase()),
    );
    if (partialKey) return CATEGORY_RULES[partialKey];
  }
  return DEFAULT_RULE;
}

/**
 * Map a single Plaid transaction to an EcoTrack emission estimate.
 */
export function mapTransaction(tx: PlaidTransaction): MappedTransaction {
  const rule = findRule(tx.category);
  const amount = Math.abs(tx.amount); // Plaid uses positive for debits
  const estimatedKgCO2e = amount * rule.factor;

  return {
    ...tx,
    emissionFactor: rule.factor,
    estimatedKgCO2e: parseFloat(estimatedKgCO2e.toFixed(4)),
    ecoCategory: rule.ecoCategory,
    label: rule.label,
  };
}

/**
 * Map an array of Plaid transactions to EcoTrack emission estimates.
 * Filters out ignored categories (transfers, payments, income).
 */
export function mapTransactionsToCO2(transactions: PlaidTransaction[]): MappedTransaction[] {
  return transactions
    .map(mapTransaction)
    .filter((tx) => tx.ecoCategory !== 'ignore');
}

/**
 * Aggregate mapped transactions into annual kgCO₂e by category.
 * Assumes the transactions are from the past 30 days — extrapolates to annual.
 */
export function aggregateTransactionEmissions(
  mapped: MappedTransaction[],
  periodDays = 30,
): {
  transport: number;
  energy: number;
  diet: number;
  consumption: number;
  totalMonthly: number;
  totalAnnual: number;
} {
  const annualMultiplier = 365 / periodDays;

  const totals = { transport: 0, energy: 0, diet: 0, consumption: 0 };

  mapped.forEach((tx) => {
    const cat = tx.ecoCategory as keyof typeof totals;
    if (cat in totals) {
      totals[cat] += tx.estimatedKgCO2e;
    }
  });

  const totalPeriod = Object.values(totals).reduce((s, v) => s + v, 0);

  return {
    transport: parseFloat((totals.transport * annualMultiplier).toFixed(1)),
    energy: parseFloat((totals.energy * annualMultiplier).toFixed(1)),
    diet: parseFloat((totals.diet * annualMultiplier).toFixed(1)),
    consumption: parseFloat((totals.consumption * annualMultiplier).toFixed(1)),
    totalMonthly: parseFloat(((totalPeriod / periodDays) * 30).toFixed(1)),
    totalAnnual: parseFloat((totalPeriod * annualMultiplier).toFixed(1)),
  };
}

/**
 * Get top carbon-emitting transactions sorted by kgCO₂e descending.
 */
export function getTopEmittingTransactions(
  mapped: MappedTransaction[],
  limit = 5,
): MappedTransaction[] {
  return [...mapped]
    .sort((a, b) => b.estimatedKgCO2e - a.estimatedKgCO2e)
    .slice(0, limit);
}
