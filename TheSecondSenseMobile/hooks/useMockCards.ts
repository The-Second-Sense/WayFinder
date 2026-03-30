import { useEffect, useState } from "react";

import { loadMockCards, saveMockCards } from "@/storage/mockCards";
import { MockCard } from "@/types/cards";

let sharedCards: MockCard[] = [];
let sharedReady = false;
let hydrationPromise: Promise<void> | null = null;
const listeners = new Set<(cards: MockCard[]) => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener(sharedCards));
};

const ensureHydrated = async () => {
  if (sharedReady) return;
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      const loaded = await loadMockCards();
      sharedCards = loaded;
      sharedReady = true;
      notifyListeners();
    })();
  }
  await hydrationPromise;
};

export function useMockCards() {
  const [cards, setCardsState] = useState<MockCard[]>(sharedCards);
  const [ready, setReady] = useState(sharedReady);

  useEffect(() => {
    const onCardsChange = (nextCards: MockCard[]) => {
      setCardsState(nextCards);
    };

    listeners.add(onCardsChange);

    ensureHydrated()
      .catch(() => {
        sharedCards = [];
        sharedReady = true;
        notifyListeners();
      })
      .finally(() => setReady(true));

    return () => {
      listeners.delete(onCardsChange);
    };
  }, []);

  const setCards = (updater: MockCard[] | ((prev: MockCard[]) => MockCard[])) => {
    const nextCards = typeof updater === "function"
      ? (updater as (prev: MockCard[]) => MockCard[])(sharedCards)
      : updater;

    sharedCards = nextCards;
    notifyListeners();
    saveMockCards(nextCards).catch(() => {});
  };

  return { cards, setCards, ready };
}