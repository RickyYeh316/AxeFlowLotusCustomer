'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapContainer } from '@/components/MapContainer';
import { Sidebar } from '@/components/Sidebar';
import { DetailCard } from '@/components/DetailCard';
import { MockMap } from '@/components/MockMap';
import { mockDrivers } from '@/data/drivers';
import { Driver, MapStyle, DriverStatus, VehicleType } from '@/types';
import { db, hasFirebaseConfig, firebaseConfig as defaultEnvConfig } from '@/firebase/config';
import { Key, AlertCircle, Play, Pause, Database, Check, UploadCloud } from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

export default function Home() {
  // Read keys from environment
  const envApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  // States
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // vehicleType filter
  
  // Firebase Live Stream States
  const [isLiveFirestore, setIsLiveFirestore] = useState<boolean>(false);
  const [firebaseProjectName, setFirebaseProjectName] = useState<string>('');
  
  // Animation/Simulation states
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const driversRef = useRef<Driver[]>([]);

  // Settings Modal State
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [inputApiKey, setInputApiKey] = useState<string>('');
  const [inputFirebaseConfig, setInputFirebaseConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  // Load config on mount
  useEffect(() => {
    setApiKey(envApiKey === 'YOUR_GOOGLE_MAPS_API_KEY' ? '' : envApiKey);
    
    // Check if we have Firebase environment config
    if (hasFirebaseConfig) {
      setInputFirebaseConfig(defaultEnvConfig);
    }
    
    setDrivers(mockDrivers);
    driversRef.current = mockDrivers;
    setIsLoaded(true);
  }, [envApiKey]);

  // Vehicle Type Mapping Helper based on Model Name
  const mapVehicleType = (maker: string, model: string): VehicleType => {
    const combinedStr = `${maker} ${model}`.toLowerCase();
    if (
      combinedStr.includes('tesla') || 
      combinedStr.includes('benz') || 
      combinedStr.includes('mercedes') || 
      combinedStr.includes('bmw') || 
      combinedStr.includes('lexus') || 
      combinedStr.includes('audi') || 
      combinedStr.includes('luxury') || 
      combinedStr.includes('尊榮')
    ) {
      return 'luxury';
    }
    if (
      combinedStr.includes('suv') || 
      combinedStr.includes('rav4') || 
      combinedStr.includes('crv') || 
      combinedStr.includes('kuga') || 
      combinedStr.includes('sienta') ||
      combinedStr.includes('休旅')
    ) {
      return 'suv';
    }
    return 'standard';
  };

  // Firestore Collection Subscription
  useEffect(() => {
    let activeDb = db;
    let configName = defaultEnvConfig.projectId;

    const dynamicApps = getApps();
    const dynamicApp = dynamicApps.find(app => app.name === 'dynamic-taxi-app');
    
    if (dynamicApp) {
      try {
        activeDb = getFirestore(dynamicApp);
        configName = (dynamicApp.options as any).projectId;
      } catch (e) {
        console.error("Failed to load dynamic firestore:", e);
      }
    }

    if (!activeDb) {
      setIsLiveFirestore(false);
      return;
    }

    // Disable local simulator since we are connecting to live Firestore!
    setIsSimulating(false);
    setIsLiveFirestore(true);
    setFirebaseProjectName(configName);

    // Subscribe to "drivers" collection
    const unsubscribe = onSnapshot(collection(activeDb, "drivers"), (snapshot) => {
      const liveDriversList: Driver[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Only display drivers that have active locations
        if (data.currentLocation && typeof data.currentLocation.lat === 'number') {
          let status: DriverStatus = 'offline';
          if (data.status === 1 || data.working === true) {
            status = 'online';
          } else if (data.status === 2 || data.isWorking === true) {
            status = 'busy';
          }
          
          const mappedDriver: Driver = {
            id: doc.id,
            name: data.name || doc.id.split('@')[0], 
            lat: data.currentLocation.lat,
            lng: data.currentLocation.lng,
            heading: data.currentLocation.bearing || 0,
            plateNumber: data.carPlate || "未填寫車牌",
            status,
            vehicleType: mapVehicleType(data.carMaker || '', data.carModel || ''),
            phone: data.phone || "無電話",
            rating: data.rating || 4.9,
            reviewsCount: data.reviewsCount || Math.floor(Math.random() * 500) + 120,
            avatarUrl: data.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            description: data.carColor 
              ? `${data.carColor}色 ${data.carMaker || ''} ${data.carModel || ''}。車內舒適整潔，聯絡正常。`
              : "專業優質司機，定位服務正常連線中。"
          };

          liveDriversList.push(mappedDriver);
        }
      });

      setDrivers(liveDriversList);
      driversRef.current = liveDriversList;
    }, (error) => {
      console.error("Firestore subscription error:", error);
      setIsLiveFirestore(false);
      setIsSimulating(true); 
    });

    return () => unsubscribe();
  }, [inputFirebaseConfig.projectId]);

  // Real-time Local Movement Simulator (Used when Firestore is not active)
  useEffect(() => {
    if (!isSimulating || isLiveFirestore) return;

    const interval = setInterval(() => {
      const updatedDrivers = driversRef.current.map((driver) => {
        let heading = driver.heading;
        if (Math.random() < 0.1) {
          const turns = [-90, 0, 90, 180];
          const turn = turns[Math.floor(Math.random() * turns.length)];
          heading = (heading + turn + 360) % 360;
        }

        const rad = (heading * Math.PI) / 180;
        const speed = 0.00008 + Math.random() * 0.00004;
        let newLat = driver.lat + Math.sin(rad) * speed;
        let newLng = driver.lng + Math.cos(rad) * speed;

        const minLat = 25.02;
        const maxLat = 25.07;
        const minLng = 121.51;
        const maxLng = 121.57;

        if (newLat < minLat || newLat > maxLat || newLng < minLng || newLng > maxLng) {
          heading = (heading + 180) % 360;
          newLat = Math.max(minLat, Math.min(maxLat, driver.lat));
          newLng = Math.max(minLng, Math.min(maxLng, driver.lng));
        }

        return {
          ...driver,
          lat: newLat,
          lng: newLng,
          heading
        };
      });

      setDrivers(updatedDrivers);
      driversRef.current = updatedDrivers;

      if (selectedDriver) {
        const currentSelected = updatedDrivers.find(d => d.id === selectedDriver.id);
        if (currentSelected) {
          setSelectedDriver(currentSelected);
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating, isLiveFirestore, selectedDriver]);

  // Seeding Mock Data to Firestore (One-click Helper)
  const handleSeedDrivers = async () => {
    let activeDb = db;
    const dynamicApps = getApps();
    const dynamicApp = dynamicApps.find(app => app.name === 'dynamic-taxi-app');
    if (dynamicApp) {
      activeDb = getFirestore(dynamicApp);
    }

    if (!activeDb) {
      alert("請先設定並套用有效的 Firebase 憑證後再執行寫入！");
      return;
    }

    try {
      const seedData = [
        {
          email: "lin.driver@gmail.com",
          name: "林信宏",
          phone: "0912-345-678",
          carPlate: "TDY-5866",
          carColor: "黃",
          carMaker: "Toyota",
          carModel: "Sienta",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          status: 1,
          working: true,
          isWorking: false,
          loginCount: 15,
          currentLocation: {
            lat: 25.0412,
            lng: 121.5645,
            bearing: 90,
            speed: 15,
            gpsSeq: 20001,
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: "chen.driver@gmail.com",
          name: "陳建志",
          phone: "0928-888-777",
          carPlate: "TAX-9981",
          carColor: "銀",
          carMaker: "Toyota",
          carModel: "RAV4",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          status: 1,
          working: true,
          isWorking: false,
          loginCount: 34,
          currentLocation: {
            lat: 25.0336,
            lng: 121.5432,
            bearing: 180,
            speed: 10,
            gpsSeq: 20002,
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: "chang.driver@gmail.com",
          name: "張家豪",
          phone: "0975-123-456",
          carPlate: "VIP-0888",
          carColor: "黑",
          carMaker: "Tesla",
          carModel: "Model Y",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
          status: 1,
          working: true,
          isWorking: false,
          loginCount: 52,
          currentLocation: {
            lat: 25.0482,
            lng: 121.5170,
            bearing: 270,
            speed: 0,
            gpsSeq: 20003,
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: "lee.driver@gmail.com",
          name: "李淑芬",
          phone: "0933-456-789",
          carPlate: "TDA-3321",
          carColor: "白",
          carMaker: "Toyota",
          carModel: "Altis",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
          status: 1,
          working: true,
          isWorking: false,
          loginCount: 28,
          currentLocation: {
            lat: 25.0592,
            lng: 121.5345,
            bearing: 120,
            speed: 18,
            gpsSeq: 20004,
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const item of seedData) {
        await setDoc(doc(activeDb, "drivers", item.email), item);
      }
      alert("成功寫入 4 筆計程車司機模擬資料至您 Firestore 中的 drivers 集合！");
    } catch (error: any) {
      console.error("Firestore seeding failed:", error);
      alert("寫入失敗：" + error.message + "\\n請檢查您的 Firestore 安全規則 (Security Rules) 是否已開放寫入。");
    }
  };

  // Filter drivers based on search query and category
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch = 
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        driver.vehicleType === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [drivers, searchQuery, selectedCategory]);

  const handleSelectDriver = (driver: Driver | null) => {
    setSelectedDriver(driver);
  };

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save Google Maps Key
    if (inputApiKey.trim()) {
      setApiKey(inputApiKey.trim());
    }

    // Save Firebase Configurations dynamically
    if (inputFirebaseConfig.projectId.trim() && inputFirebaseConfig.apiKey.trim()) {
      try {
        const apps = getApps();
        const existingApp = apps.find(app => app.name === 'dynamic-taxi-app');
        
        if (!existingApp) {
          initializeApp(inputFirebaseConfig, 'dynamic-taxi-app');
        }
      } catch (err) {
        console.error("Dynamic Firebase initialization error:", err);
      }
    }

    setShowConfigModal(false);
  };

  const handleResetConfigs = () => {
    setApiKey('');
    setInputApiKey('');
    setInputFirebaseConfig({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    });
    setIsLiveFirestore(false);
    setIsSimulating(true);
    setDrivers(mockDrivers);
    driversRef.current = mockDrivers;
  };

  const hasValidKey = apiKey.startsWith('AIzaSy');

  return (
    <div className="app-container">
      {/* Top Floating Control Row */}
      <div 
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          pointerEvents: 'auto',
          display: 'flex',
          gap: 12
        }}
      >
        {/* Status Settings Trigger Badge */}
        <div className="glass">
          <button
            onClick={() => {
              setInputApiKey(apiKey);
              setShowConfigModal(true);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 16px',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Database size={14} className={isLiveFirestore ? 'text-green' : 'text-gold'} />
            <span>
              {isLiveFirestore 
                ? `Firestore: ${firebaseProjectName} (已連線)` 
                : 'Firestore: 模擬移動模式 (按此設定串接)'}
            </span>
          </button>
        </div>

        {/* Local Simulator controls */}
        {!isLiveFirestore && (
          <div className="glass animate-fade-in">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px 16px',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              title={isSimulating ? "暫停車輛移動" : "開始車輛移動"}
            >
              {isSimulating ? (
                <>
                  <Pause size={14} className="text-cyan" />
                  <span>模擬移動中</span>
                </>
              ) : (
                <>
                  <Play size={14} className="text-muted" />
                  <span>移動已暫停</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Map Area - Conditional Rendering */}
      {hasValidKey ? (
        <APIProvider key={apiKey} apiKey={apiKey}>
          <MapContainer
            locations={filteredDrivers}
            selectedLocation={selectedDriver}
            onSelectLocation={handleSelectDriver}
            mapStyle={mapStyle}
            showTraffic={showTraffic}
          />
        </APIProvider>
      ) : (
        <MockMap
          locations={filteredDrivers}
          selectedLocation={selectedDriver}
          onSelectLocation={handleSelectDriver}
          mapStyle={mapStyle}
        />
      )}

      {/* Floating Layout Overlays */}
      <div className="overlay-layout">
        {/* Sidebar Panel */}
        <Sidebar
          locations={filteredDrivers}
          selectedLocation={selectedDriver}
          onSelectLocation={handleSelectDriver}
          mapStyle={mapStyle}
          onChangeMapStyle={setMapStyle}
          showTraffic={showTraffic}
          onToggleTraffic={() => setShowTraffic(!showTraffic)}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          onChangeCategory={setSelectedCategory}
        />

        {/* Selected Driver Details Panel */}
        <DetailCard
          location={selectedDriver}
          onClose={() => handleSelectDriver(null)}
        />
      </div>

      {/* API Key & Firebase Config Settings Overlay Modal */}
      {showConfigModal && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(5, 6, 10, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto'
          }}
          onClick={() => setShowConfigModal(false)}
        >
          <div 
            className="glass animate-fade-in"
            style={{
              width: '90%',
              maxWidth: 520,
              maxHeight: '90%',
              overflowY: 'auto',
              padding: 32,
              background: '#0c0d16',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Database size={24} className="text-cyan" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>系統與金鑰設定</h2>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              在此設定您的 Google Maps 與 Firebase 憑證。當填入有效的 Firebase 設定時，系統會自動斷開模擬器，並透過 WebSocket 即時串接您 Firestore 的車輛位置！
            </p>

            <form onSubmit={handleSaveConfigs} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Section 1: Google Maps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                  1. Google Maps 設定
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    GOOGLE MAPS API KEY
                  </label>
                  <input
                    type="text"
                    placeholder="AIzaSy..."
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'white',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Section 2: Firebase Firestore */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                  2. Firebase Firestore 設定
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      PROJECT ID (專案 ID)
                    </label>
                    <input
                      type="text"
                      placeholder="my-firebase-project"
                      value={inputFirebaseConfig.projectId}
                      onChange={(e) => setInputFirebaseConfig({...inputFirebaseConfig, projectId: e.target.value})}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'white',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      API KEY
                    </label>
                    <input
                      type="text"
                      placeholder="AIzaSy..."
                      value={inputFirebaseConfig.apiKey}
                      onChange={(e) => setInputFirebaseConfig({...inputFirebaseConfig, apiKey: e.target.value})}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'white',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      AUTH DOMAIN
                    </label>
                    <input
                      type="text"
                      placeholder="project-id.firebaseapp.com"
                      value={inputFirebaseConfig.authDomain}
                      onChange={(e) => setInputFirebaseConfig({...inputFirebaseConfig, authDomain: e.target.value})}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'white',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      APP ID
                    </label>
                    <input
                      type="text"
                      placeholder="1:1234:web:abcd"
                      value={inputFirebaseConfig.appId}
                      onChange={(e) => setInputFirebaseConfig({...inputFirebaseConfig, appId: e.target.value})}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'white',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Seeding Helper Button */}
              {isLiveFirestore && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    快速測試資料庫寫入 (Database Seeding)
                  </label>
                  <button
                    type="button"
                    onClick={handleSeedDrivers}
                    className="action-btn secondary"
                    style={{ 
                      width: '100%', 
                      border: '1px solid #10b981', 
                      color: '#34d399', 
                      background: 'rgba(16, 185, 129, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <UploadCloud size={16} />
                    <span>寫入 4 筆計程車司機模擬資料至您的 Firestore</span>
                  </button>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  className="action-btn primary"
                  style={{ flex: 1, border: 'none' }}
                >
                  <Check size={16} />
                  <span>套用設定</span>
                </button>
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={handleResetConfigs}
                  style={{ flex: 1 }}
                >
                  清除並恢復預設
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
