'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapContainer } from '@/components/MapContainer';
import { Sidebar } from '@/components/Sidebar';
import { DetailCard } from '@/components/DetailCard';
import { MockMap } from '@/components/MockMap';
import { mockDrivers } from '@/data/drivers';
import { Driver, MapStyle } from '@/types';
import { Key, AlertCircle, Play, Pause } from 'lucide-react';

export default function Home() {
  // Read API key from environment variable
  const envApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  // States
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // vehicle type filter
  
  // Animation/Simulation states
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const driversRef = useRef<Driver[]>([]);

  // Set state after mount to avoid hydration mismatch
  useEffect(() => {
    setApiKey(envApiKey === 'YOUR_GOOGLE_MAPS_API_KEY' ? '' : envApiKey);
    setDrivers(mockDrivers);
    driversRef.current = mockDrivers;
    setIsLoaded(true);
  }, [envApiKey]);

  // Real-time Movement Simulator
  // Simulates taxis driving along grid streets in Taipei
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const updatedDrivers = driversRef.current.map((driver) => {
        // 10% chance of changing direction (turning at an intersection)
        let heading = driver.heading;
        if (Math.random() < 0.1) {
          const turns = [-90, 0, 90, 180];
          const turn = turns[Math.floor(Math.random() * turns.length)];
          heading = (heading + turn + 360) % 360;
        }

        // Convert heading to radians for calculation
        // 0 degrees is East, 90 is North, 180 is West, 270 is South
        const rad = (heading * Math.PI) / 180;
        
        // Speed: approx 0.0001 degrees per step (about 10-15 meters)
        const speed = 0.00008 + Math.random() * 0.00004;
        let newLat = driver.lat + Math.sin(rad) * speed;
        let newLng = driver.lng + Math.cos(rad) * speed;

        // Taipei boundary constraints
        const minLat = 25.02;
        const maxLat = 25.07;
        const minLng = 121.51;
        const maxLng = 121.57;

        // Turn back if out of bounds
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

      // Update state and ref
      setDrivers(updatedDrivers);
      driversRef.current = updatedDrivers;

      // Update selected driver reference to keep values in sync
      if (selectedDriver) {
        const currentSelected = updatedDrivers.find(d => d.id === selectedDriver.id);
        if (currentSelected) {
          setSelectedDriver(currentSelected);
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating, selectedDriver]);

  // API Key management modal state
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');

  // Filter drivers based on search query and vehicle type category
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

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
      setShowKeyModal(false);
    }
  };

  const handleClearApiKey = () => {
    setApiKey('');
    setInputKey('');
  };

  const hasValidKey = apiKey.startsWith('AIzaSy');

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#07080d',
        color: '#f8fafc',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }} />
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>載入車隊系統中...</p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
        {/* API Key Config Badge */}
        <div className="glass">
          <button
            onClick={() => {
              setInputKey(apiKey);
              setShowKeyModal(true);
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
            <Key size={14} className={hasValidKey ? 'text-green' : 'text-gold'} />
            <span>
              {hasValidKey ? 'Google Maps: 已連線' : 'Google Maps: 模擬模式 (設定金鑰)'}
            </span>
          </button>
        </div>

        {/* Simulation Control Badge */}
        <div className="glass">
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
                <Pause size={14} className="text-cyan animate-pulse" />
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

      {/* API Key Settings Overlay Modal */}
      {showKeyModal && (
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
          onClick={() => setShowKeyModal(false)}
        >
          <div 
            className="glass animate-fade-in"
            style={{
              width: '90%',
              maxWidth: 480,
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
              <Key size={24} className="text-cyan" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>金鑰設定</h2>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              本應用程式已整合 Firebase App Hosting。若您想在本地測試實際的 Google Maps API 渲染，請在下方輸入金鑰。
            </p>

            <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  GOOGLE MAPS API KEY
                </label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {!inputKey.startsWith('AIzaSy') && inputKey.trim() !== '' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', fontSize: '0.75rem' }}>
                  <AlertCircle size={14} />
                  <span>這似乎不是一個有效的 Google Maps API 金鑰格式（通常以 AIzaSy 開頭）。</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  className="action-btn primary"
                  style={{ flex: 1, border: 'none' }}
                >
                  套用金鑰
                </button>
                {apiKey && (
                  <button
                    type="button"
                    className="action-btn secondary"
                    onClick={handleClearApiKey}
                    style={{ flex: 1 }}
                  >
                    清除並使用模擬
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
