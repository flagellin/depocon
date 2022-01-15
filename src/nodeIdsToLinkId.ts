export function nodeIdsToLinkId(idA: string, idB: string) {
  return [idA, idB].sort().join("-");
}
