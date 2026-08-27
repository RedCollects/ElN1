export const MAX_RANKING_POSITION = 50;
const INITIAL_PRICE_POSITION_COUNT = 10;

export function getInitialPrice(position: number) {
  const pricedPosition = Math.min(
    Math.max(position, 1),
    INITIAL_PRICE_POSITION_COUNT
  );

  return (INITIAL_PRICE_POSITION_COUNT - pricedPosition + 1) * 10;
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
