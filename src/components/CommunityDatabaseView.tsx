import React, { useState } from 'react';
import { CommunityRentReport, LocalityBenchmark } from '../types';
import { formatINR } from '../data/mockData';
import { 
  BarChart2, 
  Search, 
  Droplets, 
  ShieldCheck, 
  Star, 
  MapPin, 
  TrendingUp, 
  PlusCircle, 
  Calendar,
  Building2,
  Users,
  Layers,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface CommunityDatabaseViewProps {
  reports: CommunityRentReport[];
  benchmarks: LocalityBenchmark[];
  selectedCity: string;
  onOpenContributeModal: () => void;
}

const POPULAR_LOCALITIES_VZM = [
  'Balaji Nagar',
  'Dasannapeta',
  'Vizianagaram Cantonment',
  'Chintalavalasa',
  'Malicherla',
  'KL Puram & Ring Road',
  'Phool Bagh',
];

const POPULAR_LOCALITIES_VIZAG = [
  'MVP Colony',
  'Madhurawada',
  'Beach Road',
  'Sujatha Nagar & Pendurthi',
  'PM Palem',
  'Dwaraka Nagar',
  'Yendada',
  'Kurmannapalem & Steel Plant',
  'Marripalem & NAD Junction',
  'Rushikonda',
];

export const CommunityDatabaseView: React.FC<CommunityDatabaseViewProps> = ({
  reports,
  benchmarks,
  selectedCity,
  onOpenContributeModal,
}) => {
  const [searchLocality, setSearchLocality] = useState('');
  const [bhkFilter, setBhkFilter] = useState<number | 'ALL'>('ALL');
  const [anonymousOnly, setAnonymousOnly] = useState<boolean>(false);

  // Filter reports
  const filteredReports = reports.filter(r => {
    if (selectedCity !== 'All AP' && r.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    if (searchLocality && !r.locality.toLowerCase().includes(searchLocality.toLowerCase())) {
      return false;
    }
    if (bhkFilter !== 'ALL' && r.bhk !== bhkFilter) {
      return false;
    }
    if (anonymousOnly && !r.isAnonymous && !r.anonymousHandle) {
      return false;
    }
    return true;
  });

  // Filter benchmarks for chart
  const filteredBenchmarks = benchmarks.filter(b => {
    if (selectedCity !== 'All AP' && b.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Chart dataset for 2 BHK average rent comparisons
  const chartData = filteredBenchmarks.map(b => ({
    name: b.name.replace('& Siripuram', '').replace('& Sheela Nagar', '').replace('& Ring Road', '').replace('& Pendurthi', '').replace('& RTC Complex', '').replace('& Steel Plant Township', '').replace('& NAD Junction', ''),
    avg2BHK: b.avgRent2BHK,
    avg1BHK: b.avgRent1BHK,
    city: b.city,
  }));

  // Calculate stats
  const totalSubmissions = filteredReports.length;
  const avgRent2BHK = filteredReports.length > 0 
    ? Math.round(filteredReports.reduce((acc, r) => acc + r.rent, 0) / filteredReports.length)
    : 13500;

  const quickFilterLocalities = selectedCity === 'Vizianagaram' 
    ? POPULAR_LOCALITIES_VZM 
    : (selectedCity === 'Visakhapatnam' ? POPULAR_LOCALITIES_VIZAG : [...POPULAR_LOCALITIES_VZM.slice(0, 4), ...POPULAR_LOCALITIES_VIZAG.slice(0, 5)]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Hero Header section */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Anonymous Resident Contributions
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
              Andhra Pradesh Community Rent Database
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Explore real lease agreements submitted by residents across {selectedCity === 'All AP' ? 'Visakhapatnam, Vizianagaram & AP' : selectedCity}. Empowering tenants with market benchmarks to prevent overpaying.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onOpenContributeModal}
              className="py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Contribute Rent Data (Anonymous)</span>
            </button>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800 text-xs font-medium">
          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/60">
            <div className="text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Active AP Submissions
            </div>
            <div className="font-heading font-bold text-xl text-white mt-1">
              {totalSubmissions} Reports
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/60">
            <div className="text-slate-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Average Rent (2 BHK)
            </div>
            <div className="font-heading font-bold text-xl text-emerald-400 mt-1">
              {formatINR(avgRent2BHK)} /mo
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Data Visualization: 2 BHK Average Rent Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900">
              Locality Rent Benchmark Comparison (2 BHK)
            </h3>
            <p className="text-xs text-slate-500">
              Average monthly rent in Indian Rupees (₹) across top residential sectors in {selectedCity}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-emerald-600 rounded"></span>
            <span className="text-xs font-medium text-slate-600">2 BHK Monthly Rent (₹)</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `₹${val/1000}k`}
              />
              <Tooltip 
                formatter={(value: any) => [formatINR(Number(value)), 'Avg 2 BHK Rent']}
                contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '12px', border: 'none' }}
              />
              <Bar dataKey="avg2BHK" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.city === 'Visakhapatnam' ? '#059669' : '#0d9488'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search & Submissions Grid Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900">
              Resident Rent Submissions ({filteredReports.length})
            </h3>
            <p className="text-xs text-slate-500">
              Authentic community reports with anonymous handle & verified data
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search locality..."
                value={searchLocality}
                onChange={(e) => setSearchLocality(e.target.value)}
                className="pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
              />
              {searchLocality && (
                <button
                  onClick={() => setSearchLocality('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* BHK Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
              {['ALL', 1, 2, 3].map(b => (
                <button
                  key={b}
                  onClick={() => setBhkFilter(b as any)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    bhkFilter === b ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {b === 'ALL' ? 'All' : `${b} BHK`}
                </button>
              ))}
            </div>

            {/* Anonymous Toggle */}
            <button
              onClick={() => setAnonymousOnly(!anonymousOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                anonymousOnly
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${anonymousOnly ? 'text-emerald-700' : 'text-slate-500'}`} />
              <span>Anonymous Submissions</span>
            </button>
          </div>
        </div>

        {/* Quick Locality Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Quick Locality:</span>
          {quickFilterLocalities.map((loc) => {
            const isSelected = searchLocality.toLowerCase() === loc.toLowerCase();
            return (
              <button
                key={loc}
                onClick={() => setSearchLocality(isSelected ? '' : loc)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>

        {/* Reports Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">No community reports match filters</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Be the first resident to contribute anonymous rental data for this area and help bring transparency to the rental market!
              </p>
              <button
                onClick={onOpenContributeModal}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Contribute Anonymous Rent Data</span>
              </button>
            </div>
          ) : (
            filteredReports.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold">{report.locality}, {report.city}</span>
                    </div>
                    {report.apartmentName && (
                      <div className="text-[11px] font-medium text-slate-700 mt-0.5">
                        {report.apartmentName} {report.floorLevel && `• ${report.floorLevel}`}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span className="font-mono font-medium text-slate-600">{report.anonymousHandle || 'Anonymous_Resident'}</span>
                      <span>•</span>
                      <span>Lease: {report.leaseStartDate}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white shrink-0">
                    {report.bhk} BHK
                  </span>
                </div>

                {/* Main Rent Number */}
                <div className="my-3 p-3 bg-white rounded-xl border border-slate-200/80 flex items-baseline justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Monthly Rent Paid</div>
                    <div className="font-heading font-extrabold text-xl text-slate-900">
                      {formatINR(report.rent)} <span className="text-xs text-slate-500 font-normal">/mo</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Deposit</div>
                    <div className="font-semibold text-xs text-slate-700">
                      {formatINR(report.deposit)}
                    </div>
                  </div>
                </div>

                {/* Ratings Grid */}
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-medium my-2">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200/60 text-center">
                    <span className="text-slate-400 block text-[9px]">Landlord</span>
                    <div className="font-bold text-amber-600 flex items-center justify-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {report.landlordRating}/5
                    </div>
                  </div>

                  <div className="p-1.5 bg-white rounded-lg border border-slate-200/60 text-center">
                    <span className="text-slate-400 block text-[9px]">Water Supply</span>
                    <div className="font-bold text-sky-600 flex items-center justify-center gap-0.5">
                      <Droplets className="w-3 h-3 text-sky-500" /> {report.waterSupplyRating}/5
                    </div>
                  </div>

                  <div className="p-1.5 bg-white rounded-lg border border-slate-200/60 text-center">
                    <span className="text-slate-400 block text-[9px]">Maintenance</span>
                    <div className="font-bold text-slate-800">
                      ₹{report.maintenanceMonthly}
                    </div>
                  </div>
                </div>

                {/* Amenities pills if present */}
                {report.amenities && report.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 my-2">
                    {report.amenities.slice(0, 3).map((am, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        ✓ {am}
                      </span>
                    ))}
                    {report.amenities.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{report.amenities.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Resident Comment */}
                {report.comments && (
                  <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200/60 mt-2">
                    "{report.comments}"
                  </p>
                )}
              </div>

              {/* Action / Verified footer */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Anonymous Resident Submission
                </span>
                <span className="text-[10px] text-slate-400">
                  {report.furnishing}
                </span>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
};
