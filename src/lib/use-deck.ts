"use client";

import { useMemo } from "react";
import {
  ITEMS,
  makeCards,
  type Card,
  type Item,
} from "./deck";
import { useStore } from "./store";

/**
 * The curated deck plus whatever you've captured yourself, as one deck.
 * Everything downstream — the queue, the counts, the stats — works off this
 * rather than the static list, so an added word is schedulable immediately.
 */
export function useDeck(): {
  items: Item[];
  cards: Card[];
  byId: Record<string, Item>;
  customCount: number;
} {
  const { data } = useStore();
  const custom = data.custom;

  return useMemo(() => {
    const items: Item[] = [...ITEMS, ...custom];
    return {
      items,
      cards: makeCards(items),
      byId: Object.fromEntries(items.map((i) => [i.id, i])),
      customCount: custom.length,
    };
  }, [custom]);
}
