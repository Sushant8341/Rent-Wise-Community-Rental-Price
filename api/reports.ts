import { INITIAL_COMMUNITY_REPORTS } from '../src/data/mockData';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const reportData = req.body || {};
    const newReport = {
      ...reportData,
      id: `rep-custom-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      anonymousHandle: reportData.anonymousHandle || `Resident_${Math.floor(1000 + Math.random() * 9000)}`,
    };
    return res.status(200).json({
      success: true,
      message: 'Community rent data submitted successfully!',
      data: newReport,
    });
  }

  const { city, locality } = req.query || {};
  let filtered = INITIAL_COMMUNITY_REPORTS;
  if (city) {
    filtered = filtered.filter(r => r.city.toLowerCase() === String(city).toLowerCase());
  }
  if (locality) {
    filtered = filtered.filter(r => r.locality.toLowerCase().includes(String(locality).toLowerCase()));
  }

  return res.status(200).json({
    success: true,
    count: filtered.length,
    data: filtered,
  });
}
