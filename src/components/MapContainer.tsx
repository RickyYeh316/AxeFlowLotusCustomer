'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Map, useMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Driver, MapStyle } from '../types';
import { mapStyles } from '../data/mapStyles';
import { MapPin } from 'lucide-react';

interface MapContainerProps {
  locations: Driver[]; // Driver list (passed as locations for naming compatibility)
  selectedLocation: Driver | null;
  onSelectLocation: (location: Driver | null) => void;
  mapStyle: MapStyle;
  showTraffic: boolean;
  
  // New selection mode props
  mapSelectingMode: 'idle' | 'start' | 'end';
  onResolveAddress: (address: string, lat: number, lng: number) => void;
  onCancelSelection: () => void;
  startLatLng: { lat: number; lng: number } | null;
}

// Sub-component to manage map panning, zoom, and layers using useMap hook
const MapController: React.FC<{
  selectedLocation: Driver | null;
  showTraffic: boolean;
  startLatLng: { lat: number; lng: number } | null;
}> = ({ selectedLocation, showTraffic, startLatLng }) => {
  const map = useMap();
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const initialPanRef = useRef<boolean>(false);

  // Pan to user's GPS start location on initial load (one-shot)
  useEffect(() => {
    if (!map || !startLatLng || initialPanRef.current) return;
    map.panTo({ lat: startLatLng.lat, lng: startLatLng.lng });
    map.setZoom(15);
    initialPanRef.current = true;
  }, [map, startLatLng]);

  // Pan to selected driver location
  useEffect(() => {
    if (!map || !selectedLocation) return;
    
    map.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
    
    // Smoothly zoom in to focus on the point
    const currentZoom = map.getZoom() || 12;
    if (currentZoom < 15) {
      map.setZoom(15);
    }
  }, [map, selectedLocation]);

  // Handle traffic layer toggling
  useEffect(() => {
    if (!map) return;

    if (showTraffic) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(map);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    }

    return () => {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    };
  }, [map, showTraffic]);

  return null;
};

// Sub-component to listen to Map idle events for camera location geocoding
const MapSelectionListener: React.FC<{
  enabled: boolean;
  onMapIdle: (lat: number, lng: number) => void;
}> = ({ enabled, onMapIdle }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !enabled) return;

    const listener = map.addListener('idle', () => {
      const center = map.getCenter();
      if (center) {
        onMapIdle(center.lat(), center.lng());
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, enabled, onMapIdle]);

  return null;
};

export const MapContainer: React.FC<MapContainerProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  mapStyle,
  showTraffic,
  mapSelectingMode,
  onResolveAddress,
  onCancelSelection,
  startLatLng,
}) => {
  const map = useMap();
  // Center of Taipei (approximate)
  const defaultCenter = { lat: 25.045, lng: 121.545 };
  const defaultZoom = 13;

  // Selection states
  const [resolvedAddress, setResolvedAddress] = useState<string>('正在解析地址...');
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number } | null>(null);

  // When selection mode turns on, set initial preview if map is ready
  useEffect(() => {
    if (mapSelectingMode !== 'idle' && map) {
      const center = map.getCenter();
      if (center) {
        handleMapIdle(center.lat(), center.lng());
      }
    }
  }, [mapSelectingMode, map]);

  // Handle Geocoding
  const handleMapIdle = (lat: number, lng: number) => {
    setResolvedAddress('正在解析地址...');
    setCurrentCenter({ lat, lng });

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        let cleanAddress = results[0].formatted_address;
        // Clean Taiwan postal labels for localized aesthetic look
        cleanAddress = cleanAddress
          .replace(/^中華民國台灣/, '')
          .replace(/^台灣/, '')
          .replace(/^\d{3,5}/, '')
          .trim();
        
        setResolvedAddress(cleanAddress);
      } else {
        setResolvedAddress(`未知座標 (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      }
    });
  };

  const handleConfirm = () => {
    if (currentCenter && !resolvedAddress.startsWith('正在')) {
      onResolveAddress(resolvedAddress, currentCenter.lat, currentCenter.lng);
    }
  };

  // Custom marker styles
  const getMarkerBgColor = (driver: Driver) => {
    if (driver.status === 'busy') return '#6b7280'; // Gray for busy
    
    if (driver.vehicleType === 'luxury') return '#111827'; // Dark grey/black for luxury
    if (driver.vehicleType === 'suv') return '#0284c7'; // Blue for SUV
    return '#f59e0b'; // Gold/Yellow for standard taxi
  };

  const getMarkerTextColor = (driver: Driver) => {
    if (driver.vehicleType === 'luxury') return '#ffffff';
    return '#000000';
  };

  return (
    <div className="map-viewport" style={{ position: 'relative' }}>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        styles={mapStyles[mapStyle]}
        mapId="DEMO_MAP_ID"
      >
        {/* Render Assigned Driver marker */}
        {locations.map((driver) => {
          const isSelected = selectedLocation?.id === driver.id;
          const bgColor = getMarkerBgColor(driver);
          const textColor = getMarkerTextColor(driver);
          
          return (
            <AdvancedMarker
              key={driver.id}
              position={{ lat: driver.lat, lng: driver.lng }}
              onClick={() => onSelectLocation(driver)}
              title={`${driver.name} (${driver.plateNumber})`}
            >
              <div 
                style={{
                  transform: `scale(${isSelected ? 1.25 : 1})`,
                  transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: bgColor,
                    border: isSelected ? '3px solid #ff2a5f' : '2px solid #ffffff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: isSelected 
                      ? '0 0 20px #ff2a5f, 0 10px 20px rgba(0,0,0,0.5)' 
                      : '0 4px 10px rgba(0,0,0,0.3)',
                    transform: `rotate(${driver.heading}deg)`,
                    transition: 'transform 0.5s ease-out',
                    color: textColor
                  }}
                >
                  🚖
                </div>
                
                <div
                  style={{
                    marginTop: '4px',
                    backgroundColor: isSelected ? '#ff2a5f' : 'rgba(10, 11, 20, 0.85)',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.05em'
                  }}
                >
                  {driver.plateNumber}
                </div>
              </div>
            </AdvancedMarker>
          );
        })}
        
        <MapController selectedLocation={selectedLocation} showTraffic={showTraffic} startLatLng={startLatLng} />
        
        {/* Listen for selection moves */}
        <MapSelectionListener 
          enabled={mapSelectingMode !== 'idle'} 
          onMapIdle={handleMapIdle} 
        />
      </Map>

      {/* Floating Center Pin and Top Card */}
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
              <span>{mapSelectingMode === 'start' ? '設定乘車起點' : '設定下車終點'}</span>
            </div>
            
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', minHeight: '20px', lineHeight: 1.4 }}>
              {resolvedAddress}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={handleConfirm}
                disabled={!currentCenter || resolvedAddress.startsWith('正在')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: mapSelectingMode === 'start' ? '#10b981' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  opacity: (!currentCenter || resolvedAddress.startsWith('正在')) ? 0.5 : 1
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
            {/* Pin Icon / Bouncing Emoji */}
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
            
            {/* Ground shadow beneath pin */}
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
