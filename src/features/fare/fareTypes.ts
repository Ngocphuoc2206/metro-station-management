export interface Zone {
  id: string;
  name: string; // e.g., "Zone 1"
  order: number;
}

export interface FareRule {
  id: string;
  fromZoneId: string;
  toZoneId: string;
  price: number; // in VND
}

export interface FareMatrixData {
  zones: Zone[];
  rules: FareRule[];
  lastUpdated: string;
}
