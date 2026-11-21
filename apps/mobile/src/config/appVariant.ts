export type AppVariant = 'rider' | 'driver';

export function getAppVariant(value: string | undefined): AppVariant {
  return value === 'driver' ? 'driver' : 'rider';
}
