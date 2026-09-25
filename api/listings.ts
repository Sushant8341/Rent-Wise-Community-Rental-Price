import { INITIAL_LISTINGS } from '../src/data/mockData';

export default function handler(req: any, res: any) {
  // Enable CORS if accessed from preview or custom domains
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const newListing = req.body || {};
    const createdListing = {
      ...newListing,
      id: newListing.id || `lst-custom-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
      verifiedListing: newListing.verifiedListing ?? true,
      isDirectFromOwner: newListing.isDirectFromOwner ?? true,
    };
    return res.status(200).json({
      success: true,
      message: 'Property listed successfully!',
      data: createdListing,
    });
  }

  if (req.method === 'PUT') {
    const updated = req.body || {};
    return res.status(200).json({
      success: true,
      message: 'Property listing updated successfully!',
      data: updated,
    });
  }

  if (req.method === 'DELETE') {
    return res.status(200).json({
      success: true,
      message: 'Property listing removed successfully',
    });
  }

  // GET /api/listings
  const { city, locality } = req.query || {};
  let filtered = INITIAL_LISTINGS;
  if (city) {
    filtered = filtered.filter(l => l.city.toLowerCase() === String(city).toLowerCase());
  }
  if (locality) {
    filtered = filtered.filter(l => l.locality.toLowerCase().includes(String(locality).toLowerCase()));
  }

  return res.status(200).json({
    success: true,
    count: filtered.length,
    data: filtered,
  });
}
