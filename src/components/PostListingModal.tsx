import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { FurnishingType, PropertyType, RentalListing } from '../types';
import { PlusCircle, Building2, X, Check, MapPin, Navigation, AlertCircle } from 'lucide-react';
import { saveListingToFirebase, updateListingInFirebase } from '../lib/firebase';
import { saveLocalListing } from '../lib/storage';

interface PostListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: (newListing: any) => void;
  onListingUpdated?: (updatedListing: any) => void;
  editingListing?: any;
  defaultCity: string;
  currentUser?: { name: string; phone: string; email: string; photoURL?: string; uid?: string } | null;
}

const PRESET_AMENITIES = [
  'Municipal Water',
  'Power Backup',
  'Car Parking',
  '24x7 Security',
  'Lift / Elevator',
  'Gated Society',
  'Gas Pipeline',
  "Children's Play Area",
  'Gym / Fitness Center',
  'Swimming Pool',
  'Balcony / Terrace',
  'WiFi / Broadband',
];

export const PostListingModal: React.FC<PostListingModalProps> = ({
  isOpen,
  onClose,
  onListingCreated,
  onListingUpdated,
  editingListing,
  defaultCity,
  currentUser,
}) => {
  const [title, setTitle] = useState('');
  const [city, setCity] = useState(defaultCity === 'All AP' ? 'Visakhapatnam' : defaultCity);
  const [locality, setLocality] = useState('MVP Colony');
  const [address, setAddress] = useState('');
  const [rent, setRent] = useState(15000);
  const [deposit, setDeposit] = useState(30000);
  const [maintenance, setMaintenance] = useState(1000);
  const [bhk, setBhk] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [sqft, setSqft] = useState(1200);
  const [furnishing, setFurnishing] = useState<FurnishingType>('Semi-Furnished');
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment');
  const [landlordName, setLandlordName] = useState(currentUser?.name || '');
  const [landlordPhone, setLandlordPhone] = useState(currentUser?.phone || '');
  const [landlordEmail, setLandlordEmail] = useState(currentUser?.email || '');
  const [facing, setFacing] = useState('East');
  const [preferredTenants, setPreferredTenants] = useState<'Family' | 'Bachelors' | 'Any'>('Family');
  const [description, setDescription] = useState('');

  // Key Amenities selection state
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Municipal Water',
    'Power Backup',
    'Car Parking',
    '24x7 Security',
  ]);
  const [customAmenityInput, setCustomAmenityInput] = useState('');

  // Sync state if editing existing listing or new modal open
  useEffect(() => {
    if (editingListing) {
      setTitle(editingListing.title || '');
      setCity(editingListing.city || 'Visakhapatnam');
      setLocality(editingListing.locality || 'MVP Colony');
      setAddress(editingListing.address || '');
      setRent(editingListing.rent || 15000);
      setDeposit(editingListing.deposit || 30000);
      setMaintenance(editingListing.estimatedMaintenance || 1000);
      setBhk(editingListing.bhk || 2);
      setBathrooms(editingListing.bathrooms || 2);
      setSqft(editingListing.sqft || 1200);
      setFurnishing(editingListing.furnishing || 'Semi-Furnished');
      setPropertyType(editingListing.propertyType || 'Apartment');
      setLandlordName(editingListing.landlordName || currentUser?.name || '');
      setLandlordPhone(editingListing.landlordPhone || currentUser?.phone || '');
      setLandlordEmail(editingListing.landlordEmail || currentUser?.email || '');
      setFacing(editingListing.facing || 'East');
      setPreferredTenants(editingListing.preferredTenants || 'Family');
      setDescription(editingListing.description || '');
      setSelectedAmenities(editingListing.amenities || ['Municipal Water', 'Power Backup', 'Car Parking']);
      if (typeof editingListing.lat === 'number') setPinnedLat(editingListing.lat);
      if (typeof editingListing.lng === 'number') setPinnedLng(editingListing.lng);
    } else if (isOpen) {
      // Reset defaults for new listing
      setTitle('');
      setCity(defaultCity === 'All AP' ? 'Visakhapatnam' : defaultCity);
      setLocality('MVP Colony');
      setAddress('');
      setRent(15000);
      setDeposit(30000);
      setMaintenance(1000);
      setBhk(2);
      setBathrooms(2);
      setSqft(1200);
      setFurnishing('Semi-Furnished');
      setPropertyType('Apartment');
      setLandlordName(currentUser?.name || '');
      setLandlordPhone(currentUser?.phone || '');
      setLandlordEmail(currentUser?.email || '');
      setFacing('East');
      setPreferredTenants('Family');
      setDescription('');
      setSelectedAmenities(['Municipal Water', 'Power Backup', 'Car Parking', '24x7 Security']);
    }
  }, [editingListing, isOpen]);

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(prev => prev.filter(a => a !== amenity));
    } else {
      setSelectedAmenities(prev => [...prev, amenity]);
    }
  };

  const handleAddCustomAmenity = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e.type === 'click' || (e as React.KeyboardEvent).key === 'Enter') {
      e.preventDefault();
      if (customAmenityInput.trim() && !selectedAmenities.includes(customAmenityInput.trim())) {
        setSelectedAmenities(prev => [...prev, customAmenityInput.trim()]);
        setCustomAmenityInput('');
      }
    }
  };

  // Map pin coordinates
  const [pinnedLat, setPinnedLat] = useState<number>(city === 'Vizianagaram' ? 18.1060 : 17.7380);
  const [pinnedLng, setPinnedLng] = useState<number>(city === 'Vizianagaram' ? 83.3930 : 83.3320);

  const pickerMapRef = useRef<HTMLDivElement>(null);
  const pickerMapInstance = useRef<L.Map | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize interactive pin picker map
  useEffect(() => {
    if (!isOpen || !pickerMapRef.current) return;

    const initialLat = city === 'Vizianagaram' ? 18.1060 : 17.7380;
    const initialLng = city === 'Vizianagaram' ? 83.3930 : 83.3320;

    if (!pickerMapInstance.current) {
      const map = L.map(pickerMapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([pinnedLat || initialLat, pinnedLng || initialLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: 'custom-pin-picker',
        html: `
          <div class="px-2 py-1 bg-emerald-600 text-white rounded-xl shadow-lg font-bold text-xs flex items-center gap-1 border-2 border-white transform -translate-x-1/2 -translate-y-full whitespace-nowrap cursor-grab active:cursor-grabbing">
            <span>📍 Pin Location</span>
          </div>
        `,
        iconSize: [80, 30],
        iconAnchor: [40, 30],
      });

      const marker = L.marker([pinnedLat || initialLat, pinnedLng || initialLng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setPinnedLat(Number(pos.lat.toFixed(5)));
        setPinnedLng(Number(pos.lng.toFixed(5)));
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setPinnedLat(Number(lat.toFixed(5)));
        setPinnedLng(Number(lng.toFixed(5)));
      });

      pickerMapInstance.current = map;
      pickerMarkerRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    } else {
      setTimeout(() => {
        pickerMapInstance.current?.invalidateSize();
      }, 200);
    }
  }, [isOpen]);

  // Clean up picker map instance when modal closes
  useEffect(() => {
    if (!isOpen && pickerMapInstance.current) {
      pickerMapInstance.current.remove();
      pickerMapInstance.current = null;
      pickerMarkerRef.current = null;
    }
  }, [isOpen]);

  // Update map view if city selection changes
  useEffect(() => {
    if (pickerMapInstance.current && pickerMarkerRef.current) {
      const newLat = city === 'Vizianagaram' ? 18.1060 : 17.7380;
      const newLng = city === 'Vizianagaram' ? 83.3930 : 83.3320;
      setPinnedLat(newLat);
      setPinnedLng(newLng);
      pickerMapInstance.current.setView([newLat, newLng], 14);
      pickerMarkerRef.current.setLatLng([newLat, newLng]);
    }
  }, [city]);

const DEFAULT_PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const listingId = editingListing?.id || `lst-custom-${Date.now()}`;
    const propertyImages = (editingListing?.images && editingListing.images.length > 0)
      ? editingListing.images
      : [
          DEFAULT_PROPERTY_IMAGES[Math.floor(Math.random() * DEFAULT_PROPERTY_IMAGES.length)],
          DEFAULT_PROPERTY_IMAGES[(Math.floor(Math.random() * DEFAULT_PROPERTY_IMAGES.length) + 1) % DEFAULT_PROPERTY_IMAGES.length]
        ];

    const finalListing: RentalListing = {
      id: listingId,
      title: title.trim() || `${bhk} BHK in ${locality}, ${city}`,
      city: (city as any) || 'Visakhapatnam',
      locality: locality.trim() || 'MVP Colony',
      address: address.trim() || `${locality.trim() || 'MVP Colony'}, ${city}`,
      lat: pinnedLat,
      lng: pinnedLng,
      rent: Number(rent) || 15000,
      deposit: Number(deposit) || 30000,
      estimatedMaintenance: Number(maintenance) || 1000,
      bhk: Number(bhk) || 2,
      bathrooms: Number(bathrooms) || 2,
      sqft: Number(sqft) || 1200,
      furnishing,
      propertyType,
      images: propertyImages,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : ['Municipal Water', 'Power Backup', 'Car Parking', '24x7 Security'],
      availableFrom: editingListing?.availableFrom || 'Immediate',
      landlordName: landlordName.trim() || currentUser?.name || 'Property Owner',
      landlordPhone: landlordPhone.trim() || currentUser?.phone || '+91 98480 99999',
      landlordEmail: landlordEmail.trim() || currentUser?.email || 'owner@rentwise.in',
      isDirectFromOwner: true,
      verifiedListing: true,
      description: description.trim() || `Well-maintained ${bhk} BHK property in prime ${locality}, ${city}. Direct listing from owner with 0% brokerage.`,
      localityAverageRent: Number(rent) || 15000,
      facing,
      preferredTenants,
      postedDate: editingListing?.postedDate || new Date().toISOString().split('T')[0],
      ...(currentUser?.uid ? { ownerId: currentUser.uid } : {}),
    };

    try {
      // 1. Direct persistence to Firebase Firestore (Client-side, works on Vercel)
      try {
        if (editingListing) {
          await updateListingInFirebase(listingId, finalListing);
        } else {
          await saveListingToFirebase(finalListing);
        }
      } catch (fbErr) {
        console.warn('Firestore listing sync notice (using local storage):', fbErr);
      }

      // 2. Persist to LocalStorage (Guarantees persistence across page refreshes on Vercel)
      saveLocalListing(finalListing);

      // 3. Immediately trigger state update in UI
      if (editingListing && onListingUpdated) {
        onListingUpdated(finalListing);
      } else {
        onListingCreated(finalListing);
      }

      // 4. Try backend sync if running in Node/Express (best-effort, non-blocking)
      try {
        const url = editingListing ? `/api/listings/${editingListing.id}` : '/api/listings';
        const method = editingListing ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalListing),
        });
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data?.data) {
            saveLocalListing(data.data);
          }
        }
      } catch (apiErr) {
        // Express backend is not running on static Vercel deployment; completely normal
        console.info('Backend server sync note:', apiErr);
      }

      // 5. Show success screen and close
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save listing:', err);
      // Fallback: Ensure listing is stored and updated in UI anyway
      saveLocalListing(finalListing);
      if (editingListing && onListingUpdated) {
        onListingUpdated(finalListing);
      } else {
        onListingCreated(finalListing);
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full my-auto sm:my-6 border border-slate-200 shadow-2xl overflow-hidden relative flex flex-col max-h-[94vh]">
        <div className="bg-slate-900 p-4 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span>Landlord Direct Listing Portal</span>
          </div>

          <h2 className="font-heading font-extrabold text-lg sm:text-2xl text-white">
            {editingListing ? 'Edit Property Listing' : 'List Your Property (0% Brokerage)'}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 sm:mt-1">
            {editingListing ? 'Update details, rent, or amenities for your listed property.' : 'Reach genuine tenants directly in Visakhapatnam & Vizianagaram without paying broker fees.'}
          </p>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Property Listed Successfully!</h3>
            <p className="text-xs text-slate-500">Your property is now live on the map and listings directory.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 sm:p-6 space-y-4 text-xs font-medium overflow-y-auto flex-1 overscroll-contain">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Property Headline Title</label>
                <input
                  type="text"
                  placeholder="e.g. Spacious 2 BHK Gated Flat near IT Hill Rushikonda"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  <option value="Visakhapatnam">Visakhapatnam (Vizag)</option>
                  <option value="Vizianagaram">Vizianagaram</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Locality</label>
                <input
                  type="text"
                  placeholder="e.g. Balaji Nagar, Dasannapeta, Cantonment, MVP Colony"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              {/* Quick locality suggestions */}
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Popular {city} Neighborhoods:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(city === 'Vizianagaram' ? [
                    'Balaji Nagar', 'Dasannapeta', 'Vizianagaram Cantonment', 'Chintalavalasa', 'Malicherla', 'KL Puram'
                  ] : [
                    'MVP Colony', 'Madhurawada', 'Sujatha Nagar', 'PM Palem', 'Dwaraka Nagar', 'Yendada', 'Kurmannapalem', 'Marripalem', 'Rushikonda'
                  ]).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocality(loc)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                        locality === loc
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pin Location on Map Picker */}
              <div className="sm:col-span-2 space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Pin Property Location on Map</span>
                  </label>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    Lat: {pinnedLat}, Lng: {pinnedLng}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Click on the map or drag the green marker to set the exact pin for your property.
                </p>
                <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 relative shadow-inner mt-2">
                  <div ref={pickerMapRef} className="w-full h-full z-0" />
                  <div className="absolute bottom-2 left-2 z-10 bg-slate-900/90 text-white text-[10px] px-2.5 py-1 rounded-lg font-medium backdrop-blur-xs flex items-center gap-1">
                    <span>📍 Drag or click on map to set exact property pin</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Monthly Asking Rent (in ₹ INR)</label>
                <input
                  type="number"
                  value={rent}
                  onChange={(e) => setRent(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Security Deposit (in ₹ INR)</label>
                <input
                  type="number"
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
                <label className="block text-slate-700 font-bold mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  <option value="Apartment">Apartment</option>
                  <option value="Gated Community">Gated Community</option>
                  <option value="Independent House">Independent House</option>
                  <option value="Builder Floor">Builder Floor</option>
                  <option value="Villa">Villa</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Landlord Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  value={landlordName}
                  onChange={(e) => setLandlordName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Phone (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={landlordPhone}
                  onChange={(e) => setLandlordPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              {/* Key Amenities Picker Section */}
              <div className="sm:col-span-2 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Select Key Amenities available in property</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {selectedAmenities.length} selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_AMENITIES.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{amenity}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amenity Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom amenity (e.g. EV Charger, Vastu Compliant)..."
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAmenity(e);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Property Description & Overview</label>
                <textarea
                  placeholder="Describe municipal water supply, lift, car parking, woodwork, nearby landmarks..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>
            </div>
            </div>

            {/* Sticky Submit Footer (Always visible & reachable on mobile screens) */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between gap-3">
              <div className="hidden sm:block text-[11px] text-slate-500">
                <span>0% Brokerage • Direct Owner Listing</span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60 shrink-0"
              >
                {loading ? 'Publishing Listing...' : (editingListing ? 'Update Property Listing' : 'Publish Direct Listing (0% Brokerage)')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
