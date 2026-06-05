const WORKERS = [
    'https://lively-band-0eab.ejo543210.workers.dev',
  'https://spring-salad-1aa3.willjohnsonn150.workers.dev',
  'https://blue-fog-eb04.roseunogwu63.workers.dev',
  'https://proxy.jonahjohnzon.workers.dev',
  'https://steam-proxy.hadezanubiz.workers.dev',
];

export function getCurrentWorker() {
  const hour = new Date().getUTCHours();

  // 24 hours divided by number of proxies
  const hoursPerProxy = 24 / WORKERS.length;

  const index = Math.floor(hour / hoursPerProxy);

  return WORKERS[index];
}