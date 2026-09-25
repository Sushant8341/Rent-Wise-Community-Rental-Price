import { RentalListing } from '../types';

const STORAGE_KEY_LISTINGS = 'rentwise_custom_listings';
const STORAGE_KEY_DELETED = 'rentwise_deleted_listings';

export function getLocalListings(): RentalListing[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LISTINGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse local listings:', err);
    return [];
  }
}

export function saveLocalListing(listing: RentalListing): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = getLocalListings();
    const existingIndex = current.findIndex(l => l.id === listing.id);
    let updated: RentalListing[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...listing };
    } else {
      updated = [listing, ...current];
    }
    localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(updated));

    // If it was previously marked as deleted, unmark it
    const deleted = getDeletedListingIds().filter(id => id !== listing.id);
    localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(deleted));
  } catch (err) {
    console.warn('Failed to save listing locally:', err);
  }
}

export function deleteLocalListing(listingId: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = getLocalListings();
    const filtered = current.filter(l => l.id !== listingId);
    localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(filtered));

    // Also track in deleted list so it stays deleted even if returned by mock or remote cache
    markListingDeleted(listingId);
  } catch (err) {
    console.warn('Failed to delete listing locally:', err);
  }
}

export function getDeletedListingIds(): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function markListingDeleted(listingId: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const deleted = getDeletedListingIds();
    if (!deleted.includes(listingId)) {
      deleted.push(listingId);
      localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(deleted));
    }
  } catch (err) {
    console.warn('Failed to mark listing deleted locally:', err);
  }
}
