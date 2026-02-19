// Zod schemas for CoinGecko query params
import { z } from 'zod';

export const vsCurrencySchema = z.string().min(2).max(8);
export const perPageSchema = z.coerce.number().int().min(1).max(250).default(100);
export const pageSchema = z.coerce.number().int().min(1).default(1);
export const orderSchema = z.enum([
  'market_cap_desc',
  'market_cap_asc',
  'volume_desc',
  'volume_asc',
  'id_asc',
  'id_desc',
  'gecko_desc',
  'gecko_asc',
  'price_asc',
  'price_desc',
]);
export const daysSchema = z.union([
  z.string().regex(/^\d+$/),
  z.enum(['1','7','14','30','90','180','365','max'])
]);
