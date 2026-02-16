/**
 * Utilitaires pour les confirmations de lecture
 */

export interface ReadReceiptInfo {
  userId: string;
  userName: string;
  readAt: Date;
}

/**
 * Formate l'affichage des confirmations de lecture
 */
export function formatReadReceipts(receipts: ReadReceiptInfo[]): {
  count: number;
  names: string;
  shortList: string[];
} {
  return {
    count: receipts.length,
    names: receipts.map((r) => r.userName).join(", "),
    shortList: receipts.slice(0, 3).map((r) => r.userName),
  };
}

/**
 * Vérifie si un message a été lu par tous les destinataires
 */
export function isReadByAll(
  totalRecipients: number,
  readReceipts: ReadReceiptInfo[]
): boolean {
  return readReceipts.length === totalRecipients;
}

/**
 * Retourne l'icône appropriée pour le statut de lecture
 * ✓ = envoyé
 * ✓✓ = lu
 */
export function getReadStatus(readCount: number): {
  icon: string;
  label: string;
  color: string;
} {
  if (readCount > 0) {
    return {
      icon: "✓✓",
      label: "Lu",
      color: "text-blue-400",
    };
  }
  return {
    icon: "✓",
    label: "Envoyé",
    color: "text-blue-200",
  };
}

/**
 * Formate l'heure de lecture pour l'affichage
 */
export function formatReadTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Crée un résumé des lectures pour tooltip
 */
export function createReadTooltip(receipts: ReadReceiptInfo[]): string {
  if (receipts.length === 0) return "Non lu";

  const formatted = receipts.map((r) => {
    const time = formatReadTime(r.readAt);
    return `${r.userName} à ${time}`;
  });

  return formatted.join("\n");
}
