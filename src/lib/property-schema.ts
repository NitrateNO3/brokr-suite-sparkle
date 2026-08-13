/**
 * Schema-driven configuration for the Post Property flow.
 * Adding a new property type = adding an entry here, no component changes.
 */

export type FieldKind =
  | "chips"
  | "text"
  | "number"
  | "area"
  | "money"
  | "select"
  | "toggle"
  | "date"
  | "textarea";

export type FieldOption = { value: string; label: string };

export type FieldSpec = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: readonly FieldOption[];
  placeholder?: string;
  required?: boolean;
  /** Full width on desktop (default is half). */
  wide?: boolean;
  suffix?: string;
};

export type ListingPurpose = "sale" | "rent" | "pg";

export const LISTING_PURPOSES: { value: ListingPurpose; label: string; hint: string }[] = [
  { value: "sale", label: "Sale", hint: "Sell this property" },
  { value: "rent", label: "Rent / Lease", hint: "Rent or lease out" },
  { value: "pg", label: "PG / Hostel", hint: "Paid guest or hostel beds" },
];

export type PropertyCategory =
  | "apartment"
  | "house"
  | "plot"
  | "agri"
  | "office"
  | "shop"
  | "warehouse"
  | "pg"
  | "other";

export type PropertyTypeSpec = {
  value: string;
  label: string;
  group: "Residential" | "Commercial" | "Other";
  /** Maps to the property_type enum in the database. */
  dbType: string;
  category: PropertyCategory;
};

export const PROPERTY_TYPE_CATALOGUE: readonly PropertyTypeSpec[] = [
  { value: "flat", label: "Flat / Apartment", group: "Residential", dbType: "apartment", category: "apartment" },
  { value: "builder_floor", label: "Builder Floor Apartment", group: "Residential", dbType: "builder_floor", category: "apartment" },
  { value: "independent_house", label: "Independent House", group: "Residential", dbType: "independent_house", category: "house" },
  { value: "villa", label: "Villa", group: "Residential", dbType: "villa", category: "house" },
  { value: "plot", label: "Plot / Land", group: "Residential", dbType: "plot", category: "plot" },
  { value: "studio", label: "Studio Apartment", group: "Residential", dbType: "apartment", category: "apartment" },
  { value: "farm_house", label: "Farm House", group: "Residential", dbType: "farm_house", category: "house" },
  { value: "serviced_apartment", label: "Serviced Apartment", group: "Residential", dbType: "apartment", category: "apartment" },
  { value: "penthouse", label: "Penthouse", group: "Residential", dbType: "penthouse", category: "apartment" },

  { value: "office_space", label: "Office Space", group: "Commercial", dbType: "office_space", category: "office" },
  { value: "shop", label: "Shop", group: "Commercial", dbType: "retail_shop", category: "shop" },
  { value: "showroom", label: "Showroom", group: "Commercial", dbType: "retail_shop", category: "shop" },
  { value: "commercial_building", label: "Commercial Building", group: "Commercial", dbType: "commercial", category: "office" },
  { value: "warehouse", label: "Warehouse", group: "Commercial", dbType: "warehouse", category: "warehouse" },
  { value: "industrial_building", label: "Industrial Building", group: "Commercial", dbType: "warehouse", category: "warehouse" },
  { value: "industrial_land", label: "Industrial Land", group: "Commercial", dbType: "plot", category: "plot" },
  { value: "commercial_plot", label: "Commercial Plot", group: "Commercial", dbType: "plot", category: "plot" },
  { value: "coworking", label: "Co-working Space", group: "Commercial", dbType: "office_space", category: "office" },

  { value: "agricultural_land", label: "Agricultural Land", group: "Other", dbType: "plot", category: "agri" },
  { value: "farm_land", label: "Farm Land", group: "Other", dbType: "plot", category: "agri" },
  { value: "hotel", label: "Hotel", group: "Other", dbType: "commercial", category: "other" },
  { value: "guest_house", label: "Guest House", group: "Other", dbType: "commercial", category: "other" },
  { value: "school", label: "School", group: "Other", dbType: "commercial", category: "other" },
  { value: "hospital", label: "Hospital", group: "Other", dbType: "commercial", category: "other" },
  { value: "restaurant", label: "Restaurant", group: "Other", dbType: "retail_shop", category: "other" },
  { value: "pg", label: "PG", group: "Other", dbType: "apartment", category: "pg" },
  { value: "hostel", label: "Hostel", group: "Other", dbType: "apartment", category: "pg" },
] as const;

export function findType(value: string): PropertyTypeSpec | undefined {
  return PROPERTY_TYPE_CATALOGUE.find((t) => t.value === value);
}

/* ---------------------------------- options --------------------------------- */

const num = (list: (string | number)[]): FieldOption[] =>
  list.map((v) => ({ value: String(v), label: String(v) }));

export const BHK_OPTIONS = num([1, 2, 3, 4, 5, 6]).map((o) =>
  o.value === "6" ? { value: "6", label: "6+" } : o,
);
export const COUNT_5 = num([1, 2, 3, 4, 5]).map((o) => (o.value === "5" ? { value: "5", label: "5+" } : o));
export const COUNT_0_4 = num([0, 1, 2, 3, 4]).map((o) => (o.value === "4" ? { value: "4", label: "4+" } : o));
export const FLOOR_OPTIONS: FieldOption[] = [
  { value: "-2", label: "Lower Basement" },
  { value: "-1", label: "Upper Basement" },
  { value: "0", label: "Ground" },
  ...num([1, 2, 3, 4, 5]),
  { value: "6", label: "5+" },
];
export const TOTAL_FLOOR_OPTIONS: FieldOption[] = [
  ...num([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
  { value: "13", label: "13+" },
];
export const FURNISHING_OPTIONS: FieldOption[] = [
  { value: "fully_furnished", label: "Furnished" },
  { value: "semi_furnished", label: "Semi-Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];
export const FACING_OPTIONS: FieldOption[] = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "north_east", label: "North East" },
  { value: "north_west", label: "North West" },
  { value: "south_east", label: "South East" },
  { value: "south_west", label: "South West" },
];
export const AREA_UNIT_OPTIONS: FieldOption[] = [
  { value: "sqft", label: "sq.ft" },
  { value: "sqyard", label: "sq.yd" },
  { value: "acre", label: "acre" },
];

const AGE_RESIDENTIAL: FieldOption[] = [
  { value: "ready_to_move", label: "Ready to Move" },
  { value: "under_construction", label: "Under Construction" },
  { value: "new_launch", label: "New Property" },
  { value: "5_10", label: "Resale" },
];
const AGE_COMMERCIAL: FieldOption[] = [
  { value: "ready_to_move", label: "Ready to Move" },
  { value: "under_construction", label: "Under Construction" },
  { value: "1_5", label: "Pre-Leased" },
  { value: "new_launch", label: "Vacant" },
];
const LAND_STATUS: FieldOption[] = [
  { value: "available", label: "Available" },
  { value: "approved", label: "Approved" },
  { value: "under_development", label: "Under Development" },
];

const YES_NO: FieldOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/* --------------------------------- amenities -------------------------------- */

export const AMENITY_SETS: Record<"residential" | "commercial" | "land", readonly string[]> = {
  residential: [
    "Lift", "Power Backup", "Security", "CCTV", "Swimming Pool", "Gym", "Club House", "Park",
    "Visitor Parking", "Reserved Parking", "Intercom", "Gas Pipeline", "Air Conditioning",
    "Internet", "Fire Safety", "Kids Play Area", "Tennis Court", "Basketball Court",
    "Jogging Track", "Garden", "Gated Community",
  ],
  commercial: [
    "Reception", "Conference Room", "Pantry", "CCTV", "Power Backup", "Parking", "Lift",
    "Fire Safety", "Air Conditioning", "Internet", "Security", "Cafeteria", "Service Lift",
  ],
  land: [
    "Boundary Wall", "Gated Community", "Corner Plot", "Road Access", "Water Connection",
    "Electricity", "Borewell", "Irrigation", "Security",
  ],
};

export function amenitySetFor(category: PropertyCategory): readonly string[] {
  if (category === "plot" || category === "agri") return AMENITY_SETS.land;
  if (category === "office" || category === "shop" || category === "warehouse" || category === "other")
    return AMENITY_SETS.commercial;
  return AMENITY_SETS.residential;
}

/* ------------------------------ dynamic sections ---------------------------- */

const AREA_BUILTUP: FieldSpec = { key: "builtup_area", label: "Built-up Area", kind: "area" };
const AREA_CARPET: FieldSpec = { key: "carpet_area", label: "Carpet Area", kind: "area" };
const AREA_PLOT: FieldSpec = { key: "super_area", label: "Plot Area", kind: "area", required: true };

/** Compact "features" block (chips) shown only when it makes sense. */
function featureFieldsBase(category: PropertyCategory): FieldSpec[] {
  switch (category) {
    case "apartment":
      return [
        { key: "bedrooms", label: "Bedrooms (BHK)", kind: "chips", options: BHK_OPTIONS, required: true, wide: true },
        { key: "bathrooms", label: "Bathrooms", kind: "chips", options: COUNT_5, wide: true },
        { key: "balconies", label: "Balconies", kind: "chips", options: COUNT_0_4, wide: true },
        { key: "floor_no", label: "Floor", kind: "chips", options: FLOOR_OPTIONS, wide: true },
        { key: "total_floors", label: "Total Floors", kind: "chips", options: TOTAL_FLOOR_OPTIONS, wide: true },
        { key: "furnishing", label: "Furnishing", kind: "chips", options: FURNISHING_OPTIONS, wide: true },
      ];
    case "house":
      return [
        { key: "bedrooms", label: "Bedrooms (BHK)", kind: "chips", options: BHK_OPTIONS, required: true, wide: true },
        { key: "bathrooms", label: "Bathrooms", kind: "chips", options: COUNT_5, wide: true },
        { key: "balconies", label: "Balconies", kind: "chips", options: COUNT_0_4, wide: true },
        { key: "total_floors", label: "Floors in the house", kind: "chips", options: TOTAL_FLOOR_OPTIONS, wide: true },
        { key: "furnishing", label: "Furnishing", kind: "chips", options: FURNISHING_OPTIONS, wide: true },
      ];
    case "office":
    case "shop":
    case "warehouse":
      return [
        { key: "floor_no", label: "Floor", kind: "chips", options: FLOOR_OPTIONS, wide: true },
        { key: "total_floors", label: "Total Floors", kind: "chips", options: TOTAL_FLOOR_OPTIONS, wide: true },
        { key: "furnishing", label: "Furnishing", kind: "chips", options: FURNISHING_OPTIONS, wide: true },
      ];
    case "pg":
      return [
        { key: "x_sharing", label: "Sharing", kind: "chips", wide: true, options: [
          { value: "single", label: "Single" }, { value: "double", label: "Double" },
          { value: "triple", label: "Triple" }, { value: "four", label: "Four Sharing" },
        ] },
        { key: "x_gender", label: "Preferred for", kind: "chips", wide: true, options: [
          { value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "coed", label: "Co-ed" },
        ] },
        { key: "x_ac", label: "Room type", kind: "chips", wide: true, options: [
          { value: "ac", label: "AC" }, { value: "non_ac", label: "Non-AC" },
        ] },
      ];
    default:
      return [];
  }
}

/** Type-specific detail fields (areas + everything unique to that property type). */
function detailFieldsBase(category: PropertyCategory): FieldSpec[] {
  switch (category) {
    case "apartment":
      return [
        AREA_BUILTUP, AREA_CARPET,
        { key: "parking", label: "Covered Parking", kind: "number", placeholder: "0" },
        { key: "facing", label: "Facing", kind: "select", options: FACING_OPTIONS },
        { key: "age", label: "Property Age", kind: "chips", options: AGE_RESIDENTIAL, wide: true },
        { key: "x_ownership", label: "Ownership Type", kind: "select", options: [
          { value: "freehold", label: "Freehold" }, { value: "leasehold", label: "Leasehold" },
          { value: "power_of_attorney", label: "Power of Attorney" }, { value: "co_operative", label: "Co-operative Society" },
        ] },
      ];
    case "house":
      return [
        AREA_PLOT, AREA_BUILTUP, AREA_CARPET,
        { key: "parking", label: "Covered Parking", kind: "number", placeholder: "0" },
        { key: "facing", label: "Facing", kind: "select", options: FACING_OPTIONS },
        { key: "age", label: "Property Age", kind: "chips", options: AGE_RESIDENTIAL, wide: true },
        { key: "x_extra_rooms", label: "Extra rooms", kind: "chips", wide: true, options: [
          { value: "garden", label: "Garden" }, { value: "servant", label: "Servant Room" },
          { value: "study", label: "Study Room" }, { value: "pooja", label: "Pooja Room" },
          { value: "store", label: "Store Room" }, { value: "terrace", label: "Terrace" },
        ] },
      ];
    case "plot":
      return [
        AREA_PLOT,
        { key: "facing", label: "Facing", kind: "select", options: FACING_OPTIONS },
        { key: "x_corner", label: "Corner Property", kind: "chips", options: YES_NO },
        { key: "x_gated", label: "Gated Community", kind: "chips", options: YES_NO },
        { key: "x_authority", label: "Authority / Approval", kind: "text", placeholder: "e.g. HSVP / DTCP" },
        { key: "x_land_use", label: "Land Use", kind: "select", options: [
          { value: "residential", label: "Residential" }, { value: "commercial", label: "Commercial" },
          { value: "industrial", label: "Industrial" }, { value: "institutional", label: "Institutional" },
        ] },
        { key: "x_ownership", label: "Ownership Type", kind: "select", options: [
          { value: "freehold", label: "Freehold" }, { value: "leasehold", label: "Leasehold" },
          { value: "power_of_attorney", label: "Power of Attorney" },
        ] },
        { key: "x_land_status", label: "Status", kind: "chips", options: LAND_STATUS, wide: true },
      ];
    case "agri":
      return [
        AREA_PLOT,
        { key: "x_water", label: "Water Availability", kind: "chips", options: YES_NO },
        { key: "x_electricity", label: "Electricity", kind: "chips", options: YES_NO },
        { key: "x_borewell", label: "Borewell", kind: "chips", options: YES_NO },
        { key: "x_irrigation", label: "Irrigation", kind: "chips", options: YES_NO },
        { key: "x_farm_house", label: "Farm House on land", kind: "chips", options: YES_NO },
        { key: "x_construction_allowed", label: "Construction Allowed", kind: "chips", options: YES_NO },
        { key: "x_soil", label: "Soil Type", kind: "text", placeholder: "e.g. Alluvial" },
        { key: "x_land_use", label: "Land Use", kind: "select", options: [
          { value: "agricultural", label: "Agricultural" }, { value: "farm_house", label: "Farm House" },
          { value: "plantation", label: "Plantation" },
        ] },
        { key: "x_documents", label: "Ownership Documents", kind: "text", placeholder: "e.g. Jamabandi, Mutation" },
        { key: "x_land_status", label: "Status", kind: "chips", options: LAND_STATUS, wide: true },
      ];
    case "office":
      return [
        AREA_BUILTUP, AREA_CARPET,
        { key: "x_workstations", label: "Workstations", kind: "number" },
        { key: "x_cabins", label: "Cabins", kind: "number" },
        { key: "x_meeting_rooms", label: "Meeting Rooms", kind: "number" },
        { key: "x_washrooms", label: "Washrooms", kind: "number" },
        { key: "parking", label: "Parking", kind: "number" },
        { key: "x_pantry", label: "Pantry", kind: "chips", options: YES_NO },
        { key: "x_conference", label: "Conference Room", kind: "chips", options: YES_NO },
        { key: "x_reception", label: "Reception", kind: "chips", options: YES_NO },
        { key: "x_power_backup", label: "Power Backup", kind: "chips", options: YES_NO },
        { key: "x_ac", label: "Air Conditioning", kind: "chips", options: YES_NO },
        { key: "age", label: "Property Age", kind: "chips", options: AGE_COMMERCIAL, wide: true },
      ];
    case "shop":
      return [
        AREA_CARPET, AREA_BUILTUP,
        { key: "x_floor_position", label: "Located on", kind: "chips", options: [
          { value: "ground", label: "Ground Floor" }, { value: "other", label: "Other Floor" },
        ] },
        { key: "x_frontage", label: "Frontage", kind: "number", suffix: "ft" },
        { key: "x_ceiling", label: "Ceiling Height", kind: "number", suffix: "ft" },
        { key: "parking", label: "Parking", kind: "number" },
        { key: "x_washroom", label: "Washroom", kind: "chips", options: YES_NO },
        { key: "x_power_backup", label: "Power Backup", kind: "chips", options: YES_NO },
        { key: "x_main_road", label: "Main Road Facing", kind: "chips", options: YES_NO },
        { key: "x_suitable_for", label: "Suitable For", kind: "text", placeholder: "e.g. Showroom, Clinic, Café", wide: true },
        { key: "age", label: "Property Age", kind: "chips", options: AGE_COMMERCIAL, wide: true },
      ];
    case "warehouse":
      return [
        AREA_BUILTUP, AREA_PLOT,
        { key: "x_ceiling", label: "Ceiling Height", kind: "number", suffix: "ft" },
        { key: "x_loading_area", label: "Loading Area", kind: "number", suffix: "sq.ft" },
        { key: "x_dock", label: "Dock", kind: "chips", options: YES_NO },
        { key: "x_truck_access", label: "Truck Access", kind: "chips", options: YES_NO },
        { key: "parking", label: "Parking", kind: "number" },
        { key: "x_power_load", label: "Power Load", kind: "text", suffix: "KVA" },
        { key: "x_fire_safety", label: "Fire Safety", kind: "chips", options: YES_NO },
        { key: "x_washroom", label: "Washroom", kind: "chips", options: YES_NO },
        { key: "x_office_space", label: "Office Space inside", kind: "chips", options: YES_NO },
        { key: "x_storage_type", label: "Storage Type", kind: "text", placeholder: "e.g. Cold storage" },
        { key: "age", label: "Property Age", kind: "chips", options: AGE_COMMERCIAL, wide: true },
      ];
    case "pg":
      return [
        { key: "x_pg_name", label: "PG / Hostel Name", kind: "text", wide: true },
        { key: "x_beds", label: "Number of Beds", kind: "number", required: true },
        { key: "x_bathroom_type", label: "Bathroom", kind: "chips", options: [
          { value: "attached", label: "Attached" }, { value: "common", label: "Common" },
        ] },
        { key: "x_food", label: "Food Included", kind: "chips", options: YES_NO },
        { key: "x_wifi", label: "WiFi", kind: "chips", options: YES_NO },
        { key: "x_housekeeping", label: "Housekeeping", kind: "chips", options: YES_NO },
        { key: "x_laundry", label: "Laundry", kind: "chips", options: YES_NO },
        { key: "x_electricity_included", label: "Electricity Included", kind: "chips", options: YES_NO },
        { key: "x_rules", label: "House Rules", kind: "textarea", wide: true, placeholder: "Entry timings, guests, smoking policy…" },
      ];
    default:
      return [AREA_BUILTUP, AREA_CARPET, { key: "parking", label: "Parking", kind: "number" }];
  }
}

/** Pricing fields depend on the listing purpose. */
function pricingFieldsBase(purpose: ListingPurpose): FieldSpec[] {
  if (purpose === "sale") {
    return [
      { key: "price", label: "Expected Price", kind: "money", required: true },
      { key: "negotiable", label: "Price Negotiable", kind: "toggle" },
      { key: "x_all_inclusive", label: "All Inclusive Price", kind: "toggle" },
    ];
  }
  if (purpose === "rent") {
    return [
      { key: "price", label: "Monthly Rent", kind: "money", required: true },
      { key: "security_deposit", label: "Security Deposit", kind: "money" },
      { key: "x_electricity", label: "Electricity Charges", kind: "select", options: [
        { value: "included", label: "Included" }, { value: "extra", label: "Extra as per usage" },
      ] },
      { key: "x_water", label: "Water Charges", kind: "select", options: [
        { value: "included", label: "Included" }, { value: "extra", label: "Extra" },
      ] },
      { key: "x_available_from", label: "Available From", kind: "date" },
      { key: "x_lease_duration", label: "Lease Duration", kind: "select", options: [
        { value: "11_months", label: "11 Months" }, { value: "1_year", label: "1 Year" },
        { value: "2_years", label: "2 Years" }, { value: "3_years_plus", label: "3+ Years" },
      ] },
      { key: "x_preferred_tenant", label: "Preferred Tenant", kind: "chips", wide: true, options: [
        { value: "family", label: "Family" }, { value: "bachelors", label: "Bachelors" },
        { value: "company", label: "Company" }, { value: "any", label: "Anyone" },
      ] },
      { key: "negotiable", label: "Rent Negotiable", kind: "toggle" },
    ];
  }
  return [
    { key: "price", label: "Monthly Rent (per bed)", kind: "money", required: true },
    { key: "security_deposit", label: "Security Deposit", kind: "money" },
    { key: "x_food_charges", label: "Food Charges (monthly)", kind: "money" },
    { key: "x_electricity_charges", label: "Electricity Charges", kind: "money" },
    { key: "x_other_charges", label: "Other Charges", kind: "money" },
    { key: "x_available_from", label: "Available From", kind: "date" },
    { key: "negotiable", label: "Rent Negotiable", kind: "toggle" },
  ];
}


/** Fields the user must answer: everything except free-form prose. */
function mandatory(fields: FieldSpec[]): FieldSpec[] {
  return fields.map((f) => (f.kind === "textarea" || f.kind === "toggle" ? f : { ...f, required: true }));
}

/** Features are always presented as dropdowns for faster, error-free input. */
export function featureFields(category: PropertyCategory): FieldSpec[] {
  return mandatory(
    featureFieldsBase(category).map((f) => (f.kind === "chips" ? { ...f, kind: "select" as const } : f)),
  );
}

export function detailFields(category: PropertyCategory): FieldSpec[] {
  return mandatory(detailFieldsBase(category));
}

export function pricingFields(purpose: ListingPurpose): FieldSpec[] {
  return pricingFieldsBase(purpose);
}

/** Columns that exist on the properties table — everything else is stored as prose. */
export const DB_FIELD_KEYS = new Set([
  "bedrooms", "bathrooms", "balconies", "parking", "floor_no", "total_floors",
  "facing", "furnishing", "age", "carpet_area", "builtup_area", "super_area",
  "price", "security_deposit", "negotiable",
]);

export const INTEGER_KEYS = new Set(["bedrooms", "bathrooms", "balconies", "parking", "floor_no", "total_floors"]);
export const NUMERIC_KEYS = new Set(["carpet_area", "builtup_area", "super_area", "price", "security_deposit"]);

/** Known societies / builder projects per city + locality. */
export const SOCIETIES: Record<string, Record<string, string[]>> = {
  Gurgaon: {
    "54": ["DLF Park Place", "The Belaire", "DLF The Crest", "Suncity Heights", "Pinnacle"],
    "42": ["Magnolias", "Aralias", "DLF Camellias"],
    "65": ["Emaar MGF Marbella", "M3M Merlin", "Ireo Victory Valley"],
    "66": ["Emaar Palm Hills", "Emaar Emerald Estate"],
    "82": ["Vatika India Next", "Mapsko Casa Bella"],
    "84": ["Vatika Seven Elements", "Godrej Summit"],
    "109": ["Chintels Serenity", "Mahira Homes"],
  },
  Sohna: {
    "": ["Central Park Flower Valley", "Signature Global Grand Iva", "GLS Arawali Homes"],
  },
  Manesar: {
    "": ["Vatika Sovereign Park", "Signature Global Solera", "Pyramid Urban Homes"],
  },
};

export function societiesFor(city: string, locality: string): string[] {
  const cityMap = SOCIETIES[city];
  if (!cityMap) return [];
  const key = locality.replace(/^sector\s*/i, "").trim();
  return [...(cityMap[key] ?? []), ...(cityMap[""] ?? [])];
}
