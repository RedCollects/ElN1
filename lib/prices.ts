export const MAX_POSITION = 10;

export function getInitialPrice(position: number) {
  return (MAX_POSITION - position + 1) * 10;
}

export function getMinimumOffer(
  position: number,
  currentPrice: number | null | undefined
) {
  const price = Number(currentPrice);

  return currentPrice === null || currentPrice === undefined || !Number.isFinite(price)
    ? getInitialPrice(position)
    : Math.ceil(price * 1.1);
}
