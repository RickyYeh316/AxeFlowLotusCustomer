import { Driver } from '../types';

export const mockDrivers: Driver[] = [
  {
    id: 'drv-1',
    name: '林信宏',
    lat: 25.0412,
    lng: 121.5645,
    plateNumber: 'TDY-5866',
    status: 'online',
    vehicleType: 'standard',
    phone: '0912-345-678',
    rating: 4.8,
    reviewsCount: 1240,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    description: '林師傅擁有超過 10 年的台北市區駕駛經驗，精通英語與日語，車內備有酒精消毒與瓶裝水，服務親切有禮。',
    heading: 90
  },
  {
    id: 'drv-2',
    name: '陳建志',
    lat: 25.0336,
    lng: 121.5432,
    plateNumber: 'TAX-9981',
    status: 'online',
    vehicleType: 'suv',
    phone: '0928-888-777',
    rating: 4.9,
    reviewsCount: 852,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    description: '駕駛寬敞的 SUV 車款，非常適合攜帶大件行李或全家出遊的乘客。車內提供手機充電線，行車安全平穩。',
    heading: 180
  },
  {
    id: 'drv-3',
    name: '張家豪',
    lat: 25.0482,
    lng: 121.5170,
    plateNumber: 'VIP-0888',
    status: 'online',
    vehicleType: 'luxury',
    phone: '0975-123-456',
    rating: 5.0,
    reviewsCount: 520,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    description: '專屬豪華商務尊榮服務，車款為黑牌豪華車款。司機身穿正裝，提供開門與提拿行李服務，是商務洽公的首選。',
    heading: 270
  },
  {
    id: 'drv-4',
    name: '李淑芬',
    lat: 25.0592,
    lng: 121.5345,
    plateNumber: 'TDA-3321',
    status: 'online',
    vehicleType: 'standard',
    phone: '0933-456-789',
    rating: 4.7,
    reviewsCount: 1402,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    description: '女性優質司機，車內布置乾淨溫馨，行車非常細心。常獲得女性乘客與學生乘客的高度讚賞與推薦。',
    heading: 120
  },
  {
    id: 'drv-5',
    name: '王志強',
    lat: 25.0256,
    lng: 121.5528,
    plateNumber: 'TDB-7762',
    status: 'online',
    vehicleType: 'suv',
    phone: '0911-222-333',
    rating: 4.6,
    reviewsCount: 934,
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    description: '大空間 SUV 司機，開朗健談，熱愛分享台北美食與私房景點，車上配有免費 Wi-Fi 供乘客使用。',
    heading: 45
  }
];
