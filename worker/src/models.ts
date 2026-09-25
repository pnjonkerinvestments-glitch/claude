/** Een aandeel dat in de premarket beweegt. */
export interface Mover {
  symbol: string;
  exchange: string;
  name: string;
  price: number;
  prevClose: number;
  changePct: number;
  volume: number;
  marketCap: number | null;
  instrumentType: string;
}

export function moverKey(m: Mover): string {
  return m.exchange ? `${m.exchange}:${m.symbol}` : m.symbol;
}

export function chartUrl(m: Mover): string {
  const tv = m.exchange ? `${m.exchange}%3A${m.symbol}` : m.symbol;
  return `https://www.tradingview.com/chart/?symbol=${tv}`;
}

export function dollarVolume(m: Mover): number {
  return m.price * m.volume;
}
