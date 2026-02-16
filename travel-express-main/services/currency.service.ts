// On définit les taux par rapport au XOF (Franc CFA)
// Le XOF est la base (1)
const RATES = {
  XOF: 1,
  EUR: 655.957, 
  USD: 600,     
  GNF: 0.070,   
} as const;

export type Currency = keyof typeof RATES;

/**
 * Convertit un montant étranger vers le XOF
 */
export function convertToXOF(amount: number, currency: Currency): number {
  const rate = RATES[currency] || 1;
  return Math.round(amount * rate);
}

/**
 * Formatage professionnel des montants (ex: 1 500 000 FCFA)
 */
export function formatCurrency(amount: number, currency: string = 'FCFA'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(amount) + ` ${currency}`;
}

/**
 * Convertit du XOF vers une devise étrangère (Utile pour l'affichage étudiant)
 */
export function convertFromXOF(amountXOF: number, targetCurrency: Currency): number {
  const rate = RATES[targetCurrency] || 1;
  return Math.round(amountXOF / rate);
}