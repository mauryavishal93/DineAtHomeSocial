/**
 * Currency utility functions
 * All prices in the database are stored in paise (smallest currency unit)
 * These functions convert paise to rupees for display
 */

/**
 * Convert paise to rupees and format as currency string
 * @param paise - Amount in paise
 * @param showDecimals - Whether to show decimal places (default: false for whole rupees)
 * @returns Formatted currency string (e.g., "₹500" or "₹500.00")
 */
export function formatCurrency(paise: number, showDecimals: boolean = false): string {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return "₹0";
  }
  const rupees = paise / 100;
  if (showDecimals) {
    return `₹${rupees.toFixed(2)}`;
  }
  return `₹${Math.round(rupees)}`;
}

/**
 * Convert paise to rupees (returns number)
 * @param paise - Amount in paise
 * @returns Amount in rupees
 */
export function paiseToRupees(paise: number): number {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return 0;
  }
  return Math.round(paise / 100);
}

/**
 * Convert rupees to paise (for storing in database)
 * @param rupees - Amount in rupees
 * @returns Amount in paise
 */
export function rupeesToPaise(rupees: number): number {
  if (rupees === null || rupees === undefined || isNaN(rupees)) {
    return 0;
  }
  return Math.round(rupees * 100);
}
