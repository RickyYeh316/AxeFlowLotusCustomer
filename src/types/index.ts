export type VehicleType = 'standard' | 'suv' | 'luxury';
export type DriverStatus = 'online' | 'busy' | 'offline';

export interface Driver {
  id: string;
  name: string;
  lat: number;
  lng: number;
  plateNumber: string;
  status: DriverStatus;
  vehicleType: VehicleType;
  phone: string;
  rating: number;
  reviewsCount: number;
  avatarUrl: string;
  description: string;
  heading: number; // heading in degrees (0-360)
}

export type MapStyle = 'standard' | 'dark' | 'retro' | 'cool-blue';
