export type MockCard = {
  id: string;
  linkedAccountId: number | null;
  label: string;
  holderName: string;
  maskedPan: string;
  cvv: string;
  scheme: "VISA" | "MASTERCARD";
  cardType: "CREDIT" | "DEBIT";
  cardFormat: "FIZIC" | "VIRTUAL";
  iban: string;
  color: string;
  currency: "RON" | "EUR" | "USD";
  isActive: boolean;
  createdAt: string;
};

export function generateIban(): string {
  const check = Math.floor(10 + Math.random() * 90).toString();
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bankCode = Array.from({ length: 4 }, () =>
    letters[Math.floor(Math.random() * 26)]
  ).join("");
  const digits = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  return `RO${check}${bankCode}${digits}`;
}

export function generateCvv(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

export function generateMockCard(
  holderName: string,
  linkedAccountId: number | null,
  options?: {
    scheme?: "VISA" | "MASTERCARD";
    cardType?: "CREDIT" | "DEBIT";
    cardFormat?: "FIZIC" | "VIRTUAL";
    iban?: string;
  }
): MockCard {
  const last4 = Math.floor(1000 + Math.random() * 9000).toString();
  const scheme = options?.scheme ?? (Math.random() > 0.5 ? "VISA" : "MASTERCARD");
  const cardType = options?.cardType ?? "DEBIT";
  const cardFormat = options?.cardFormat ?? "FIZIC";
  const palette = ["#1E293B", "#0F766E", "#7C3AED", "#B45309"];
  const color = palette[Math.floor(Math.random() * palette.length)];

  return {
    id: `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    linkedAccountId,
    label: "Card nou",
    holderName,
    maskedPan: `**** **** **** ${last4}`,
    cvv: generateCvv(),
    scheme,
    cardType,
    cardFormat,
    iban: options?.iban?.trim() || generateIban(),
    color,
    currency: "RON",
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}