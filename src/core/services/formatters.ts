import { storeConfig } from '@/config/store.config';

/**
 * Formats a numeric price using the active store currency and formatting rules.
 */
export function formatCurrency(
  amount: number | string,
  options?: {
    showSymbol?: boolean;
    decimals?: number;
  }
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';

  const decimals = options?.decimals ?? storeConfig.currency.decimals;
  const formattedNumber = num.toFixed(decimals);

  if (options?.showSymbol === false) {
    return formattedNumber;
  }

  return `${storeConfig.currency.symbol}${formattedNumber}`;
}
