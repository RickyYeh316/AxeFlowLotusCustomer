import { Location } from '../types';

export const mockLocations: Location[] = [
  {
    id: 'loc-1',
    name: 'Lotus 信義旗艦展示中心',
    lat: 25.0336,
    lng: 121.5648,
    address: '台北市信義區信義路五段 7 號 (台北 101 大樓 1 樓)',
    category: 'showroom',
    phone: '02-8101-8888',
    rating: 4.9,
    reviewsCount: 342,
    hours: '11:00 - 21:30',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
    description: '引領奢華科技美學的旗艦展示中心。現場展示 Lotus 全系列極致工藝之作，並提供專屬 VIP 一對一導覽服務與尊榮客戶體驗。'
  },
  {
    id: 'loc-2',
    name: 'Lotus Cafe 信義概念店',
    lat: 25.0375,
    lng: 121.5670,
    address: '台北市信義區松壽路 12 號 (ATT 4 FUN 旁)',
    category: 'cafe',
    phone: '02-2722-1234',
    rating: 4.7,
    reviewsCount: 189,
    hours: '08:00 - 22:00',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80',
    description: '結合北歐極簡與現代科技感的複合式咖啡空間。提供產地精選單品手沖咖啡、特製輕食，是您洽商、休閒與感受生活美學的完美交匯點。'
  },
  {
    id: 'loc-3',
    name: 'Lotus 大安研發與創客中心',
    lat: 25.0268,
    lng: 121.5432,
    address: '台北市大安區忠孝東路三段 1 號',
    category: 'office',
    phone: '02-2771-2171',
    rating: 4.8,
    reviewsCount: 76,
    hours: '09:00 - 18:00',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
    description: 'Lotus 技術創新的核心引擎，匯聚優秀的軟硬體開發人才與設計思維。不定期舉辦科技論壇與開發者沙龍聚會。'
  },
  {
    id: 'loc-4',
    name: 'Lotus 中山極速售後服務中心',
    lat: 25.0612,
    lng: 121.5245,
    address: '台北市中山區民權東路二段 46 號',
    category: 'service',
    phone: '02-2599-4321',
    rating: 4.6,
    reviewsCount: 124,
    hours: '09:00 - 20:00 (週日公休)',
    imageUrl: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=600&auto=format&fit=crop&q=80',
    description: '專業、高效且透明的售後技術支援中心。配備 Google Maps 雲端排程系統與認證工程師，為您的設備與行車安全保駕護航。'
  },
  {
    id: 'loc-5',
    name: 'Lotus Cafe 華山藝術門市',
    lat: 25.0441,
    lng: 121.5294,
    address: '台北市中正區八德路一段 1 號 (華山 1914 文創園區 中 4A 館)',
    category: 'cafe',
    phone: '02-2395-5555',
    rating: 4.8,
    reviewsCount: 295,
    hours: '10:00 - 21:00',
    imageUrl: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&auto=format&fit=crop&q=80',
    description: '進駐華山文創園區，將工業遺產與數位藝術完美揉合。門市設有大型數位投影牆，邊享用限定版拿鐵邊體驗沈浸式地圖光影秀。'
  }
];
