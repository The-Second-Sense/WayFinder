import AsyncStorage from "@react-native-async-storage/async-storage";

import { generateIban, MockCard } from "@/types/cards";

const STORAGE_KEY = "mock_cards_v1";

export async function loadMockCards(): Promise<MockCard[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any[];
    // Migrate cards created before cardType/cardFormat/iban fields were added
    return parsed.map((card) => ({
      cardType: "DEBIT" as const,
      cardFormat: "FIZIC" as const,
      iban: generateIban(),
      ...card,
    }));
  } catch {
    return [];
  }
}

export async function saveMockCards(cards: MockCard[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}