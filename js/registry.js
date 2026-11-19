// PageRegistry: page number -> module. 100/200/300/400/500 registered;
// any other 100-899 number is unregistered (router shows "page not found").
import { NewsModule } from './modules/news.js';
import { WeatherModule } from './modules/weather.js';
import { SportModule } from './modules/sport.js';
import { FinanceModule } from './modules/finance.js';
import { TVGuideModule } from './modules/tvguide.js';

export const REGISTRY = new Map([
  [100, NewsModule],
  [200, WeatherModule],
  [300, SportModule],
  [400, FinanceModule],
  [500, TVGuideModule],
]);
export function lookup(pageNo) { return REGISTRY.get(pageNo) || null; }
export function isRegistered(pageNo) { return REGISTRY.has(pageNo); }
