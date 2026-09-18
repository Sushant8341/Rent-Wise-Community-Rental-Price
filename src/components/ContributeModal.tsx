import React, { useState, useEffect } from 'react';
import { FurnishingType } from '../types';
import { formatINR } from '../data/mockData';
import { 
  Share2, 
  ShieldCheck, 
  X, 
  Check, 
  Star, 
  Droplets, 
  Building2, 
  Layers, 
  CheckSquare, 
  Database,
  Sparkles,
  Lock,
  Dices
} from 'lucide-react';
import { saveAnonymousReportToFirebase } from '../lib/firebase';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportAdded: (newReport: any) => void;
  defaultCity: string;
}

const PRESET_APARTMENT_AMENITIES = [
  'Municipal Water',
  'Power Backup',
  'Car Parking',
  '24x7 Security',
  'Lift / Elevator',
  'Gated Society',
  'Gas Pipeline',
  'Balcony / Terrace',
];

const VIZIANAGARAM_LOCALITIES = [
  'Balaji Nagar',
  'Dasannapeta',
  'Vizianagaram Cantonment',
  'Chintalavalasa',
  'Malicherla',
  'KL Puram & Ring Road',
  'Phool Bagh',
  'Baba Metta',
];

const VIZAG_LOCALITIES = [
  'MVP Colony',
  'Madhurawada',
  'Beach Road & Siripuram',
  'Sujatha Nagar & Pendurthi',
  'PM Palem (Pothinamallayya Palem)',
  'Dwaraka Nagar & RTC Complex',
  'Yendada',
  'Kurmannapalem & Steel Plant',
  'Marripalem & NAD Junction',
  'Rushikonda',
  'Seethammadhara',
  'Gajuwaka & Sheela Nagar',
];

export const ContributeModal: React.FC<ContributeModalProps> = ({
  isOpen,
  onClose,
  onReportAdded,
  defaultCity,
}) => {
  const [city, setCity] = useState<string>(defaultCity === 'All AP' ? 'Visakhapatnam' : defaultCity);
  const [locality, setLocality] = useState<string>(
    defaultCity === 'Vizianagaram' ? 'Balaji Nagar' : 'MVP Colony'
  );
  const [apartmentName, setApartmentName] = useState<string>('');
  const [floorLevel, setFloorLevel] = useState<string>('2nd Floor');
  const [rent, setRent] = useState<number>(12000);
  const [deposit, setDeposit] = useState<number>(24000);
  const [bhk, setBhk] = useState<number>(2);
  const [sqft, setSqft] = useState<number>(1050);
  const [furnishing, setFurnishing] = useState<FurnishingType>('Semi-Furnished');
  const [leaseStartDate, setLeaseStartDate] = useState<string>('2025-06');
  const [maintenanceMonthly, setMaintenanceMonthly] = useState<number>(600);
  const [landlordRating, setLandlordRating] = useState<number>(5);
  const [waterSupplyRating, setWaterSupplyRating] = useState<number>(5);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Municipal Water',
    'Power Backup',
    'Car Parking',
    '24x7 Security'
  ]);
  const [comments, setComments] = useState<string>('');
  const [anonymousHandle, setAnonymousHandle] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  // Helper to generate random anonymous handles
  const generateRandomHandle = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const prefix = locality ? locality.replace(/[^a-zA-Z0-9]/g, '') : (city === 'Vizianagaram' ? 'VZM' : 'Vizag');
    const roles = ['Resident', 'Tenant', 'Local', 'Renter'];
    const role = roles[Math.floor(Math.random() * roles.length)];
    return `${prefix}_${role}_#${randomNum}`;
  };

  // Set default anonymous handle on mount or city switch
  useEffect(() => {
    if (!anonymousHandle) {
      setAnonymousHandle(generateRandomHandle());
    }
  }, [locality, city]);

  if (!isOpen) return null;

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(prev => prev.filter(a => a !== amenity));
    } else {
      setSelectedAmenities(prev => [...prev, amenity]);
    }
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    if (newCity === 'Vizianagaram') {
      setLocality('Balaji Nagar');
      setRent(9500);
      setDeposit(19000);
    } else {
      setLocality('MVP Colony');
      setRent(15000);
      setDeposit(30000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalHandle = anonymousHandle.trim() || generateRandomHandle();

    const payload = {
      city,
      locality,
      apartmentName: apartmentName || `${bhk} BHK Apartment`,
      floorLevel,
      rent,
      deposit,
      bhk,
      sqft,
      furnishing,
      leaseStartDate,
      maintenanceMonthly,
      landlordRating,
      waterSupplyRating,
      amenities: selectedAmenities,
      comments,
      anonymousHandle: finalHandle,
      verifiedLease: true,
      isAnonymous: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      // 1. Save directly to Firebase Firestore
      const fbSaved = await saveAnonymousReportToFirebase(payload);

      // 2. Also send to API endpoint for local persistence
      let serverReport = null;
      try {
        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          serverReport = data.data;
        }
      } catch (err) {
        console.warn('Backend API server sync warning:', err);
      }

      const finalReport = fbSaved || serverReport || { ...payload, id: `rep-custom-${Date.now()}` };
      onReportAdded(finalReport);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to submit report to Firebase:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeLocalityList = city === 'Vizianagaram' ? VIZIANAGARAM_LOCALITIES : VIZAG_LOCALITIES;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full my-8 border border-slate-200 shadow-2xl overflow-hidden relative">
        {/* Header with Anonymous Protection Banner */}
        <div className="bg-emerald-950 p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-emerald-900/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Anonymous Resident Submission</span>
          </div>

          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
            Contribute Rental Data (Anonymous)
          </h2>
          <p className="text-xs text-emerald-200 mt-1 leading-relaxed">
            No login or phone number required. Protect your identity while preventing future renters from overpaying in Andhra Pradesh.
          </p>

          {/* Privacy Guarantee Pill */}
          <div className="mt-3 flex items-center gap-2 text-[11px] bg-emerald-900/80 border border-emerald-800 rounded-xl px-3 py-1.5 text-emerald-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Zero personal tracking: No flat number or phone is published.</span>
          </div>
        </div>

        {successMsg ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Thank You! Anonymous Submission Saved</h3>
            <p className="text-xs text-slate-500">Your rental and liveability insights have been added to the community database.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs font-medium max-h-[75vh] overflow-y-auto">
            {/* City and Locality Selection with Quick Chips */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Locality & City</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 cursor-pointer"
                  >
                    <option value="Visakhapatnam">Visakhapatnam (Vizag)</option>
                    <option value="Vizianagaram">Vizianagaram</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Locality</label>
                  <input
                    type="text"
                    placeholder="Select below or type locality"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Quick Locality Selection Chips */}
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  Popular {city} Localities (Click to select):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeLocalityList.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocality(loc)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        locality === loc
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rental Financials Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Monthly Rent (₹ INR)</label>
                <input
                  type="number"
                  placeholder="12000"
                  value={rent}
                  onChange={(e) => setRent(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Security Deposit Paid (₹ INR)</label>
                <input
                  type="number"
                  placeholder="24000"
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">BHK / Bedrooms</label>
                <select
                  value={bhk}
                  onChange={(e) => setBhk(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  <option value={1}>1 BHK</option>
                  <option value={2}>2 BHK</option>
                  <option value={3}>3 BHK</option>
                  <option value={4}>4 BHK</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Monthly Maintenance (₹ INR)</label>
                <input
                  type="number"
                  placeholder="600"
                  value={maintenanceMonthly}
                  onChange={(e) => setMaintenanceMonthly(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Furnishing</label>
                <select
                  value={furnishing}
                  onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                  <option value="Fully Furnished">Fully Furnished</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Approx Carpet Area (sqft)</label>
                <input
                  type="number"
                  value={sqft}
                  onChange={(e) => setSqft(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* Ratings: Landlord & Water Supply */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Landlord Rating</label>
                <select
                  value={landlordRating}
                  onChange={(e) => setLandlordRating(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5) Excellent & Fair</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5) Good & Cooperative</option>
                  <option value={3}>⭐⭐⭐ (3/5) Average</option>
                  <option value={2}>⭐⭐ (2/5) Strict/Unfriendly</option>
                  <option value={1}>⭐ (1/5) Poor / High Deductions</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Water Supply Quality</label>
                <select
                  value={waterSupplyRating}
                  onChange={(e) => setWaterSupplyRating(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  <option value={5}>💧 24/7 Municipal Tap + Borewell</option>
                  <option value={4}>💧 Good Municipal Water Supply</option>
                  <option value={3}>💧 Regular Tanker in Peak Summer</option>
                  <option value={2}>💧 Frequent Water Scarcity</option>
                </select>
              </div>
            </div>

            {/* Key Amenities */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Amenities Available</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {PRESET_APARTMENT_AMENITIES.map((am) => (
                  <button
                    key={am}
                    type="button"
                    onClick={() => toggleAmenity(am)}
                    className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-colors border ${
                      selectedAmenities.includes(am)
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {selectedAmenities.includes(am) ? '✓ ' : '+ '}{am}
                  </button>
                ))}
              </div>
            </div>

            {/* Resident Comments */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Resident Advice / Honest Feedback</label>
              <textarea
                placeholder="e.g. Quiet neighborhood, municipal water comes twice daily, owner does not interfere, safe for family..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            {/* Anonymous Pseudonym Handle with Randomizer Button */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-800 font-bold flex items-center gap-1 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Your Anonymous Handle</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAnonymousHandle(generateRandomHandle())}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Randomize</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="e.g. BalajiNagar_Tenant_#412"
                value={anonymousHandle}
                onChange={(e) => setAnonymousHandle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs font-semibold text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                This public alias protects your personal identity in the community database.
              </p>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Publishing Anonymously...' : 'Submit Anonymous Rent Report'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
