import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_BENCHMARKS, INITIAL_LISTINGS, INITIAL_COMMUNITY_REPORTS } from './src/data/mockData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent JSON file database storage
const DB_FILE = path.join(__dirname, 'db.json');

let listings: any[] = [];
let reports: any[] = [];
let benchmarks: any[] = [];

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(fileData);
      if (data.listings && Array.isArray(data.listings)) {
        // Keep custom listings and initial listings
        const customListings = data.listings.filter((l: any) => l.id?.startsWith('lst-custom-'));
        listings = [...INITIAL_LISTINGS, ...customListings];
      } else {
        listings = [...INITIAL_LISTINGS];
      }

      if (data.reports && Array.isArray(data.reports)) {
        // Keep custom user reports and initial community reports
        const customReports = data.reports.filter((r: any) => r.id?.startsWith('rep-custom-') || r.id?.startsWith('rep-fb-'));
        const initialMap = new Map(INITIAL_COMMUNITY_REPORTS.map(r => [r.id, r]));
        reports = [...customReports, ...INITIAL_COMMUNITY_REPORTS];
      } else {
        reports = [...INITIAL_COMMUNITY_REPORTS];
      }
      benchmarks = [...INITIAL_BENCHMARKS];
      saveDatabase();
      return;
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }

  // Initial Seed
  listings = [...INITIAL_LISTINGS];
  reports = [...INITIAL_COMMUNITY_REPORTS];
  benchmarks = [...INITIAL_BENCHMARKS];
  saveDatabase();
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({ listings, reports, benchmarks }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// Load data on boot
loadDatabase();

// --- REST API ENDPOINTS ---

// Get all listings with optional city/bhk/price filter
app.get('/api/listings', (req, res) => {
  const { city, bhk, maxRent, locality } = req.query;
  let filtered = listings;

  if (city) {
    filtered = filtered.filter(l => l.city.toLowerCase() === (city as string).toLowerCase());
  }
  if (locality) {
    filtered = filtered.filter(l => l.locality.toLowerCase().includes((locality as string).toLowerCase()));
  }
  if (bhk && !isNaN(Number(bhk))) {
    filtered = filtered.filter(l => l.bhk === Number(bhk));
  }
  if (maxRent && !isNaN(Number(maxRent))) {
    filtered = filtered.filter(l => l.rent <= Number(maxRent));
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Create new rental listing (Landlords reach tenants directly)
app.post('/api/listings', (req, res) => {
  const newListing = req.body;
  if (!newListing.title || !newListing.rent || !newListing.locality) {
    return res.status(400).json({ success: false, error: 'Missing required property details' });
  }

  // Ensure map pin location coordinates are valid numbers
  const lat = typeof newListing.lat === 'number' && !isNaN(newListing.lat) ? newListing.lat : 
              (newListing.city === 'Vizianagaram' ? 18.1060 : 17.7380);
  const lng = typeof newListing.lng === 'number' && !isNaN(newListing.lng) ? newListing.lng : 
              (newListing.city === 'Vizianagaram' ? 83.3930 : 83.3320);

  const createdListing = {
    ...newListing,
    id: newListing.id || `lst-custom-${Date.now()}`,
    lat,
    lng,
    address: newListing.address || `${newListing.locality}, ${newListing.city}`,
    postedDate: new Date().toISOString().split('T')[0],
    verifiedListing: newListing.verifiedListing ?? true,
    isDirectFromOwner: newListing.isDirectFromOwner ?? true,
  };

  listings.unshift(createdListing);
  saveDatabase();

  res.json({ success: true, message: 'Property listed successfully!', data: createdListing });
});

// Delete a rental listing (Landlords can remove their own property)
app.delete('/api/listings/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = listings.length;
  listings = listings.filter(l => l.id !== id);

  if (listings.length === initialLength) {
    return res.status(404).json({ success: false, error: 'Listing not found' });
  }

  saveDatabase();
  res.json({ success: true, message: 'Property listing removed successfully' });
});

// Update an existing rental listing (Landlords can edit their property details)
app.put('/api/listings/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  const index = listings.findIndex(l => l.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Listing not found' });
  }

  const lat = typeof updatedData.lat === 'number' && !isNaN(updatedData.lat) ? updatedData.lat : listings[index].lat;
  const lng = typeof updatedData.lng === 'number' && !isNaN(updatedData.lng) ? updatedData.lng : listings[index].lng;

  listings[index] = {
    ...listings[index],
    ...updatedData,
    id,
    lat,
    lng,
    updatedDate: new Date().toISOString().split('T')[0],
  };

  saveDatabase();
  res.json({ success: true, message: 'Property listing updated successfully!', data: listings[index] });
});

// Get community rent reports
app.get('/api/reports', (req, res) => {
  const { city, locality } = req.query;
  let filtered = reports;

  if (city) {
    filtered = filtered.filter(r => r.city.toLowerCase() === (city as string).toLowerCase());
  }
  if (locality) {
    filtered = filtered.filter(r => r.locality.toLowerCase().includes((locality as string).toLowerCase()));
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Contribute anonymous community rent report
app.post('/api/reports', (req, res) => {
  const reportData = req.body;
  if (!reportData.rent || !reportData.locality) {
    return res.status(400).json({ success: false, error: 'Rent amount and locality are required' });
  }

  const newReport = {
    ...reportData,
    id: `rep-custom-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
    anonymousHandle: reportData.anonymousHandle || `Resident_${Math.floor(1000 + Math.random() * 9000)}`,
  };

  reports.unshift(newReport);

  // Dynamically recalculate locality benchmark metrics if matching benchmark exists
  const targetBenchmark = benchmarks.find(
    b => b.name.toLowerCase() === newReport.locality.toLowerCase() || b.id === newReport.locality
  );
  if (targetBenchmark) {
    targetBenchmark.totalReports += 1;
  }

  saveDatabase();

  res.json({ success: true, message: 'Community rent data submitted successfully!', data: newReport });
});

// Get locality benchmarks & averages
app.get('/api/benchmarks', (req, res) => {
  const { city } = req.query;
  let filtered = benchmarks;
  if (city) {
    filtered = filtered.filter(b => b.city.toLowerCase() === (city as string).toLowerCase());
  }
  res.json({ success: true, count: filtered.length, data: filtered });
});

// --- AI POWERED ENDPOINTS USING GEMINI SDK ---

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }
  return new GoogleGenAI({ apiKey });
}

// AI Rent Fair Value & Overpaying Checker
app.post('/api/ai/analyze-rent', async (req, res) => {
  try {
    const { userRent, bhk, locality, city, sqft, furnishing } = req.body;

    if (!userRent || !locality) {
      return res.status(400).json({ success: false, error: 'User rent and locality required' });
    }

    // Find benchmark or approximate
    const benchmark = benchmarks.find(
      b => b.name.toLowerCase().includes(locality.toLowerCase()) || locality.toLowerCase().includes(b.name.toLowerCase())
    ) || benchmarks[0];

    let avgRent = benchmark ? benchmark.avgRent2BHK : 15000;
    if (bhk === 1) avgRent = benchmark ? benchmark.avgRent1BHK : 9000;
    if (bhk === 3) avgRent = benchmark ? benchmark.avgRent3BHK : 22000;
    if (!avgRent || avgRent <= 0) {
      avgRent = (bhk || 2) * 7500;
    }

    const diffPercent = Math.round(((userRent - avgRent) / avgRent) * 100);

    let status = 'FAIR_MARKET';
    if (diffPercent <= -10) status = 'STEAL_DEAL';
    else if (diffPercent >= 15) status = 'OVERPAYING';
    else if (diffPercent > 5) status = 'SLIGHTLY_HIGH';

    // Call Gemini API for detailed localized reasoning & negotiation points
    let aiAnalysis = '';
    let negotiationPoints: string[] = [];

    try {
      const ai = getGeminiClient();
      const prompt = `Act as an expert rental market advisor for Andhra Pradesh (specifically ${city || 'Visakhapatnam / Vizianagaram'}).
A renter is paying ₹${userRent} per month for a ${bhk || 2} BHK (${furnishing || 'Semi-Furnished'}, approx ${sqft || 1100} sqft) in ${locality}.
The community benchmark average rent for this type in ${locality} is ₹${avgRent} per month.
The user's rent is ${diffPercent > 0 ? `${diffPercent}% higher` : `${Math.abs(diffPercent)}% lower`} than the average.

Please output a JSON response matching exact key structure:
{
  "aiAnalysis": "3-4 concise sentences summarizing the market position in this Andhra Pradesh locality, considering water availability, transit, and demand.",
  "negotiationPoints": ["Point 1 for tenant to bring to landlord", "Point 2", "Point 3"],
  "suggestedOfferRent": 12500
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        aiAnalysis = parsed.aiAnalysis;
        negotiationPoints = parsed.negotiationPoints || [];
      }
    } catch (err: any) {
      console.warn('Gemini API call fallback:', err.message);
      aiAnalysis = `Based on current community crowd-sourced data in ${locality}, the average monthly rent for a ${bhk || 2} BHK is ₹${avgRent.toLocaleString('en-IN')}. Your rent of ₹${userRent.toLocaleString('en-IN')} is ${diffPercent > 0 ? `${diffPercent}% above` : `${Math.abs(diffPercent)}% below`} the locality baseline.`;
      negotiationPoints = [
        `Highlight nearby verified listings averaging ₹${avgRent.toLocaleString('en-IN')}`,
        `Offer longer lease commitment (11 months+) for rent lock`,
        `Discuss advance deposit lump sum in exchange for lower monthly rent`
      ];
    }

    res.json({
      success: true,
      data: {
        locality,
        city: city || benchmark.city,
        userRent,
        benchmarkRent: avgRent,
        differencePercentage: diffPercent,
        status,
        percentileRank: Math.min(99, Math.max(5, 50 + diffPercent)),
        aiAnalysis,
        negotiationPoints,
        suggestedOfferRent: Math.round((avgRent + userRent) / 2)
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Locality Finder & Matcher
app.post('/api/ai/recommend-locality', async (req, res) => {
  try {
    const { maxBudget, preferredBHK, preferredCity, mustHaveAmenities, priority, preferredTenantType } = req.body;

    const targetCity = preferredCity || 'Visakhapatnam';
    const availableLocs = benchmarks.filter(b => b.city.toLowerCase() === targetCity.toLowerCase());

    try {
      const ai = getGeminiClient();
      const prompt = `You are an AI Locality Finder expert for Andhra Pradesh housing, specializing in ${targetCity} (e.g., MVP Colony, Madhurawada, Rushikonda, Beach Road, Gajuwaka) and Vizianagaram (Cantonment, KL Puram, Phool Bagh, Baba Metta).
User query preferences:
- Max Budget: ₹${maxBudget || 15000} / month
- BHK: ${preferredBHK || 2} BHK
- Priority Focus: ${priority || 'budget & water supply'}
- Preferred Tenants: ${preferredTenantType || 'Family'}

Return a JSON array of top 3 recommended localities from Andhra Pradesh:
[
  {
    "localityName": "Name of Locality",
    "city": "${targetCity}",
    "matchScore": 95,
    "avgRentForType": 14000,
    "keyHighlights": ["Highlight 1", "Highlight 2"],
    "whyMatch": "Reason why it fits budget and lifestyle",
    "transitSummary": "Transit access details in AP",
    "sampleListingCount": 8
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed });
      }
    } catch (err: any) {
      console.warn('Gemini recommendation fallback:', err.message);
    }

    // Fallback recommendation logic
    const fallbackRecs = availableLocs.slice(0, 3).map((loc, idx) => ({
      localityName: loc.name,
      city: loc.city,
      matchScore: 92 - idx * 6,
      avgRentForType: loc.avgRent2BHK,
      keyHighlights: loc.vibeTags,
      whyMatch: `Fits well within your monthly target budget of ₹${(maxBudget || 15000).toLocaleString('en-IN')} with strong water supply and transit scores.`,
      transitSummary: `Key hubs: ${loc.topNearbyHubs.join(', ')}`,
      sampleListingCount: loc.totalReports
    }));

    res.json({ success: true, data: fallbackRecs });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Landlord Negotiation Letter Generator
app.post('/api/ai/negotiation-script', async (req, res) => {
  try {
    const { tenantName, landlordName, locality, propertyTitle, currentAskingRent, targetRent, keyReasons } = req.body;

    try {
      const ai = getGeminiClient();
      const prompt = `Draft a polite, highly effective negotiation message (suitable for WhatsApp or Email in India) from tenant ${tenantName || 'Prospective Tenant'} to landlord ${landlordName || 'Landlord'}.
Context:
- Property: ${propertyTitle || '2 BHK Apartment'} in ${locality || 'Visakhapatnam'}
- Asking Rent: ₹${currentAskingRent} / month
- Target Rent: ₹${targetRent} / month
- Reasons: ${keyReasons || 'Community baseline data shows similar 2 BHKs in this locality average lower, willing to pay 6 months advance deposit and long-term lease'}.

Return JSON:
{
  "whatsappText": "Short direct polite WhatsApp message",
  "emailSubject": "Subject line for email",
  "emailBody": "Full formal email body"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed });
      }
    } catch (err: any) {
      console.warn('Gemini negotiation draft fallback:', err.message);
    }

    res.json({
      success: true,
      data: {
        whatsappText: `Namaste ${landlordName || 'Sir/Madam'}, I visited your property "${propertyTitle || 'Flat'}" in ${locality}. I loved the home! Based on local market averages for 2 BHKs here (around ₹${targetRent}), would you be open to considering ₹${targetRent}/month? I am ready for an immediate 11-month agreement with prompt deposit. Thank you!`,
        emailSubject: `Rental Offer Proposal for ${propertyTitle || 'Property'} - ${locality}`,
        emailBody: `Dear ${landlordName || 'Landlord'},\n\nThank you for taking the time to show me the property in ${locality}. I am very impressed with the home and maintenance.\n\nAfter researching community rent trends in ${locality}, similar properties average ₹${targetRent} per month. I am prepared to finalize the deal at ₹${targetRent}/month and can provide an advance security deposit immediately.\n\nLooking forward to your favorable reply.\n\nWarm regards,\n${tenantName || 'Tenant'}`
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const fs = await import('fs');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RentWise server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

