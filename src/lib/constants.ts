/**
 * Domain constants for BrokrSuite.
 * Single source of truth for dropdown options and enum labels.
 */

export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "builder_floor", label: "Builder Floor" },
  { value: "villa", label: "Villa" },
  { value: "independent_house", label: "Independent House" },
  { value: "penthouse", label: "Penthouse" },
  { value: "plot", label: "Plot" },
  { value: "commercial", label: "Commercial" },
  { value: "retail_shop", label: "Retail Shop" },
  { value: "office_space", label: "Office Space" },
  { value: "warehouse", label: "Warehouse" },
  { value: "farm_house", label: "Farm House" },
] as const;

export const PURPOSES = [
  { value: "sale", label: "Sale" },
  { value: "rent", label: "Rent" },
  { value: "lease", label: "Lease" },
] as const;

export const STATUSES = [
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
  { value: "rented", label: "Rented" },
  { value: "draft", label: "Draft" },
  { value: "under_offer", label: "Under Offer" },
  { value: "archived", label: "Archived" },
] as const;

export const FACINGS = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "north_east", label: "North East" },
  { value: "north_west", label: "North West" },
  { value: "south_east", label: "South East" },
  { value: "south_west", label: "South West" },
] as const;

export const AREA_UNITS = [
  { value: "sqft", label: "Sq Ft" },
  { value: "sqyard", label: "Sq Yard" },
  { value: "acre", label: "Acre" },
] as const;

export const PROPERTY_AGES = [
  { value: "new_launch", label: "New Launch" },
  { value: "ready_to_move", label: "Ready to Move" },
  { value: "under_construction", label: "Under Construction" },
  { value: "0_1", label: "0-1 Years" },
  { value: "1_5", label: "1-5 Years" },
  { value: "5_10", label: "5-10 Years" },
  { value: "10_plus", label: "10+ Years" },
] as const;

export const FURNISHINGS = [
  { value: "fully_furnished", label: "Fully Furnished" },
  { value: "semi_furnished", label: "Semi Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
] as const;

export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "visit_scheduled", label: "Visit Scheduled" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export const CITIES = ["Gurgaon", "Sohna", "Manesar"] as const;

/** All Indian states + union territories, alphabetical. */
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

/** Sector numbers 1 → 115, in order. */
export const GURGAON_SECTORS = Array.from({ length: 115 }, (_, i) => String(i + 1));

/** Well-known private colonies / townships, listed after the sectors. */
export const PRIVATE_COLONIES = [
  "DLF Phase 1", "DLF Phase 2", "DLF Phase 3", "DLF Phase 4", "DLF Phase 5",
  "Sushant Lok 1", "Sushant Lok 2", "Sushant Lok 3", "South City 1", "South City 2",
  "Palam Vihar", "Ardee City", "Nirvana Country", "Malibu Towne", "Rosewood City",
  "Uppal Southend", "Suncity", "Vatika City", "Sohna Road", "Golf Course Road",
  "Golf Course Extension Road", "New Gurgaon", "MG Road", "Old Gurgaon", "Civil Lines",
] as const;

export const AMENITY_LIST = [
  "Swimming Pool",
  "Gym",
  "Lift",
  "Club House",
  "Power Backup",
  "24x7 Security",
  "CCTV",
  "Garden",
  "Kids Play Area",
  "Jogging Track",
  "Visitor Parking",
  "Modular Kitchen",
  "Servant Room",
  "Study Room",
  "Balcony",
  "Terrace",
  "Air Conditioning",
  "Internet",
  "RO Water",
  "Pet Friendly",
] as const;

export const PROPERTY_FLAGS = [
  { key: "is_featured", label: "Featured" },
  { key: "is_verified", label: "Verified" },
  { key: "is_premium", label: "Premium" },
  { key: "is_hot", label: "Hot Property" },
  { key: "is_exclusive", label: "Exclusive" },
] as const;

/** Turn any enum-ish value into a readable label using a provided option list. */
export function labelFor(
  options: readonly { value: string; label: string }[],
  value?: string | null,
): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}
