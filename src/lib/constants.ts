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

export const GURGAON_SECTORS = [
  "14", "15", "22", "23", "28", "31", "37D", "42", "43", "45", "46", "47", "48",
  "49", "50", "51", "52", "54", "55", "56", "57", "58", "59", "60", "61", "62",
  "63", "65", "66", "67", "68", "69", "70", "71", "72", "82", "83", "84", "85",
  "86", "88", "89", "90", "91", "92", "93", "95", "99", "102", "104", "109",
  "110", "111", "113", "114",
] as const;

export const AMENITY_LIST = [
  "Swimming Pool", "Gym", "Lift", "Club House", "Power Backup", "24x7 Security",
  "CCTV", "Garden", "Kids Play Area", "Jogging Track", "Visitor Parking",
  "Modular Kitchen", "Servant Room", "Study Room", "Balcony", "Terrace",
  "Air Conditioning", "Internet", "RO Water", "Pet Friendly",
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
