export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  category: 'cafe' | 'office' | 'showroom' | 'service';
  phone: string;
  rating: number;
  reviewsCount: number;
  hours: string;
  imageUrl: string;
  description: string;
}

export type MapStyle = 'standard' | 'dark' | 'retro' | 'cool-blue';
