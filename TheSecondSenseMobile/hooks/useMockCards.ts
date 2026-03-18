import { useEffect, useState } from "react";

import { loadMockCards, saveMockCards } from "@/storage/mockCards";
import { MockCard } from "@/types/cards";

export function useMockCards() {
  const [cards, setCards] = useState<MockCard[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const loaded = await loadMockCards();
      setCards(loaded);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveMockCards(cards).catch(() => {});
  }, [cards, ready]);

  return { cards, setCards, ready };
}