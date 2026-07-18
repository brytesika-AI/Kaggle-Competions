export interface UserProfile {
  name: string;
  role: 'farmer' | 'trader' | 'miller' | 'researcher' | 'officer';
  organization: string;
}

export interface RiceScan {
  id: string;
  timestamp: string;
  sampleName: string;
  grade: 'A' | 'B' | 'C';
  status: 'Premium' | 'Standard' | 'Rejected';
  grainCount: number;
  brokenCount: number;
  brokenPercentage: number;
  chalkyCount: number;
  chalkyPercentage: number;
  avgLength: number; // in mm
  avgWidth: number; // in mm
  avgAspectRatio: number;
  imageUrl?: string;
  presetKey?: 'high' | 'medium' | 'low';
}
