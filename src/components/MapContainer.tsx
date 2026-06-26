'use client';

import React, { useEffect, useRef } from 'react';
import { Map, useMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Driver, MapStyle } from '../types';
import { mapStyles } from '../data/mapStyles';

interface MapContainerProps {
  locations: Driver[]; // Driver list (passed as locations for naming compatibility)
  selectedLocation: Driver | null;
  onSelectLocation: (location: Driver | null) => void;
  mapStyle: MapStyle;
  showTraffic: boolean;
}

// Sub-component to manage map panning, zoom, and layers using useMap hook
const MapController: React.FC<{
  selectedLocation: Driver | null;
  showTraffic: boolean;
}> = ({ selectedLocation, showTraffic }) => {
  const map = useMap();
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

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

export const MapContainer: React.FC<MapContainerProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  mapStyle,
  showTraffic,
}) => {
  // Center of Taipei (approximate)
  const defaultCenter = { lat: 25.045, lng: 121.545 };
  const defaultZoom = 13;

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
    <div className="map-viewport">
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        styles={mapStyles[mapStyle]}
        mapId="DEMO_MAP_ID"
      >
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
                {/* Taxi Marker Pin with Heading Direction Rotation */}
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
                    // Smooth transition for rotation and translation
                    transition: 'transform 0.5s ease-out',
                    color: textColor
                  }}
                  title={driver.vehicleType}
                >
                  🚖
                </div>
                
                {/* License Plate Display Label */}
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
        
        <MapController selectedLocation={selectedLocation} showTraffic={showTraffic} />
      </Map>
    </div>
  );
};
