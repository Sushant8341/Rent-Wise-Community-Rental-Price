import React from 'react';
import { 
  MapPin, 
  Search, 
  BarChart2, 
  PlusCircle, 
  Building2,
  Share2,
  User,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'community';
  setActiveTab: (tab: 'map' | 'community') => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  onOpenContribute: () => void;
  onOpenListProperty: () => void;
  currentUser: { name: string; phone: string; email: string; photoURL?: string } | null;
  onOpenAuth: () => void;
  onOpenDashboard?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedCity,
  setSelectedCity,
  onOpenContribute,
  onOpenListProperty,
  currentUser,
  onOpenAuth,
  onOpenDashboard,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button 
              onClick={() => setActiveTab('map')}
              className="flex items-center gap-1.5 sm:gap-2.5 text-left group shrink-0"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-slate-900">
                    Rent<span className="text-emerald-600">Wise</span>
                  </span>
                  <span className="px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    AP
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 hidden md:block">Community Rent & Direct Homes</p>
              </div>
            </button>

            {/* City Dropdown Selector - Desktop/Tablet only (moved to toolbar on mobile to avoid overlap) */}
            <div className="hidden sm:flex relative shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer text-xs pr-1"
                  aria-label="Select City"
                >
                  <option value="Visakhapatnam">Visakhapatnam (Vizag)</option>
                  <option value="Vizianagaram">Vizianagaram</option>
                  <option value="All AP">All Andhra Pradesh</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nav Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Map & Homes</span>
            </button>

            <button
              onClick={() => setActiveTab('community')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'community'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Community Data</span>
            </button>
          </nav>

          {/* Action CTA Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={onOpenContribute}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Share My Rent (Anon)</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={onOpenDashboard}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                  title="Open Landlord Dashboard"
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.name} 
                      className="w-5 h-5 sm:w-5 sm:h-5 rounded-full object-cover border border-slate-300 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-[10px] shrink-0">
                      {(currentUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-bold truncate max-w-[65px] sm:max-w-[140px] text-[11px] sm:text-xs">
                    {currentUser.name ? currentUser.name.split(' ')[0] : 'Account'}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  title="Log Out"
                  className="p-1 sm:p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                  aria-label="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Log In</span>
              </button>
            )}

            <button
              onClick={onOpenListProperty}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 transition-all hover:shadow-md shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Post Listing</span>
            </button>
          </div>
        </div>

        {/* Mobile Toolbar & Secondary Row */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-slate-200/80 text-xs gap-2">
          {/* Mobile City Selector: Cleanly separated with spacious tap target */}
          <div className="sm:hidden relative shrink-0">
            <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 transition-colors">
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer text-xs"
                aria-label="Select City"
              >
                <option value="Visakhapatnam">Vizag</option>
                <option value="Vizianagaram">Vizianagaram</option>
                <option value="All AP">All AP</option>
              </select>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 shrink-0">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'map' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'community' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Data</span>
            </button>
          </div>

          <button
            onClick={onOpenContribute}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shrink-0 transition-colors"
          >
            <Share2 className="w-3 h-3" />
            <span>Share Rent</span>
          </button>
        </div>
      </div>
    </header>
  );
};
