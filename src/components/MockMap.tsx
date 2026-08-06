'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Driver, MapStyle } from '../types';
import { ZoomIn, ZoomOut, Compass, Info, MapPin } from 'lucide-react';

interface MockMapProps {
  locations: Driver[]; // Driver list (passed as locations for naming compatibility)
  selectedLocation: Driver | null;
  onSelectLocation: (location: Driver | null) => void;
  mapStyle: MapStyle;
  
  // Selection mode props to match MapContainer
  mapSelectingMode: 'idle' | 'start' | 'end';
  onResolveAddress: (address: string, lat: number, lng: number) => void;
  onCancelSelection: () => void;
}

export const MockMap: React.FC<MockMapProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  mapStyle,
  mapSelectingMode,
  onResolveAddress,
  onCancelSelection,
}) => {
  // SVG Canvas view state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: -150, y: -200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const mapRef = useRef<HTMLDivElement>(null);

  // Taipei approx bounding box: Lat 25.02 to 25.07, Lng 121.51 to 121.57
  const minLat = 25.02;
  const maxLat = 25.07;
  const minLng = 121.51;
  const maxLng = 121.57;

  // Local Selection States
  const [resolvedAddress, setResolvedAddress] = useState<string>('正在解析地址...');
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number } | null>(null);

  const projectCoord = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 1000;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 1000;
    return { x, y };
  };

  // Reverse project to calculate center lat/lng of viewport
  const getMapCenterLatLng = () => {
    if (!mapRef.current) return { lat: 25.045, lng: 121.545 };
    const rect = mapRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Projected coordinates on 1000x1000 canvas
    const x = (centerX - pan.x) / zoom;
    const y = (centerY - pan.y) / zoom;
    
    // Reverse math formulas
    const lng = minLng + (x / 1000) * (maxLng - minLng);
    const lat = minLat + (1 - y / 1000) * (maxLat - minLat);
    
    return { lat, lng };
  };

  // Mock Reverse Geocode based on coordinates
  const resolveMockAddress = (lat: number, lng: number) => {
    // 1. Matched zones
    if (lat > 25.05 && lng > 121.55) {
      return { address: "台北松山機場 (敦化北路340-9號)", lat: 25.063, lng: 121.552 };
    }
    if (lat < 25.04 && lng < 121.53) {
      return { address: "龍山寺捷運站 (廣州街211號)", lat: 25.035, lng: 121.503 };
    }
    if (lat > 25.05 && lng < 121.53) {
      return { address: "行天宮 (民權東路二段109號)", lat: 25.059, lng: 121.533 };
    }
    if (lat < 25.04 && lng > 121.55) {
      return { address: "台北101/世貿捷運站 (信義路五段7號)", lat: 25.033, lng: 121.564 };
    }
    if (lat < 25.04 && lng >= 121.53 && lng <= 121.55) {
      return { address: "大安森林公園捷運站 (新生南路二段1號)", lat: 25.032, lng: 121.535 };
    }
    // Default fallback
    return { address: "台北車站東一門 (北平西路3號)", lat: 25.047, lng: 121.517 };
  };

  // Trigger geocode resolution on dragging or pan changes
  useEffect(() => {
    if (mapSelectingMode === 'idle') return;
    
    const center = getMapCenterLatLng();
    const resolved = resolveMockAddress(center.lat, center.lng);
    setResolvedAddress(resolved.address);
    setCurrentCenter({ lat: center.lat, lng: center.lng });
  }, [pan, zoom, mapSelectingMode]);

  // Center on selected location when it changes
  useEffect(() => {
    if (selectedLocation) {
      const { x, y } = projectCoord(selectedLocation.lat, selectedLocation.lng);
      
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        setPan({
          x: centerX - (x * zoom),
          y: centerY - (y * zoom),
        });
        setZoom(1.3);
      }
    }
  }, [selectedLocation]);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (factor: number) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev * factor)));
  };

  const handleConfirm = () => {
    if (currentCenter) {
      onResolveAddress(resolvedAddress, currentCenter.lat, currentCenter.lng);
    }
  };

  // Styling properties based on active mapStyle
  const themes = {
    dark: {
      bg: '#0c0d14',
      grid: '#181b28',
      river: '#0f2742',
      riverGlow: '#00ccff',
      roads: '#22273d',
      label: '#4f5b84',
    },
    'cool-blue': {
      bg: '#050c1e',
      grid: '#0d1d3d',
      river: '#061730',
      riverGlow: '#00ddff',
      roads: '#142a54',
      label: '#5c78ad',
    },
    retro: {
      bg: '#fcf8ee',
      grid: '#ede4ce',
      river: '#c2e0f4',
      riverGlow: '#85c1e9',
      roads: '#fff',
      label: '#8d8268',
    },
    standard: {
      bg: '#f1f3f4',
      grid: '#e0e0e0',
      river: '#c4e3f3',
      riverGlow: '#90caf9',
      roads: '#ffffff',
      label: '#70757a',
    }
  };

  const theme = themes[mapStyle] || themes.dark;

  const getDriverColor = (driver: Driver, isSelected: boolean) => {
    if (isSelected) return '#ff2a5f'; // Active Red
    if (driver.status === 'busy') return '#6b7280'; // Gray for busy
    
    if (driver.vehicleType === 'luxury') return '#111827';
    if (driver.vehicleType === 'suv') return '#0284c7';
    return '#f59e0b'; // Gold for standard
  };

  return (
    <div 
      className="map-viewport" 
      ref={mapRef}
      style={{ 
        backgroundColor: theme.bg, 
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        overflow: 'hidden',
        position: 'absolute'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Floating Demo Mode Banner */}
      {mapSelectingMode === 'idle' && (
        <div 
          className="glass animate-fade-in"
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            padding: '12px 18px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            pointerEvents: 'auto',
            fontSize: '0.8rem',
            maxWidth: 320,
            color: mapStyle === 'retro' || mapStyle === 'standard' ? '#333' : '#fff'
          }}
        >
          <Info size={16} className="text-gold" />
          <div>
            <span style={{ fontWeight: 700, display: 'block' }}>計程車派車模擬模式</span>
            <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>已載入台北區計程車車隊，每 1.5 秒更新移動行駛軌跡。</span>
          </div>
        </div>
      )}

      {/* SVG Canvas Map */}
      <svg
        width="100%"
        height="100%"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.1, 0.8, 0.25, 1)',
        }}
      >
        {/* Grid Background */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke={theme.grid} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1500" height="1500" fill="url(#grid)" />

        {/* Tamsui River representation */}
        <path
          d="M -100 1200 Q 200 1000 350 700 T 250 200 T 500 -100"
          fill="none"
          stroke={theme.river}
          strokeWidth="80"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M -100 1200 Q 200 1000 350 700 T 250 200 T 500 -100"
          fill="none"
          stroke={theme.riverGlow}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Keelung River fork */}
        <path
          d="M 330 650 Q 550 500 700 480 T 1100 350"
          fill="none"
          stroke={theme.river}
          strokeWidth="50"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Major Grid/Road Lines (Taipei Grid System) */}
        <line x1="-100" y1="350" x2="1200" y2="350" stroke={theme.roads} strokeWidth="12" />
        <line x1="-100" y1="580" x2="1200" y2="580" stroke={theme.roads} strokeWidth="16" />
        <line x1="-100" y1="780" x2="1200" y2="780" stroke={theme.roads} strokeWidth="14" />
        
        <line x1="280" y1="-100" x2="280" y2="1200" stroke={theme.roads} strokeWidth="14" />
        <line x1="550" y1="-100" x2="550" y2="1200" stroke={theme.roads} strokeWidth="16" />
        <line x1="780" y1="-100" x2="780" y2="1200" stroke={theme.roads} strokeWidth="12" />

        {/* District Labels */}
        <text x="150" y="420" fill={theme.label} fontSize="14" fontWeight="bold" opacity="0.6">萬華區</text>
        <text x="400" y="300" fill={theme.label} fontSize="14" fontWeight="bold" opacity="0.6">中山區</text>
        <text x="650" y="520" fill={theme.label} fontSize="14" fontWeight="bold" opacity="0.6">大安區</text>
        <text x="900" y="700" fill={theme.label} fontSize="14" fontWeight="bold" opacity="0.6">信義區</text>
        <text x="450" y="900" fill={theme.label} fontSize="14" fontWeight="bold" opacity="0.6">中正區</text>
        <text x="850" y="250" fill={theme.label} fontSize="14" fontWeight="bold" opacity="0.6">松山區</text>

        {/* Dynamic Rotating Taxi Markers */}
        {locations.map((driver) => {
          const { x, y } = projectCoord(driver.lat, driver.lng);
          const isSelected = selectedLocation?.id === driver.id;
          const color = getDriverColor(driver, isSelected);
          const rotationAngle = driver.heading - 90;

          return (
            <g 
              key={driver.id} 
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectLocation(driver);
              }}
            >
              <g transform={`translate(${x}, ${y}) rotate(${rotationAngle})`} style={{ transition: 'transform 0.5s ease-out' }}>
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? 20 : 12}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity={isSelected ? 0.9 : 0.4}
                >
                  <animate
                    attributeName="r"
                    values={`${isSelected ? 14 : 8};${isSelected ? 28 : 16};${isSelected ? 14 : 8}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.8;0;0.8"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>

                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? 12 : 9}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  style={{
                    filter: isSelected ? `drop-shadow(0 0 6px ${color})` : 'none',
                  }}
                />

                <polygon
                  points="0,-16 -4,-10 4,-10"
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="1"
                />

                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fontSize={isSelected ? "11px" : "9px"}
                  fill={driver.vehicleType === 'luxury' && !isSelected ? '#ffffff' : '#000000'}
                  style={{ fontWeight: 'bold' }}
                >
                  🚕
                </text>
              </g>

              <g transform={`translate(${x}, ${y})`}>
                <rect
                  x="-25"
                  y={isSelected ? "22" : "15"}
                  width="50"
                  height="12"
                  rx="3"
                  fill={isSelected ? "#ff2a5f" : "rgba(10, 11, 20, 0.85)"}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.5"
                />
                <text
                  x="0"
                  y={isSelected ? "31" : "24"}
                  textAnchor="middle"
                  fontSize="7px"
                  fill="#ffffff"
                  fontWeight="bold"
                  letterSpacing="0.05em"
                >
                  {driver.plateNumber}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Map Zoom Controls */}
      {mapSelectingMode === 'idle' && (
        <div 
          className="glass" 
          style={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 6,
            zIndex: 100,
            pointerEvents: 'auto'
          }}
        >
          <button 
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            onClick={() => handleZoom(1.25)}
            title="放大"
          >
            <ZoomIn size={18} />
          </button>
          <div style={{ height: 1, backgroundColor: 'var(--border-color)' }}></div>
          <button 
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            onClick={() => handleZoom(0.8)}
            title="縮小"
          >
            <ZoomOut size={18} />
          </button>
        </div>
      )}

      {/* Floating Center Pin and Top Card for Mock Mode Selection */}
      {mapSelectingMode !== 'idle' && (
        <>
          {/* Bottom Address Resolution Glassmorphic Card */}
          <div 
            className="glass animate-fade-in"
            style={{
              position: 'absolute',
              bottom: '50px',
              left: '16px',
              right: '16px',
              margin: '0 auto',
              zIndex: 50,
              maxWidth: '360px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'rgba(15, 18, 36, 0.9)',
              pointerEvents: 'auto',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              <MapPin size={14} className={mapSelectingMode === 'start' ? 'text-green' : 'text-red'} />
              <span>{mapSelectingMode === 'start' ? '設定乘車起點 (模擬模式)' : '設定下車終點 (模擬模式)'}</span>
            </div>
            
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', minHeight: '20px', lineHeight: 1.4 }}>
              {resolvedAddress}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={handleConfirm}
                disabled={resolvedAddress.startsWith('正在')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: mapSelectingMode === 'start' ? '#10b981' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                確定位置
              </button>
              <button
                onClick={onCancelSelection}
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
            </div>
          </div>

          {/* Floating Neon Pin exactly in center of map */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -100%)',
              zIndex: 50,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div
              className="center-pin-bounce"
              style={{
                fontSize: '44px',
                lineHeight: 1,
                filter: 'drop-shadow(0 10px 8px rgba(0,0,0,0.55))',
                transform: 'translateY(-12px)'
              }}
            >
              {mapSelectingMode === 'start' ? '📍' : '📌'}
            </div>
            
            <div 
              style={{
                width: '12px',
                height: '5px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                marginTop: '-6px',
                boxShadow: '0 0 6px rgba(0,0,0,0.8)'
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};
