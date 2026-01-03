
export interface IconResult {
  domain: string;
  iconUrl: string;
  timestamp: number;
}

export interface SearchHistoryItem {
  domain: string;
  iconUrl: string;
  timestamp: number;
}

// Fixed missing interface definition
export interface BrandAnalysis {
  colors: string[];
  style: string;
  brandIdentity: string;
  suggestedImprovements: string;
}
