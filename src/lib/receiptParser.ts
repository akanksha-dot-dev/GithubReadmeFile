/**
 * EcoTrack Receipt Parser (Tesseract.js OCR)
 *
 * Runs 100% in-browser. Parses grocery receipts to estimate dietary CO₂.
 * Uses a food item keyword dictionary mapped to GHG Protocol food emission factors.
 */

import type { ReceiptLineItem, OcrScanResult } from '@/types/integrations';

// ─── Food CO₂ Database ────────────────────────────────────────────────────────

type FoodCategory = ReceiptLineItem['category'];

interface FoodEntry {
  category: FoodCategory;
  /** kgCO₂e per 100g */
  kgCO2ePer100g: number;
  /** Average weight in grams if unknown */
  defaultWeightG: number;
}

/**
 * Keyword-to-food-emission map.
 * Source: Poore & Nemecek (2018), Our World in Data food emissions data.
 */
const FOOD_DATABASE: Record<string, FoodEntry> = {
  // ── Beef ──────────────────────────────────────────────────────────────────
  beef: { category: 'meat_beef', kgCO2ePer100g: 9.9, defaultWeightG: 300 },
  steak: { category: 'meat_beef', kgCO2ePer100g: 9.9, defaultWeightG: 250 },
  ground_beef: { category: 'meat_beef', kgCO2ePer100g: 9.9, defaultWeightG: 500 },
  hamburger: { category: 'meat_beef', kgCO2ePer100g: 7.2, defaultWeightG: 150 },
  burger: { category: 'meat_beef', kgCO2ePer100g: 7.2, defaultWeightG: 150 },
  brisket: { category: 'meat_beef', kgCO2ePer100g: 9.9, defaultWeightG: 400 },
  veal: { category: 'meat_beef', kgCO2ePer100g: 9.9, defaultWeightG: 200 },
  lamb: { category: 'meat_beef', kgCO2ePer100g: 10.4, defaultWeightG: 250 },
  mutton: { category: 'meat_beef', kgCO2ePer100g: 10.4, defaultWeightG: 250 },

  // ── Poultry & Pork ────────────────────────────────────────────────────────
  chicken: { category: 'meat_poultry', kgCO2ePer100g: 0.69, defaultWeightG: 400 },
  turkey: { category: 'meat_poultry', kgCO2ePer100g: 0.69, defaultWeightG: 400 },
  duck: { category: 'meat_poultry', kgCO2ePer100g: 0.76, defaultWeightG: 300 },
  pork: { category: 'meat_poultry', kgCO2ePer100g: 1.22, defaultWeightG: 400 },
  bacon: { category: 'meat_poultry', kgCO2ePer100g: 1.22, defaultWeightG: 150 },
  ham: { category: 'meat_poultry', kgCO2ePer100g: 1.22, defaultWeightG: 300 },
  sausage: { category: 'meat_poultry', kgCO2ePer100g: 1.50, defaultWeightG: 200 },
  salami: { category: 'meat_poultry', kgCO2ePer100g: 1.50, defaultWeightG: 100 },

  // ── Fish ──────────────────────────────────────────────────────────────────
  salmon: { category: 'fish', kgCO2ePer100g: 0.60, defaultWeightG: 300 },
  tuna: { category: 'fish', kgCO2ePer100g: 0.64, defaultWeightG: 200 },
  shrimp: { category: 'fish', kgCO2ePer100g: 1.18, defaultWeightG: 200 },
  prawns: { category: 'fish', kgCO2ePer100g: 1.18, defaultWeightG: 200 },
  cod: { category: 'fish', kgCO2ePer100g: 0.49, defaultWeightG: 250 },
  fish: { category: 'fish', kgCO2ePer100g: 0.53, defaultWeightG: 200 },
  lobster: { category: 'fish', kgCO2ePer100g: 1.18, defaultWeightG: 250 },
  crab: { category: 'fish', kgCO2ePer100g: 0.75, defaultWeightG: 200 },

  // ── Dairy ─────────────────────────────────────────────────────────────────
  milk: { category: 'dairy', kgCO2ePer100g: 0.28, defaultWeightG: 1000 },
  cheese: { category: 'dairy', kgCO2ePer100g: 2.79, defaultWeightG: 250 },
  butter: { category: 'dairy', kgCO2ePer100g: 3.85, defaultWeightG: 250 },
  yogurt: { category: 'dairy', kgCO2ePer100g: 0.21, defaultWeightG: 500 },
  yoghurt: { category: 'dairy', kgCO2ePer100g: 0.21, defaultWeightG: 500 },
  cream: { category: 'dairy', kgCO2ePer100g: 1.39, defaultWeightG: 250 },
  ice_cream: { category: 'dairy', kgCO2ePer100g: 0.87, defaultWeightG: 400 },
  eggs: { category: 'dairy', kgCO2ePer100g: 0.45, defaultWeightG: 600 },
  egg: { category: 'dairy', kgCO2ePer100g: 0.45, defaultWeightG: 60 },

  // ── Vegetables & Fruits ───────────────────────────────────────────────────
  vegetables: { category: 'vegetables', kgCO2ePer100g: 0.04, defaultWeightG: 500 },
  tomato: { category: 'vegetables', kgCO2ePer100g: 0.08, defaultWeightG: 300 },
  potato: { category: 'vegetables', kgCO2ePer100g: 0.03, defaultWeightG: 1000 },
  broccoli: { category: 'vegetables', kgCO2ePer100g: 0.07, defaultWeightG: 300 },
  spinach: { category: 'vegetables', kgCO2ePer100g: 0.11, defaultWeightG: 200 },
  apple: { category: 'vegetables', kgCO2ePer100g: 0.04, defaultWeightG: 200 },
  banana: { category: 'vegetables', kgCO2ePer100g: 0.07, defaultWeightG: 150 },
  orange: { category: 'vegetables', kgCO2ePer100g: 0.04, defaultWeightG: 180 },
  lettuce: { category: 'vegetables', kgCO2ePer100g: 0.07, defaultWeightG: 200 },
  carrot: { category: 'vegetables', kgCO2ePer100g: 0.04, defaultWeightG: 300 },
  avocado: { category: 'vegetables', kgCO2ePer100g: 0.25, defaultWeightG: 150 },
  berries: { category: 'vegetables', kgCO2ePer100g: 0.07, defaultWeightG: 250 },

  // ── Grains & Legumes ──────────────────────────────────────────────────────
  bread: { category: 'grains', kgCO2ePer100g: 0.08, defaultWeightG: 400 },
  rice: { category: 'grains', kgCO2ePer100g: 0.28, defaultWeightG: 1000 },
  pasta: { category: 'grains', kgCO2ePer100g: 0.17, defaultWeightG: 500 },
  oats: { category: 'grains', kgCO2ePer100g: 0.03, defaultWeightG: 500 },
  cereal: { category: 'grains', kgCO2ePer100g: 0.08, defaultWeightG: 400 },
  flour: { category: 'grains', kgCO2ePer100g: 0.07, defaultWeightG: 1000 },
  beans: { category: 'grains', kgCO2ePer100g: 0.08, defaultWeightG: 400 },
  lentils: { category: 'grains', kgCO2ePer100g: 0.09, defaultWeightG: 500 },
  tofu: { category: 'grains', kgCO2ePer100g: 0.20, defaultWeightG: 400 },

  // ── Beverages ─────────────────────────────────────────────────────────────
  coffee: { category: 'beverages', kgCO2ePer100g: 0.53, defaultWeightG: 200 },
  tea: { category: 'beverages', kgCO2ePer100g: 0.03, defaultWeightG: 50 },
  juice: { category: 'beverages', kgCO2ePer100g: 0.07, defaultWeightG: 1000 },
  soda: { category: 'beverages', kgCO2ePer100g: 0.07, defaultWeightG: 1000 },
  beer: { category: 'beverages', kgCO2ePer100g: 0.24, defaultWeightG: 500 },
  wine: { category: 'beverages', kgCO2ePer100g: 0.18, defaultWeightG: 750 },
  water: { category: 'beverages', kgCO2ePer100g: 0.01, defaultWeightG: 1000 },
};

// ─── Receipt Line Parser ──────────────────────────────────────────────────────

const PRICE_REGEX = /\$?\d+\.\d{2}/;
const QTY_REGEX = /(\d+(?:\.\d+)?)\s*(lb|lbs|oz|kg|g|grams?|pounds?|ounces?)/i;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchFoodItem(line: string): { key: string; entry: FoodEntry } | null {
  const normalized = normalizeText(line);
  // Direct match first
  for (const [key, entry] of Object.entries(FOOD_DATABASE)) {
    const keyNormalized = key.replace(/_/g, ' ');
    if (normalized.includes(keyNormalized)) {
      return { key, entry };
    }
  }
  return null;
}

function estimateWeightFromLine(line: string, defaultWeightG: number): number {
  const qtyMatch = QTY_REGEX.exec(line);
  if (!qtyMatch) return defaultWeightG;

  const value = parseFloat(qtyMatch[1]);
  const unit = qtyMatch[2].toLowerCase();

  if (unit.startsWith('lb') || unit.startsWith('pound')) return value * 453.592;
  if (unit.startsWith('oz') || unit.startsWith('ounce')) return value * 28.3495;
  if (unit === 'kg') return value * 1000;
  if (unit.startsWith('g')) return value;
  return defaultWeightG;
}

function parseLine(rawLine: string): ReceiptLineItem {
  const match = matchFoodItem(rawLine);
  const weightG = match
    ? estimateWeightFromLine(rawLine, match.entry.defaultWeightG)
    : 200;

  if (!match) {
    return {
      rawText: rawLine.trim(),
      category: 'unknown',
      estimatedGrams: weightG,
      kgCO2ePer100g: 0.015,
      estimatedKgCO2e: parseFloat(((weightG / 100) * 0.015).toFixed(4)),
    };
  }

  const estimatedKgCO2e = (weightG / 100) * match.entry.kgCO2ePer100g;

  return {
    rawText: rawLine.trim(),
    matchedFoodItem: match.key.replace(/_/g, ' '),
    category: match.entry.category,
    estimatedGrams: weightG,
    kgCO2ePer100g: match.entry.kgCO2ePer100g,
    estimatedKgCO2e: parseFloat(estimatedKgCO2e.toFixed(4)),
  };
}

// ─── Main OCR Parse Function ──────────────────────────────────────────────────

/**
 * Parse a receipt image file using Tesseract.js (in-browser OCR).
 * Returns parsed line items with CO₂ estimates.
 *
 * This is the main entry point for the Receipt Scanner feature.
 */
export async function parseReceiptImage(file: File): Promise<OcrScanResult> {
  const scanDate = new Date().toISOString();

  try {
    // Dynamically import Tesseract.js to keep it code-split / lazy-loaded
    const Tesseract = await import('tesseract.js');

    const { data } = await Tesseract.recognize(file, 'eng', {
      logger: () => {}, // suppress logging
    });

    const rawText = data.text;
    const confidence = data.confidence;

    // Split into lines, filter empty and likely non-food lines (totals, store name, etc.)
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 2 && !PRICE_REGEX.exec(l)?.index === undefined);

    // Parse each meaningful line
    const lineItems = lines
      .map(parseLine)
      .filter((item) => item.estimatedKgCO2e > 0);

    const totalEstimatedKgCO2e = lineItems.reduce(
      (sum, item) => sum + item.estimatedKgCO2e,
      0,
    );

    // Try to extract merchant name from first few lines
    const headerLines = rawText.split('\n').slice(0, 3);
    const merchantName = headerLines.find((l) => l.trim().length > 2)?.trim();

    return {
      success: true,
      rawText,
      confidence,
      lineItems,
      totalEstimatedKgCO2e: parseFloat(totalEstimatedKgCO2e.toFixed(3)),
      merchantName,
      scanDate,
    };
  } catch (error) {
    return {
      success: false,
      rawText: '',
      confidence: 0,
      lineItems: [],
      totalEstimatedKgCO2e: 0,
      scanDate,
      errorMessage: error instanceof Error ? error.message : 'OCR failed',
    };
  }
}

/**
 * Quickly estimate CO₂ from raw receipt text (e.g., from server-side OCR).
 * Skips Tesseract — useful when you already have extracted text.
 */
export function parseReceiptText(rawText: string): OcrScanResult {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
  const lineItems = lines.map(parseLine).filter((i) => i.estimatedKgCO2e > 0);
  const totalEstimatedKgCO2e = lineItems.reduce((s, i) => s + i.estimatedKgCO2e, 0);

  return {
    success: true,
    rawText,
    confidence: 100,
    lineItems,
    totalEstimatedKgCO2e: parseFloat(totalEstimatedKgCO2e.toFixed(3)),
    scanDate: new Date().toISOString(),
  };
}
