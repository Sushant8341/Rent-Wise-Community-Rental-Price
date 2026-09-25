import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  RentalListing, 
  LocalityBenchmark 
} from '../types';
import { formatINR } from '../data/mockData';
import { 
  Building2, 
  MapPin, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  SlidersHorizontal, 
  Bed, 
  Maximize2, 
  Minimize2,
  User, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  X,
  Layers,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Map as MapIcon,
  List as ListIcon,
  Columns as SplitIcon,
  Compass,
  ZoomIn,
  ZoomOut,
  Camera
} from 'lucide-react';

import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface MapListingsViewProps {
  listings: RentalListing[];
  benchmarks: LocalityBenchmark[];
  selectedCity: string;
  currentUser?: { name: string; phone: string; email: string; photoURL?: string; uid?: string } | null;
  onDeleteListing?: (id: string) => void;
}

export const MapListingsView: React.FC<MapListingsViewProps> = ({
  listings,
  benchmarks,
  selectedCity,
  currentUser,
  onDeleteListing
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Mobile View Controls ('map' | 'list' | 'split')
  const [mobileViewMode, setMobileViewMode] = useState<'map' | 'list' | 'split'>('map');
  const [isMobileFullscreen, setIsMobileFullscreen] = useState<boolean>(false);
  const [mobilePreviewListing, setMobilePreviewListing] = useState<RentalListing | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBHK, setSelectedBHK] = useState<number | 'ALL'>('ALL');
  const [maxPrice, setMaxPrice] = useState<number>(45000);
  const [directOwnerOnly, setDirectOwnerOnly] = useState<boolean>(false);
  const [myListingsOnly, setMyListingsOnly] = useState<boolean>(false);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('ALL');
  const [selectedListing, setSelectedListing] = useState<RentalListing | null>(null);
  const [mapMode, setMapMode] = useState<'listings' | 'benchmarks'>('listings');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [listingToDelete, setListingToDelete] = useState<RentalListing | null>(null);

  // Helper to check if logged in user is owner/landlord of the listing
  const isOwnerOfListing = (listing: RentalListing) => {
    if (!currentUser) return false;
    const userEmail = currentUser.email?.toLowerCase().trim();
    const userPhone = currentUser.phone?.replace(/[^0-9]/g, '');
    const userName = currentUser.name?.toLowerCase().trim();

    const lEmail = (listing.landlordEmail || '').toLowerCase().trim();
    const lPhone = (listing.landlordPhone || '').replace(/[^0-9]/g, '');
    const lName = (listing.landlordName || '').toLowerCase().trim();

    return (
      (userEmail && lEmail && lEmail === userEmail) ||
      (userPhone && userPhone.length > 5 && lPhone && lPhone.includes(userPhone)) ||
      (userName && lName && lName === userName) ||
      listing.id.startsWith('lst-custom-')
    );
  };

  // Invalidate map size when view mode, panel state or fullscreen changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [mobileViewMode, isPanelCollapsed, isMobileFullscreen, selectedCity]);

  // Filtered Listings
  const filteredListings = listings.filter(item => {
    if (myListingsOnly) {
      if (!isOwnerOfListing(item)) return false;
    }
    if (selectedCity !== 'All AP' && item.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = item.title.toLowerCase().includes(q) || 
                    item.locality.toLowerCase().includes(q) ||
                    item.address.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedBHK !== 'ALL' && item.bhk !== selectedBHK) {
      return false;
    }
    if (item.rent > maxPrice) {
      return false;
    }
    if (directOwnerOnly && !item.isDirectFromOwner) {
      return false;
    }
    if (propertyTypeFilter !== 'ALL' && item.propertyType !== propertyTypeFilter) {
      return false;
    }
    return true;
  });

  // Filtered Benchmarks for heat/locality map mode
  const filteredBenchmarks = benchmarks.filter(b => {
    if (selectedCity !== 'All AP' && b.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Center navigation helper
  const handleFlyToCity = (cityName: 'Visakhapatnam' | 'Vizianagaram') => {
    if (!mapInstanceRef.current) return;
    if (cityName === 'Vizianagaram') {
      mapInstanceRef.current.flyTo([18.1124, 83.3980], 13, { duration: 0.8 });
    } else {
      mapInstanceRef.current.flyTo([17.7280, 83.3030], 12, { duration: 0.8 });
    }
  };

  // Touch Zoom helpers
  const handleZoom = (delta: number) => {
    if (!mapInstanceRef.current) return;
    if (delta > 0) {
      mapInstanceRef.current.zoomIn();
    } else {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Map Initialization & Updates
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default coordinates based on city choice
    let centerLat = 17.7280; // Visakhapatnam center
    let centerLng = 83.3030;
    let zoom = 12;

    if (selectedCity === 'Vizianagaram') {
      centerLat = 18.1124;
      centerLng = 83.3980;
      zoom = 13;
    }

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([centerLat, centerLng], zoom);

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    } else {
      mapInstanceRef.current.setView([centerLat, centerLng], zoom);
    }

    // Render Markers
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();

      if (mapMode === 'listings') {
        filteredListings.forEach(listing => {
          const priceDisplay = listing.rent >= 1000 
            ? `₹${(listing.rent / 1000).toFixed(1).replace('.0', '')}k` 
            : `₹${listing.rent}`;

          const isSelected = mobilePreviewListing?.id === listing.id || selectedListing?.id === listing.id;

          const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div class="flex flex-col items-center select-none cursor-pointer group origin-bottom transition-transform duration-150 ${isSelected ? 'scale-115 z-50' : 'hover:scale-110'}">
                <!-- Pin Head Badge -->
                <div class="px-2.5 py-1 rounded-xl ${isSelected ? 'bg-emerald-600 ring-2 ring-emerald-300 ring-offset-1 shadow-emerald-900/30' : 'bg-slate-950 hover:bg-emerald-700'} text-white border border-emerald-400/90 text-xs font-bold shadow-xl flex items-center gap-1.5 whitespace-nowrap">
                  <span>${priceDisplay}</span>
                  <span class="w-1 h-1 rounded-full bg-emerald-300"></span>
                  <span class="text-[10px] text-emerald-200 font-semibold">${listing.bhk}BHK</span>
                </div>
                <!-- Pin Pointer Needle -->
                <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] ${isSelected ? 'border-t-emerald-600' : 'border-t-slate-950'} -mt-[1px]"></div>
                <!-- Ground Target Dot exactly on the land parcel -->
                <div class="w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500 ring-4 ring-emerald-300/50' : 'bg-slate-950 ring-1 ring-white/90'} shadow-sm -mt-0.5"></div>
              </div>
            `,
            iconSize: [84, 40],
            iconAnchor: [42, 40],
          });

          const marker = L.marker([listing.lat, listing.lng], { icon: customIcon });
          marker.on('click', () => {
            // On mobile, show the smooth bottom preview card on the map
            setMobilePreviewListing(listing);
            // On desktop, select it
            setSelectedListing(listing);
            // Pan smoothly
            mapInstanceRef.current?.panTo([listing.lat, listing.lng], { animate: true });
          });
          markersGroupRef.current?.addLayer(marker);
        });
      } else {
        // Benchmarks mode
        filteredBenchmarks.forEach(b => {
          const hasRentData = b.avgRent2BHK > 0;
          const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div class="flex flex-col items-center select-none cursor-pointer group origin-bottom transition-transform duration-150 hover:scale-105">
                <div class="px-3 py-1.5 rounded-xl bg-slate-950/95 text-emerald-100 border border-emerald-400/80 text-xs font-semibold shadow-xl flex flex-col items-center whitespace-nowrap group-hover:border-emerald-300">
                  <span class="text-[10px] uppercase text-emerald-300 font-bold tracking-wider">${b.name}</span>
                  ${hasRentData 
                    ? `<span class="text-white font-extrabold text-[11px]">Avg ₹${Math.round(b.avgRent2BHK / 1000)}k/mo</span>`
                    : `<span class="text-emerald-400 text-[10px] font-medium">Andhra Pradesh</span>`
                  }
                </div>
                <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-slate-950 -mt-[1px]"></div>
                <div class="w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-900 shadow-sm -mt-0.5"></div>
              </div>
            `,
            iconSize: [140, 52],
            iconAnchor: [70, 52],
          });

          const marker = L.marker([b.centerLat, b.centerLng], { icon: customIcon });
          marker.bindPopup(`
            <div class="p-2 font-sans max-w-xs">
              <h4 class="font-bold text-sm text-slate-900">${b.name} (${b.city})</h4>
              <p class="text-xs text-slate-600 mb-2 mt-0.5 leading-relaxed">${b.description}</p>
              ${hasRentData ? `
                <div class="text-xs font-medium space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div class="flex justify-between"><span>1 BHK Avg:</span> <strong class="text-slate-900 font-bold">₹${b.avgRent1BHK.toLocaleString('en-IN')}</strong></div>
                  <div class="flex justify-between"><span>2 BHK Avg:</span> <strong class="text-emerald-700 font-bold">₹${b.avgRent2BHK.toLocaleString('en-IN')}</strong></div>
                  <div class="flex justify-between"><span>3 BHK Avg:</span> <strong class="text-slate-900 font-bold">₹${b.avgRent3BHK.toLocaleString('en-IN')}</strong></div>
                  <div class="flex justify-between pt-1 border-t border-slate-200 text-[11px] text-slate-500">
                    <span>Water Score:</span> <strong class="text-sky-600">${b.waterSupplyScore}/10</strong>
                  </div>
                </div>
              ` : `
                <div class="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  📍 Locality in ${b.city}
                </div>
              `}
            </div>
          `);
          markersGroupRef.current?.addLayer(marker);
        });
      }
    }
  }, [filteredListings, filteredBenchmarks, selectedCity, mapMode, mobilePreviewListing]);

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Mobile View Mode Switcher Header (Visible on mobile/tablets < lg) */}
      <div className="lg:hidden mb-3 bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 w-full bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setMobileViewMode('map');
              setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              mobileViewMode === 'map'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Map View</span>
          </button>

          <button
            onClick={() => setMobileViewMode('list')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              mobileViewMode === 'list'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ListIcon className="w-4 h-4" />
            <span>Rentals ({filteredListings.length})</span>
          </button>

          <button
            onClick={() => {
              setMobileViewMode('split');
              setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              mobileViewMode === 'split'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <SplitIcon className="w-4 h-4" />
            <span>Split View</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Locality / Title Search */}
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
            <input
              type="text"
              placeholder="Search e.g. Balaji Nagar, Dasannapeta, Cantonment, MVP Colony..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* BHK Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 font-medium">
              <span className="text-slate-500 px-1.5 font-semibold text-[11px]">BHK:</span>
              {['ALL', 1, 2, 3, 4].map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBHK(b as any)}
                  className={`px-2 py-1 rounded-lg transition-colors text-xs ${
                    selectedBHK === b 
                      ? 'bg-emerald-600 text-white font-bold' 
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {b === 'ALL' ? 'All' : `${b}BHK`}
                </button>
              ))}
            </div>

            {/* Max Rent Price Slider */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-600 font-medium text-[11px]">Max:</span>
              <span className="font-bold text-emerald-700 font-mono">₹{maxPrice.toLocaleString('en-IN')}</span>
              <input
                type="range"
                min="5000"
                max="60000"
                step="2500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-20 sm:w-24 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Direct Owner Only Toggle */}
            <button
              onClick={() => setDirectOwnerOnly(!directOwnerOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                directOwnerOnly
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${directOwnerOnly ? 'text-emerald-700' : 'text-slate-400'}`} />
              <span>Owner Only</span>
            </button>

            {/* My Listings Toggle (Landlord filter) */}
            {currentUser && (
              <button
                onClick={() => setMyListingsOnly(!myListingsOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                  myListingsOnly
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>My Listings ({listings.filter(isOwnerOfListing).length})</span>
              </button>
            )}

            {/* Map Layers Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setMapMode('listings')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  mapMode === 'listings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Homes
              </button>
              <button
                onClick={() => setMapMode('benchmarks')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  mapMode === 'benchmarks' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> Locality Rates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Map & Listings */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 relative transition-all duration-300 ${
        isMobileFullscreen 
          ? 'fixed inset-0 z-50 bg-white p-2 sm:p-3' 
          : 'min-h-[440px] lg:h-[700px]'
      }`}>
        {/* Left Column: List of Homes */}
        <div className={`
          lg:col-span-5 flex-col bg-slate-50 rounded-2xl border border-slate-200 p-2 sm:p-3 overflow-hidden transition-all duration-300
          ${isPanelCollapsed ? 'hidden' : 'flex'}
          ${mobileViewMode === 'map' ? 'hidden lg:flex' : ''}
          ${mobileViewMode === 'split' ? 'h-[330px] lg:h-full order-2 lg:order-1' : ''}
          ${mobileViewMode === 'list' ? 'min-h-[420px] max-h-[78vh] lg:h-full order-1' : ''}
        `}>
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-200">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                <span>Available Rentals ({filteredListings.length})</span>
                <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h3>
              <p className="text-xs text-slate-500">
                {selectedCity} • Direct owner & verified rates
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ₹ INR / Month
              </span>
              <button
                onClick={() => setIsPanelCollapsed(true)}
                className="hidden lg:flex p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors items-center gap-1 text-xs font-semibold"
                title="Minimize rental list"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 p-1 pt-3">
            {filteredListings.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-slate-300">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-semibold text-slate-800 text-sm">No properties match filters</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Try adjusting max price, BHK filters, or clear search text.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBHK('ALL');
                    setMaxPrice(50000);
                    setDirectOwnerOnly(false);
                  }}
                  className="mt-3 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              filteredListings.map((item) => {
                const priceDiff = item.rent - item.localityAverageRent;
                const isDeal = priceDiff < 0;
                const isSelected = selectedListing?.id === item.id || mobilePreviewListing?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedListing(item);
                      setMobilePreviewListing(item);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.panTo([item.lat, item.lng], { animate: true });
                      }
                    }}
                    className={`p-3 sm:p-3.5 bg-white rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail photo / Property Badge */}
                      <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-lg bg-slate-100 overflow-hidden relative shrink-0">
                        {(() => {
                          const cleanImages = (item.images || []).filter(img => typeof img === 'string' && !img.includes('images.unsplash.com'));
                          return cleanImages.length > 0 ? (
                            <img
                              src={cleanImages[0]}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 flex flex-col items-center justify-center p-1.5 text-center text-white">
                              <Building2 className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-400 mb-0.5" />
                              <span className="text-[10px] font-bold text-emerald-100">{item.bhk} BHK</span>
                              <span className="text-[8px] text-slate-300 uppercase tracking-wider truncate max-w-full font-medium">{item.propertyType}</span>
                              <span className="text-[7px] text-slate-400 mt-0.5">{item.sqft} sqft</span>
                            </div>
                          );
                        })()}
                        {item.isDirectFromOwner && (
                          <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] sm:text-[9px] font-bold px-1 py-0.5 rounded shadow-xs">
                            Owner
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-heading font-semibold text-xs sm:text-sm text-slate-900 truncate">
                            {item.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.locality}, {item.city}</span>
                        </div>

                        {/* Specs bar */}
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-600 mt-1.5 font-medium">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                            {item.bhk} BHK
                          </span>
                          <span>•</span>
                          <span>{item.sqft} sqft</span>
                          <span>•</span>
                          <span className="truncate">{item.furnishing}</span>
                        </div>

                        {/* Price & Comparison */}
                        <div className="flex items-baseline justify-between mt-2 pt-1.5 border-t border-slate-100">
                          <div>
                            <span className="font-heading font-extrabold text-sm sm:text-base text-slate-900">
                              {formatINR(item.rent)}
                            </span>
                            <span className="text-[10px] text-slate-500">/mo</span>
                          </div>

                          {/* Deal badge */}
                          <div className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                            isDeal 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {isDeal ? (
                              <>
                                <TrendingDown className="w-3 h-3 text-emerald-600" />
                                <span>₹{Math.abs(priceDiff).toLocaleString('en-IN')} below avg</span>
                              </>
                            ) : (
                              <>
                                <TrendingUp className="w-3 h-3 text-amber-600" />
                                <span>Market rate</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Map (Made highly visible & prominent on mobile) */}
        <div className={`
          relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all duration-300
          ${isPanelCollapsed ? 'lg:col-span-12' : 'lg:col-span-7'}
          ${mobileViewMode === 'list' ? 'hidden lg:block' : 'block'}
          ${mobileViewMode === 'split' ? 'h-[300px] sm:h-[340px] lg:h-full order-1 lg:order-2' : ''}
          ${mobileViewMode === 'map' ? 'h-[460px] sm:h-[540px] lg:h-full order-1' : ''}
          ${isMobileFullscreen ? 'h-full w-full' : ''}
        `}>
          {/* Leaflet Map Canvas */}
          <div ref={mapContainerRef} className="w-full h-full z-0 min-h-[300px]" />

          {/* Expand panel floating button when collapsed (Desktop) */}
          {isPanelCollapsed && (
            <button
              onClick={() => setIsPanelCollapsed(false)}
              className="hidden lg:flex absolute top-4 left-4 z-20 bg-slate-900 text-white hover:bg-slate-800 px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700 items-center gap-2 text-xs font-bold transition-transform hover:scale-105"
            >
              <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
              <span>Show Rentals Panel ({filteredListings.length})</span>
            </button>
          )}

          {/* Mobile Fast Navigation & Controls Overlay (Top Bar on Map) */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
            {/* Quick City Centering Chips */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => handleFlyToCity('Visakhapatnam')}
                className="bg-slate-900/90 hover:bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-lg border border-slate-700/80 backdrop-blur-xs flex items-center gap-1 active:scale-95 transition-all"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vizag</span>
              </button>

              <button
                type="button"
                onClick={() => handleFlyToCity('Vizianagaram')}
                className="bg-slate-900/90 hover:bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-lg border border-slate-700/80 backdrop-blur-xs flex items-center gap-1 active:scale-95 transition-all"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vizianagaram</span>
              </button>
            </div>

            {/* Mobile Touch Zoom Controls & Fullscreen */}
            <div className="flex items-center gap-1 pointer-events-auto">
              <button
                type="button"
                onClick={() => handleZoom(1)}
                className="w-8 h-8 rounded-xl bg-white/95 text-slate-800 shadow-md border border-slate-200 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-90 transition-all"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-slate-700" />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(-1)}
                className="w-8 h-8 rounded-xl bg-white/95 text-slate-800 shadow-md border border-slate-200 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-90 transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-slate-700" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileFullscreen(!isMobileFullscreen);
                  setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
                }}
                className="w-8 h-8 rounded-xl bg-white/95 text-slate-800 shadow-md border border-slate-200 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-90 transition-all"
                title={isMobileFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
              >
                {isMobileFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-emerald-600" />
                )}
              </button>
            </div>
          </div>

          {/* Floating Map Legend Overlay */}
          <div className="absolute top-14 left-3 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-md text-[11px] font-medium text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-2 ring-emerald-400"></span>
              <span className="font-semibold">{mapMode === 'listings' ? 'Property Rent Pin' : 'Locality Rate Pin'}</span>
            </div>
          </div>

          {/* Interactive Mobile Floating Preview Card on Map (When marker is tapped on mobile/desktop) */}
          {mobilePreviewListing && (
            <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-3 animate-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 border border-slate-800">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] font-bold text-emerald-200">{mobilePreviewListing.bhk} BHK</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {mobilePreviewListing.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{mobilePreviewListing.locality}, {mobilePreviewListing.city}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobilePreviewListing(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rent Details & Action Buttons */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 gap-2">
                <div>
                  <span className="font-heading font-extrabold text-base text-slate-900">
                    {formatINR(mobilePreviewListing.rent)}
                  </span>
                  <span className="text-[10px] text-slate-500">/mo</span>
                  <span className="text-[10px] text-slate-400 ml-1">
                    (Deposit: {formatINR(mobilePreviewListing.deposit)})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${mobilePreviewListing.landlordPhone}`}
                    className="px-2.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Call</span>
                  </a>

                  <a
                    href={`https://wa.me/${mobilePreviewListing.landlordPhone.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(mobilePreviewListing.landlordName)},%20I%20saw%20your%20listing%20for%20${mobilePreviewListing.bhk}%20BHK%20on%20RentWise.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setSelectedListing(mobilePreviewListing)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Navigation Pill for Mobile Users (1-Tap Switch between Map and List) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            if (mobileViewMode === 'map') {
              setMobileViewMode('list');
            } else {
              setMobileViewMode('map');
              setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
            }
          }}
          className="bg-slate-950/95 text-white shadow-2xl px-5 py-2.5 rounded-full flex items-center gap-2 text-xs font-bold border border-slate-700/80 backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
        >
          {mobileViewMode === 'map' ? (
            <>
              <ListIcon className="w-4 h-4 text-emerald-400" />
              <span>Show Rentals List ({filteredListings.length})</span>
            </>
          ) : (
            <>
              <MapIcon className="w-4 h-4 text-emerald-400" />
              <span>Explore Interactive Map</span>
            </>
          )}
        </button>
      </div>

      {/* Full Property Details Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedListing(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="pr-10">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  {selectedListing.propertyType}
                </span>
                <span>•</span>
                <span>{selectedListing.locality}, {selectedListing.city}</span>
                {selectedListing.isDirectFromOwner && (
                  <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    Direct From Owner (0% Brokerage)
                  </span>
                )}
              </div>
              <h2 className="font-heading font-bold text-xl text-slate-900">
                {selectedListing.title}
              </h2>
              <p className="text-xs text-slate-500 mt-1">{selectedListing.address}</p>
            </div>

            {/* Image Gallery Grid or Property Banner */}
            {(() => {
              const cleanImages = (selectedListing.images || []).filter(img => typeof img === 'string' && !img.includes('images.unsplash.com'));
              return cleanImages.length > 0 ? (
                <div className="my-4 space-y-2">
                  <div className="h-56 sm:h-72 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 relative group">
                    <img
                      src={cleanImages[0]}
                      alt="Property Primary Photo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5 shadow-md">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Direct Owner Photo ({cleanImages.length} available)</span>
                    </div>
                  </div>
                  {cleanImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {cleanImages.slice(1, 5).map((img, idx) => (
                        <div key={idx} className="h-20 sm:h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={img}
                            alt={`Photo ${idx + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="my-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{selectedListing.bhk} BHK {selectedListing.propertyType}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">{selectedListing.locality}, {selectedListing.city} • Exact location pinned on map</p>
                      <span className="text-[10px] text-emerald-300 font-medium block mt-0.5">0% Brokerage Direct Owner Listing • No Fake Stock Photos</span>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-semibold shrink-0">
                    Verified Direct Listing
                  </span>
                </div>
              );
            })()}

            {/* Price & Deposit Summary Card */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 my-4">
              <div>
                <div className="text-xs text-slate-400">Monthly Rent</div>
                <div className="font-heading font-extrabold text-2xl text-emerald-400">
                  {formatINR(selectedListing.rent)} <span className="text-xs text-slate-300 font-normal">/ month</span>
                </div>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <div className="text-xs text-slate-400">Security Deposit</div>
                <div className="font-bold text-lg text-white">
                  {formatINR(selectedListing.deposit)}
                </div>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <div className="text-xs text-slate-400">Est. Monthly Maint.</div>
                <div className="font-bold text-base text-slate-200">
                  {formatINR(selectedListing.estimatedMaintenance)}
                </div>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs font-medium">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 text-[11px]">BHK / Bedrooms</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedListing.bhk} BHK</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 text-[11px]">Super Area</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedListing.sqft} sqft</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 text-[11px]">Furnishing</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedListing.furnishing}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 text-[11px]">Facing / Preferred</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedListing.facing || 'East'} • {selectedListing.preferredTenants || 'Family'}</div>
              </div>
            </div>

            {/* Description */}
            <div className="my-4">
              <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider mb-1">
                Property Description
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {selectedListing.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="my-4">
              <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider mb-2">
                Key Amenities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedListing.amenities.map((am, i) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
                    ✓ {am}
                  </span>
                ))}
              </div>
            </div>

            {/* Landlord Contact Box */}
            <div className="bg-emerald-900 text-emerald-50 p-4 rounded-2xl mt-6">
              <div className="flex items-center justify-between mb-3 border-b border-emerald-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-emerald-100">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">{selectedListing.landlordName}</h5>
                    <p className="text-[11px] text-emerald-300">Property Owner • Listed directly</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-200 bg-emerald-800/80 px-2.5 py-1 rounded-full border border-emerald-700">
                  Verified Owner
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={`tel:${selectedListing.landlordPhone}`}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Owner: {selectedListing.landlordPhone}</span>
                </a>

                <a
                  href={`https://wa.me/${selectedListing.landlordPhone.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(selectedListing.landlordName)},%20I%20am%20interested%20in%20your%20${selectedListing.bhk}%20BHK%20property%20"${encodeURIComponent(selectedListing.title)}"%20on%20RentWise.`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-emerald-700"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Landlord Delete Control Section */}
            {isOwnerOfListing(selectedListing) && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-xs text-red-900 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Manage Property Listing</span>
                  </h5>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Has this property been rented out or is no longer available? You can remove it permanently from RentWise.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setListingToDelete(selectedListing);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Listing</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!listingToDelete}
        title={`Delete "${listingToDelete?.title || 'Listing'}"`}
        message="Are you sure you want to permanently remove this property listing from RentWise? This action cannot be undone."
        onConfirm={() => {
          if (listingToDelete) {
            if (onDeleteListing) onDeleteListing(listingToDelete.id);
            if (selectedListing?.id === listingToDelete.id) setSelectedListing(null);
            if (mobilePreviewListing?.id === listingToDelete.id) setMobilePreviewListing(null);
            setListingToDelete(null);
          }
        }}
        onCancel={() => setListingToDelete(null)}
      />
    </div>
  );
};
