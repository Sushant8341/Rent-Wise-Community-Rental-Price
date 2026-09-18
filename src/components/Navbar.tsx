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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & City Selector */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('map')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-bold text-xl tracking-tight text-slate-900">
                    Rent<span className="text-emerald-600">Wise</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    AP
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">Community Rent & Home Finder</p>
              </div>
            </button>

            {/* City Dropdown Selector */}
            <div className="relative">
              <div className="flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer pr-2"
                >
                  <option value="Visakhapatnam">Visakhapatnam (Vizag)</option>
                  <option value="Vizianagaram">Vizianagaram</option>
                  <option value="All AP">All Andhra Pradesh</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
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
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenContribute}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Share My Rent (Anon)</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenDashboard}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 pl-2.5 pr-2 py-1 rounded-xl text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                  title="Open Landlord Dashboard"
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.name} 
                      className="w-5 h-5 rounded-full object-cover border border-slate-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-[10px]">
                      {(currentUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline font-bold max-w-[110px] truncate">{currentUser.name || currentUser.email}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded ml-0.5">
                    Owner Dashboard
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  title="Log Out"
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Log In</span>
              </button>
            )}

            <button
              onClick={onOpenListProperty}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 transition-all hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Listing</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Navigation bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-slate-200 overflow-x-auto text-xs gap-1">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'map' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Map View
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'community' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Rent Data
          </button>
        </div>
      </div>
    </header>
  );
};
