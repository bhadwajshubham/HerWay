export type RideOption = {
  id: string;
  title: string;
  detail: string;
  price: number;
  eta: number;
};

export function sortRideOptions<T extends RideOption>(options: readonly T[], sort: 'recommended' | 'price' | 'arrival'): T[] {
  const sorted = [...options];
  if (sort === 'price') return sorted.sort((a, b) => a.price - b.price);
  if (sort === 'arrival') return sorted.sort((a, b) => a.eta - b.eta);
  return sorted;
}
