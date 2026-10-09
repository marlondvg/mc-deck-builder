import { useQuery } from "@tanstack/react-query";
import { fetchAllCards, fetchCard, fetchPacks } from "./marvelcdb";

// Card data changes rarely (new packs), so cache it aggressively.
const ONE_DAY = 24 * 60 * 60 * 1000;

export const useCards = () =>
  useQuery({
    queryKey: ["cards"],
    queryFn: fetchAllCards,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY * 7,
  });

export const usePacks = () =>
  useQuery({
    queryKey: ["packs"],
    queryFn: fetchPacks,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY * 7,
  });

export const useCard = (code: string | undefined) =>
  useQuery({
    queryKey: ["card", code],
    queryFn: () => fetchCard(code!),
    enabled: !!code,
    staleTime: ONE_DAY,
  });
