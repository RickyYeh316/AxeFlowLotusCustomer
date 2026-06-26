'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Clock, Navigation, Bookmark, BookmarkCheck, X } from 'lucide-react';
import { Location } from '../types';

interface DetailCardProps {
  location: Location | null;
  onClose: () => void;
}

export const DetailCard: React.FC<DetailCardProps> = ({ location, onClose }) => {
  const [isSaved, setIsSaved] = useState(false);

  if (!location) return null;

  // Handler to open navigation in Google Maps
  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="detail-card-container animate-fade-in">
      <div className="detail-card-content glass">
        {/* Cover Image */}
        <div className="detail-img-container">
          <button 
            className="btn-close-detail" 
            onClick={onClose}
            aria-label="關閉"
          >
            <X size={16} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={location.imageUrl} 
            alt={location.name} 
            className="detail-img"
          />
        </div>

        {/* Info Body */}
        <div className="detail-body">
          <h2 className="detail-title">{location.name}</h2>
          
          <div className="detail-meta">
            <span className={`category-badge ${location.category}`}>
              {location.category === 'showroom' && '展示中心'}
              {location.category === 'cafe' && '咖啡館'}
              {location.category === 'office' && '辦公室'}
              {location.category === 'service' && '售後服務'}
            </span>
            <div className="rating-badge">
              <span className="star-icon">★</span>
              <span>{location.rating} ({location.reviewsCount} 則評論)</span>
            </div>
          </div>

          <p className="location-desc" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
            {location.description}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <div className="detail-info-item">
              <MapPin size={16} />
              <span>{location.address}</span>
            </div>
            
            <div className="detail-info-item">
              <Phone size={16} />
              <span>{location.phone}</span>
            </div>
            
            <div className="detail-info-item">
              <Clock size={16} />
              <span>營業時間：{location.hours}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="detail-actions">
            <button 
              className="action-btn primary" 
              onClick={handleGetDirections}
            >
              <Navigation size={16} />
              <span>開始導航</span>
            </button>
            <button 
              className={`action-btn secondary ${isSaved ? 'text-gold' : ''}`}
              onClick={() => setIsSaved(!isSaved)}
            >
              {isSaved ? <BookmarkCheck size={16} className="text-gold" /> : <Bookmark size={16} />}
              <span>{isSaved ? '已儲存地點' : '儲存地點'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
