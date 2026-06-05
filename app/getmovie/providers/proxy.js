const WORKERS = [
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