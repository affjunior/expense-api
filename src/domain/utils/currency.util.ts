/**
 * Currency utility for converting between currency amounts and cents
 */

export type CurrencyCode = "USD" | "BRL";

/**
 * Configuration for currency decimal places
 * Most currencies use 2 decimal places, but some (like JPY) use 0
 */
const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  USD: 2, // US Dollar
  BRL: 2, // Brazilian Real
};

/**
 * Supported currency codes
 */
export const SUPPORTED_CURRENCIES: CurrencyCode[] = ["USD", "BRL"];

/**
 * Convert currency amount to cents (smallest unit)
 * @param amount - The amount in currency units (e.g., 10.50 for $10.50)
 * @param currencyCode - The currency code (e.g., "USD")
 * @returns The amount in cents (e.g., 1050 for $10.50)
 */
export function convertToCents(
  amount: number,
  currencyCode: CurrencyCode,
): number {
  const decimals = CURRENCY_DECIMALS[currencyCode];
  const multiplier = Math.pow(10, decimals);
  return Math.round(amount * multiplier);
}

/**
 * Convert cents to currency amount
 * @param cents - The amount in cents (e.g., 1050)
 * @param currencyCode - The currency code (e.g., "USD")
 * @returns The amount in currency units (e.g., 10.50 for $10.50)
 */
export function convertFromCents(
  cents: number,
  currencyCode: CurrencyCode,
): number {
  const decimals = CURRENCY_DECIMALS[currencyCode];
  const divisor = Math.pow(10, decimals);
  return cents / divisor;
}

/**
 * Validate if a currency code is supported
 * @param code - The currency code to validate
 * @returns true if the currency is supported
 */
export function isSupportedCurrency(code: string): code is CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(code as CurrencyCode);
}

/**
 * Get the number of decimal places for a currency
 * @param currencyCode - The currency code
 * @returns The number of decimal places
 */
export function getCurrencyDecimals(currencyCode: CurrencyCode): number {
  return CURRENCY_DECIMALS[currencyCode];
}

/**
 * Format an amount with currency symbol
 * @param amount - The amount in currency units
 * @param currencyCode - The currency code
 * @returns Formatted string (e.g., "$10.50")
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode,
): string {
  const decimals = CURRENCY_DECIMALS[currencyCode];
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
