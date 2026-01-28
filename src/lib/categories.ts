// Shared categories for events and venues
export const CATEGORIES = [
  "bars",
  "clubs",
  "comedy",
  "concerts",
  "lgbt",
  "social",
  "theater",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Display labels for categories
export const CATEGORY_LABELS: Record<Category, string> = {
  bars: "Bars",
  clubs: "Clubs",
  comedy: "Comedy",
  concerts: "Concerts",
  lgbt: "LGBT",
  social: "Social",
  theater: "Theater",
};

// Helper to validate categories
export function isValidCategory(value: string): value is Category {
  return CATEGORIES.includes(value as Category);
}

// Helper to filter valid categories from an array
export function filterValidCategories(values: string[]): Category[] {
  return values.filter(isValidCategory);
}
