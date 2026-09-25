import React, { useEffect, useState } from 'react';
import { 
  RentalListing, 
  CommunityRentReport, 
  LocalityBenchmark 
} from './types';
import { 
  INITIAL_BENCHMARKS, 
  INITIAL_LISTINGS, 
  INITIAL_COMMUNITY_REPORTS 
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { MapListingsView } from './components/MapListingsView';
import { CommunityDatabaseView } from './components/CommunityDatabaseView';
import { ContributeModal } from './components/ContributeModal';
import { PostListingModal } from './components/PostListingModal';
import { AuthModal } from './components/AuthModal';
import { LandlordDashboardModal } from './components/LandlordDashboardModal';
import { ShieldCheck } from 'lucide-react';
import { 
  subscribeToAuth, 
  logoutUser, 
  UserProfile, 
  subscribeToFirebaseReports,
  subscribeToListingsFromFirebase,
  saveListingToFirebase,
  updateListingInFirebase,
  deleteListingFromFirebase
} from './lib/firebase';
import { 
  getLocalListings, 
  saveLocalListing, 
  deleteLocalListing, 
  getDeletedListingIds 
} from './lib/storage';

// Helper to sanitize stock images from listings
function sanitizeListing(listing: RentalListing): RentalListing {
  return {
    ...listing,
    images: Array.isArray(listing.images)
      ? listing.images.filter(img => typeof img === 'string' && !img.includes('images.unsplash.com'))
      : []
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'community'>('map');
  const [selectedCity, setSelectedCity] = useState<string>('Visakhapatnam');

  // User Authentication State (Firebase)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((profile) => {
      setCurrentUser(profile);
    });
    return () => unsubscribe();
  }, []);

  // State data with local storage & deleted filter initialized
  const [listings, setListings] = useState<RentalListing[]>(() => {
    const local = getLocalListings();
    const deletedIds = new Set(getDeletedListingIds());
    const combined = [...local, ...INITIAL_LISTINGS].filter(l => !deletedIds.has(l.id));
    const seen = new Set<string>();
    return combined.map(sanitizeListing).filter(l => {
      if (seen.has(l.id)) return false;
      seen.add(l.id);
      return true;
    });
  });
  const [reports, setReports] = useState<CommunityRentReport[]>(INITIAL_COMMUNITY_REPORTS);
  const [benchmarks, setBenchmarks] = useState<LocalityBenchmark[]>(INITIAL_BENCHMARKS);

  // Modal controls
  const [isContributeOpen, setIsContributeOpen] = useState<boolean>(false);
  const [isPostListingOpen, setIsPostListingOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [editingListing, setEditingListing] = useState<RentalListing | null>(null);

  // Subscribe to real-time Firebase reports
  useEffect(() => {
    const unsub = subscribeToFirebaseReports(
      (fbReports) => {
        if (fbReports && fbReports.length > 0) {
          setReports(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newFbReports = fbReports.filter(r => !existingIds.has(r.id));
            return [...newFbReports, ...prev];
          });
        }
      },
      (err) => {
        console.info('Live Firestore reports listener is waiting for Firestore rules configuration in Firebase Console.');
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Subscribe to real-time Firebase listings
  useEffect(() => {
    const unsub = subscribeToListingsFromFirebase(
      (fbListings) => {
        if (fbListings && fbListings.length > 0) {
          const deletedIds = new Set(getDeletedListingIds());
          setListings(prev => {
            const currentMap = new Map(prev.map(l => [l.id, l]));
            fbListings.forEach(item => {
              if (!deletedIds.has(item.id)) {
                currentMap.set(item.id, sanitizeListing(item as RentalListing));
              }
            });
            return Array.from(currentMap.values());
          });
        }
      },
      (err) => {
        console.info('Live Firestore listings listener status:', err);
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Fetch live API data on mount (gracefully handles static Vercel hosting)
  useEffect(() => {
    async function loadData() {
      try {
        const results = await Promise.allSettled([
          fetch('/api/listings'),
          fetch('/api/reports'),
          fetch('/api/benchmarks'),
        ]);

        const [listingsRes, reportsRes, benchmarksRes] = results;

        if (listingsRes.status === 'fulfilled' && listingsRes.value.ok) {
          try {
            const d = await listingsRes.value.json();
            if (d?.data?.length) {
              const deletedIds = new Set(getDeletedListingIds());
              setListings(prev => {
                const currentMap = new Map(prev.map(l => [l.id, l]));
                d.data.forEach((item: RentalListing) => {
                  if (!deletedIds.has(item.id)) {
                    currentMap.set(item.id, sanitizeListing(item));
                  }
                });
                return Array.from(currentMap.values());
              });
            }
          } catch (e) {
            // Handled safely
          }
        }
        if (reportsRes.status === 'fulfilled' && reportsRes.value.ok) {
          try {
            const d = await reportsRes.value.json();
            if (d?.data?.length) setReports(d.data);
          } catch (e) {}
        }
        if (benchmarksRes.status === 'fulfilled' && benchmarksRes.value.ok) {
          try {
            const d = await benchmarksRes.value.json();
            if (d?.data?.length) setBenchmarks(d.data);
          } catch (e) {}
        }
      } catch (err) {
        console.info('Running in direct client-storage mode (normal for Vercel):', err);
      }
    }
    loadData();
  }, []);

  const handleListingCreated = async (newListing: RentalListing) => {
    saveLocalListing(newListing);
    try {
      await saveListingToFirebase(newListing);
    } catch (e) {
      console.warn('Listing saved locally, Firestore sync notice:', e);
    }
    setListings(prev => [newListing, ...prev.filter(l => l.id !== newListing.id)]);
  };

  const handleListingUpdated = async (updatedListing: RentalListing) => {
    saveLocalListing(updatedListing);
    try {
      await updateListingInFirebase(updatedListing.id, updatedListing);
    } catch (e) {
      console.warn('Listing updated locally, Firestore sync notice:', e);
    }
    setListings(prev => prev.map(item => item.id === updatedListing.id ? updatedListing : item));
    setEditingListing(null);
  };

  const handleDeleteListing = async (listingId: string) => {
    deleteLocalListing(listingId);
    try {
      await deleteListingFromFirebase(listingId);
    } catch (e) {
      console.warn('Listing removed locally, Firestore sync notice:', e);
    }
    try {
      fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch (err) {
      // Best-effort backend call
    }
    setListings(prev => prev.filter(item => item.id !== listingId));
  };

  const handleReportAdded = (newReport: CommunityRentReport) => {
    setReports(prev => [newReport, ...prev]);
  };

  const handleOpenListProperty = () => {
    setEditingListing(null);
    if (!currentUser) {
      setIsAuthOpen(true);
    } else {
      setIsPostListingOpen(true);
    }
  };

  const handleEditListing = (listing: RentalListing) => {
    setEditingListing(listing);
    setIsPostListingOpen(true);
  };

  const handleOpenDashboard = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
    } else {
      setIsDashboardOpen(true);
    }
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsPostListingOpen(true);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setIsDashboardOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white overflow-x-hidden w-full max-w-full">
      {/* Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        onOpenContribute={() => setIsContributeOpen(true)}
        onOpenListProperty={handleOpenListProperty}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDashboard={handleOpenDashboard}
        onLogout={handleLogout}
      />

      {/* Main Content Render */}
      <main className="flex-1">
        {activeTab === 'map' && (
          <MapListingsView
            listings={listings}
            benchmarks={benchmarks}
            selectedCity={selectedCity}
            currentUser={currentUser}
            onDeleteListing={handleDeleteListing}
          />
        )}

        {activeTab === 'community' && (
          <CommunityDatabaseView
            reports={reports}
            benchmarks={benchmarks}
            selectedCity={selectedCity}
            onOpenContributeModal={() => setIsContributeOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              RW
            </div>
            <span className="font-heading font-bold text-slate-200">
              RentWise Andhra Pradesh
            </span>
            <span className="text-slate-600">|</span>
            <span>Visakhapatnam & Vizianagaram Transparency Network</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Anonymous Resident Submissions
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold font-mono">Currency: INR (₹)</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ContributeModal
        isOpen={isContributeOpen}
        onClose={() => setIsContributeOpen(false)}
        onReportAdded={handleReportAdded}
        defaultCity={selectedCity}
      />

      <PostListingModal
        isOpen={isPostListingOpen}
        onClose={() => {
          setIsPostListingOpen(false);
          setEditingListing(null);
        }}
        onListingCreated={handleListingCreated}
        onListingUpdated={handleListingUpdated}
        editingListing={editingListing}
        defaultCity={selectedCity}
        currentUser={currentUser}
      />

      <LandlordDashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        currentUser={currentUser}
        listings={listings}
        onOpenCreateListing={handleOpenListProperty}
        onEditListing={handleEditListing}
        onDeleteListing={handleDeleteListing}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
