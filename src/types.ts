export type FurnishingType = 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';

export type PropertyType = 'Apartment' | 'Independent House' | 'Gated Community' | 'Builder Floor' | 'Villa' | 'PG / Co-Living';

export interface RentalListing {
  id: string;
  title: string;
  locality: string;
  city: 'Visakhapatnam' | 'Vizianagaram' | 'Vijayawada' | 'Guntur' | 'Tirupati';
  address: string;
  lat: number;
  lng: number;
  rent: number; // monthly rent in INR (₹)
  deposit: number; // in INR (₹)
  estimatedMaintenance: number; // monthly maintenance in INR (₹)
  bhk: number; // 1 = 1 BHK, 2 = 2 BHK, 3 = 3 BHK, 4 = 4 BHK, 0 = Studio/1RK
  bathrooms: number;
  sqft: number;
  furnishing: FurnishingType;
  propertyType: PropertyType;
  images: string[];
  amenities: string[];
  availableFrom: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  isDirectFromOwner: boolean;
  verifiedListing: boolean;
  postedDate: string;
  description: string;
  localityAverageRent: number;
  facing?: string; // e.g. "East", "North-East"
  preferredTenants?: 'Family' | 'Bachelors' | 'Any';
}

export interface CommunityRentReport {
  id: string;
  locality: string;
  city: string;
  rent: number; // in INR (₹)
  deposit: number; // in INR (₹)
  bhk: number;
  sqft: number;
  furnishing: FurnishingType;
  leaseStartDate: string; // e.g. "2025-06"
  maintenanceMonthly: number;
  landlordRating: number; // 1-5
  neighborhoodRating: number; // 1-5
  waterSupplyRating: number; // 1-5 (crucial for AP localities)
  anonymousHandle: string;
  comments: string;
  verifiedLease: boolean;
  createdAt: string;
  isAnonymous?: boolean;
  apartmentName?: string;
  floorLevel?: string;
  amenities?: string[];
}

export interface LocalityBenchmark {
  id: string;
  name: string;
  city: string;
  avgRent1BHK: number;
  avgRent2BHK: number;
  avgRent3BHK: number;
  avgRentSqft: number;
  rentInflationYoY: number; // e.g. 5.2 for 5.2%
  safetyScore: number; // 1-10
  waterSupplyScore: number; // 1-10
  transitScore: number; // 1-10
  vibeTags: string[];
  description: string;
  totalReports: number;
  centerLat: number;
  centerLng: number;
  topNearbyHubs: string[]; // e.g. "IT Hill Rushikonda", "GITAM University", "Vizag Steel Plant", "Vizianagaram Rly Station"
}

export interface LocalityQuizFilter {
  maxBudget: number;
  preferredBHK: number;
  preferredCity: string;
  primaryVibe: string;
  mustHaveAmenities: string[];
  maxCommuteMinutes: number;
  preferredTenantType: string;
  priority: 'budget' | 'commute' | 'water_supply' | 'lifestyle';
}

export interface LocalityRecommendation {
  localityName: string;
  city: string;
  matchScore: number; // percentage e.g. 94
  avgRentForType: number;
  keyHighlights: string[];
  whyMatch: string;
  transitSummary: string;
  sampleListingCount: number;
}

export interface RentCheckResult {
  locality: string;
  city: string;
  userRent: number;
  benchmarkRent: number;
  differencePercentage: number; // e.g. -12.5% or +18%
  status: 'STEAL_DEAL' | 'FAIR_MARKET' | 'SLIGHTLY_HIGH' | 'OVERPAYING';
  percentileRank: number; // e.g. 45th percentile
  aiAnalysis: string;
  negotiationPoints: string[];
  suggestedOfferRent: number;
}

