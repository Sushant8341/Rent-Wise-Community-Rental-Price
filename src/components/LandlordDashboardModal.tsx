import React, { useState } from 'react';
import { RentalListing } from '../types';
import { X, Building2, PlusCircle, Edit3, Trash2, MapPin, Phone, Mail, User, ShieldCheck, CheckCircle2, Search } from 'lucide-react';
import { formatINR } from '../data/mockData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface LandlordDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { name: string; phone: string; email: string; photoURL?: string; uid?: string } | null;
  listings: RentalListing[];
  onOpenCreateListing: () => void;
  onEditListing: (listing: RentalListing) => void;
  onDeleteListing: (id: string) => void;
}

export const LandlordDashboardModal: React.FC<LandlordDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  listings,
  onOpenCreateListing,
  onEditListing,
  onDeleteListing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'MY' | 'ALL'>('MY');
  const [listingToDelete, setListingToDelete] = useState<RentalListing | null>(null);

  if (!isOpen || !currentUser) return null;

  // Ownership matcher
  const isOwnerOfListing = (listing: RentalListing) => {
    const userEmail = (currentUser.email || '').toLowerCase().trim();
    const userPhone = (currentUser.phone || '').replace(/[^0-9]/g, '');
    const userName = (currentUser.name || '').toLowerCase().trim();

    const lEmail = (listing.landlordEmail || '').toLowerCase().trim();
    const lPhone = (listing.landlordPhone || '').replace(/[^0-9]/g, '');
    const lName = (listing.landlordName || '').toLowerCase().trim();

    return (
      (userEmail && lEmail && lEmail === userEmail) ||
      (userPhone && userPhone.length > 5 && lPhone && lPhone.includes(userPhone)) ||
      (userName && lName && lName === userName) ||
      Boolean((listing as any).ownerId && currentUser.uid && (listing as any).ownerId === currentUser.uid) ||
      listing.id.startsWith('lst-custom-')
    );
  };

  const myListings = listings.filter(isOwnerOfListing);
  const displayListings = (filterMode === 'MY' ? myListings : listings).filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.title.toLowerCase().includes(term) ||
      l.locality.toLowerCase().includes(term) ||
      l.city.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full my-auto sm:my-6 border border-slate-200 shadow-2xl overflow-hidden relative flex flex-col max-h-[94vh]">
        
        {/* Header */}
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
            <span>Landlord & Owner Section</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
            <div>
              <h2 className="font-heading font-extrabold text-lg sm:text-2xl text-white flex items-center gap-2">
                <span>Welcome, {currentUser.name}</span>
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-2 sm:gap-3">
                <span>📧 {currentUser.email}</span>
                {currentUser.phone && <span>📞 {currentUser.phone}</span>}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateListing();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create New Listing</span>
            </button>
          </div>
        </div>

        {/* Dashboard Subheader Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode('MY')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'MY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Listed Properties ({myListings.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Community Properties ({listings.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by title, area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Property Listings List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {displayListings.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">
                {filterMode === 'MY' ? 'No Properties Listed Under Your Account' : 'No Properties Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {filterMode === 'MY'
                  ? 'Click "Create New Listing" to post your apartment or house directly to RentWise.'
                  : 'Try clearing your search term or post a new property.'}
              </p>
              {filterMode === 'MY' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateListing();
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post Your First Property</span>
                </button>
              )}
            </div>
          ) : (
            displayListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {listing.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {listing.bhk} BHK • {listing.propertyType}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {listing.furnishing}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{listing.locality}, {listing.city}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Rent</span>
                      <span className="font-extrabold text-emerald-700 text-sm">
                        {formatINR(listing.rent)}<span className="text-[10px] font-normal text-slate-500">/mo</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Deposit</span>
                      <span className="font-bold text-slate-800">
                        {formatINR(listing.deposit)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Landlord Contact</span>
                      <span className="font-medium text-slate-700">
                        {listing.landlordName} ({listing.landlordPhone})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditListing(listing);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setListingToDelete(listing);
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Remove Listing</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={!!listingToDelete}
        title={`Delete "${listingToDelete?.title || 'Listing'}"`}
        message="Are you sure you want to permanently remove this property listing from RentWise? This action cannot be undone."
        onConfirm={() => {
          if (listingToDelete) {
            onDeleteListing(listingToDelete.id);
            setListingToDelete(null);
          }
        }}
        onCancel={() => setListingToDelete(null)}
      />
    </div>
  );
};
