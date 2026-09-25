import { INITIAL_BENCHMARKS } from '../src/data/mockData';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { city } = req.query || {};
  let filtered = INITIAL_BENCHMARKS;
  if (city) {
    filtered = filtered.filter(b => b.city.toLowerCase() === String(city).toLowerCase());
  }

  return res.status(200).json({
    success: true,
    count: filtered.length,
    data: filtered,
  });
}
