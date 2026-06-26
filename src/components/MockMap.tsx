'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Location, MapStyle } from '../types';
import { ZoomIn, ZoomOut, Compass, Info } from 'lucide-react';

interface MockMapProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (location: Location | null) => void;
  mapStyle: MapStyle;
}

export const MockMap: React.FC<MockMapProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  mapStyle,
}) => {
  // SVG Canvas view state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: -150, y: -200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const mapRef = useRef<HTMLDivElement>(null);

  // Map lat/lng coordinates to 1000x1000 SVG coordinates
  // Taipei approx bounding box: Lat 25.02 to 25.07, Lng 121.51 to 121.57
  const minLat = 25.02;
  const maxLat = 25.07;
  const minLng = 121.51;
  const maxLng = 121.57;

  const projectCoord = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 1000;
    // Invert Y for SVG coordinates
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 1000;
    return { x, y };
  };

  // Center on selected location when it changes
  useEffect(() => {
    if (selectedLocation) {
      const { x, y } = projectCoord(selectedLocation.lat, selectedLocation.lng);
      
      // Calculate pan to center the point
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Target pan = center - (projected point * zoom)
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
          <span style={{ fontWeight: 700, display: 'block' }}>地圖預覽模式 (Demo Mode)</span>
          <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>已載入台北區 Lotus 服務據點，提供點擊與流暢交互。</span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <svg
        width="100%"
        height="100%"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.1, 0.8, 0.2, 1)',
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
        {/* Xinyi Road / Zhongxiao E Road (East-West lines) */}
        <line x1="-100" y1="350" x2="1200" y2="350" stroke={theme.roads} strokeWidth="12" />
        <line x1="-100" y1="580" x2="1200" y2="580" stroke={theme.roads} strokeWidth="16" />
        <line x1="-100" y1="780" x2="1200" y2="780" stroke={theme.roads} strokeWidth="14" />
        
        {/* Fuxing / Dunhua / Zhongshan (North-South lines) */}
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

        {/* Pulsing Active Node Rings */}
        {locations.map((loc) => {
          const { x, y } = projectCoord(loc.lat, loc.lng);
          const isSelected = selectedLocation?.id === loc.id;
          
          let color = '#6366f1'; // Indigo
          if (loc.category === 'cafe') color = '#06b6d4'; // Cyan
          if (loc.category === 'showroom') color = '#f59e0b'; // Gold
          if (loc.category === 'office') color = '#a855f7'; // Purple
          if (loc.category === 'service') color = '#10b981'; // Green
          if (isSelected) color = '#ff2a5f'; // Active Red

          return (
            <g 
              key={loc.id} 
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectLocation(loc);
              }}
            >
              {/* Pulsing outer ring */}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 22 : 12}
                fill="none"
                stroke={color}
                strokeWidth="2"
                opacity={isSelected ? 0.9 : 0.4}
              >
                <animate
                  attributeName="r"
                  values={`${isSelected ? 16 : 8};${isSelected ? 32 : 18};${isSelected ? 16 : 8}`}
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

              {/* Solid Pin base */}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 10 : 6}
                fill={color}
                stroke="#ffffff"
                strokeWidth={isSelected ? 3 : 2}
                style={{
                  filter: isSelected ? `drop-shadow(0 0 8px ${color})` : 'none',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Map Zoom Controls */}
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
    </div>
  );
};
