'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapContainer } from '@/components/MapContainer';
import { Sidebar } from '@/components/Sidebar';
import { DetailCard } from '@/components/DetailCard';
import { MockMap } from '@/components/MockMap';
import { mockLocations } from '@/data/locations';
import { Location, MapStyle } from '@/types';
import { Key, AlertCircle } from 'lucide-react';

export default function Home() {
  // Read API key from environment variable
  const envApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  // States
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Set state after mount to avoid hydration mismatch
  useEffect(() => {
    setApiKey(envApiKey === 'YOUR_GOOGLE_MAPS_API_KEY' ? '' : envApiKey);
    setIsLoaded(true);
  }, [envApiKey]);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // API Key management modal state
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');

  // Filter locations based on search query and category
  const filteredLocations = useMemo(() => {
    return mockLocations.filter((loc) => {
      const matchesSearch = 
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        loc.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleSelectLocation = (loc: Location | null) => {
    setSelectedLocation(loc);
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
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>載入系統中...</p>
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
      {/* Dynamic API Key Badge Indicator */}
      <div 
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          pointerEvents: 'auto'
        }}
        className="glass animate-fade-in"
      >
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
            {hasValidKey ? 'Google Maps API: 已連線' : 'Google Maps API: 模擬模式 (按此點選設定)'}
          </span>
        </button>
      </div>

      {/* Main Map Area - Conditional Rendering */}
      {hasValidKey ? (
        // API Provider key prop forces re-instantiation if key updates on the fly
        <APIProvider key={apiKey} apiKey={apiKey}>
          <MapContainer
            locations={filteredLocations}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
            mapStyle={mapStyle}
            showTraffic={showTraffic}
          />
        </APIProvider>
      ) : (
        <MockMap
          locations={filteredLocations}
          selectedLocation={selectedLocation}
          onSelectLocation={handleSelectLocation}
          mapStyle={mapStyle}
        />
      )}

      {/* Floating Layout Overlays */}
      <div className="overlay-layout">
        {/* Sidebar Panel */}
        <Sidebar
          locations={filteredLocations}
          selectedLocation={selectedLocation}
          onSelectLocation={handleSelectLocation}
          mapStyle={mapStyle}
          onChangeMapStyle={setMapStyle}
          showTraffic={showTraffic}
          onToggleTraffic={() => setShowTraffic(!showTraffic)}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          onChangeCategory={setSelectedCategory}
        />

        {/* Selected Location Details Panel */}
        <DetailCard
          location={selectedLocation}
          onClose={() => handleSelectLocation(null)}
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
              本應用程式將在 Firebase App Hosting 託管。若您想要在此測試實際的 Google Maps API 渲染，請在下方輸入您的金鑰。
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
