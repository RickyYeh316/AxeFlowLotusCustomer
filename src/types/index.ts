export type VehicleType = 'standard' | 'suv' | 'luxury';

export enum DriverTripStatus {
  OFFLINE = "OFFLINE", // 未上線/未報班
  IDLE = "IDLE", // 上線空車中
  IN_QUEUE = "IN_QUEUE", // 排班熱區等待中
  DISPATCHED = "DISPATCHED", // 收到派單/媒合中
  EN_ROUTE = "EN_ROUTE", // 確認接單前往中
  ARRIVED = "ARRIVED", // 抵達上車點
  IN_SERVICE = "IN_SERVICE", // 載客中
}

export enum UserTripStatus {
  IDLE = "IDLE", // 正常狀態可叫車
  REQUESTING = "REQUESTING", // 叫車媒合中
  IN_TRIP = "IN_TRIP", // 行程進行中
}

export enum DriverAccountStatus {
  PENDING = "PENDING",     // 新司機，等待開通
  ACTIVE = "ACTIVE",       // 帳號正常開通
  SUSPENDED = "SUSPENDED", // 帳號停權
}

export enum UserAccountStatus {
  ACTIVE = "ACTIVE", // 帳號正常開通
  BANNED = "BANNED", // 帳號停權
}

export interface Driver {
  id: string;
  name: string;
  lat: number;
  lng: number;
  plateNumber: string;
  tripStatus: DriverTripStatus;
  accountStatus: DriverAccountStatus;
  vehicleType: VehicleType;
  phone: string;
  rating: number;
  reviewsCount: number;
  avatarUrl: string;
  description: string;
  heading: number; // heading in degrees (0-360)
}

export type MapStyle = 'standard' | 'dark' | 'retro' | 'cool-blue';
