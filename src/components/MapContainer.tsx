'use client';

import React, { useEffect, useRef } from 'react';
import { Map, useMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Location, MapStyle } from '../types';
import { mapStyles } from '../data/mapStyles';

interface MapContainerProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (location: Location | null) => void;
  mapStyle: MapStyle;
  showTraffic: boolean;
}

// Sub-component to manage map panning, zoom, and layers using useMap hook
const MapController: React.FC<{
  selectedLocation: Location | null;
  showTraffic: boolean;
}> = ({ selectedLocation, showTraffic }) => {
  const map = useMap();
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  // Pan to selected location
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

  // Custom marker pin color based on location category
  const getMarkerColor = (location: Location) => {
    const isSelected = selectedLocation?.id === location.id;
    if (isSelected) return '#ff2a5f'; // Active Red
    
    if (location.category === 'cafe') return '#06b6d4'; // Cyan
    if (location.category === 'showroom') return '#f59e0b'; // Gold
    if (location.category === 'office') return '#a855f7'; // Purple
    if (location.category === 'service') return '#10b981'; // Green
    return '#6366f1'; // Indigo (default)
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
        {locations.map((loc) => {
          const isSelected = selectedLocation?.id === loc.id;
          const markerColor = getMarkerColor(loc);
          return (
            <AdvancedMarker
              key={loc.id}
              position={{ lat: loc.lat, lng: loc.lng }}
              onClick={() => onSelectLocation(loc)}
              title={loc.name}
            >
              <Pin
                background={markerColor}
                borderColor="#ffffff"
                glyphColor="#ffffff"
                scale={isSelected ? 1.2 : 0.9}
              />
            </AdvancedMarker>
          );
        })}
        
        <MapController selectedLocation={selectedLocation} showTraffic={showTraffic} />
      </Map>
    </div>
  );
};
