'use client';

import React, { useState } from 'react';
import { Phone, Navigation, MessageSquare, ShieldCheck, CheckCircle } from 'lucide-react';
import { Driver } from '../types';

interface DetailCardProps {
  location: Driver | null; // Driver (passed as location for naming compatibility)
  onClose: () => void;
}

export const DetailCard: React.FC<DetailCardProps> = ({ location: driver, onClose }) => {
  const [dispatched, setDispatched] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!driver) return null;

  // Reset state when driver changes
  const handleClose = () => {
    setDispatched(false);
    setSuccessMsg('');
    onClose();
  };

  // Handler to simulate dispatching a taxi
  const handleDispatch = () => {
    setDispatched(true);
    setSuccessMsg(`派車成功！已發送派遣通知給 ${driver.name} 司機，車牌 ${driver.plateNumber}，預計 5 分鐘內抵達您設定的起點。`);
    
    // Auto-clear message after 6 seconds
    setTimeout(() => {
      setDispatched(false);
      setSuccessMsg('');
    }, 6000);
  };

  const handleCall = () => {
    window.location.href = `tel:${driver.phone}`;
  };

  const getVehicleLabel = (type: string) => {
    if (type === 'luxury') return '豪華商務車';
    if (type === 'suv') return '舒適 SUV';
    return '一般轎車';
  };

  return (
    <div className="detail-card-container animate-fade-in">
      <div className="detail-card-content glass">
        {/* Cover Avatar/Profile Image */}
        <div className="detail-img-container" style={{ height: '150px' }}>
          <button 
            className="btn-close-detail" 
            onClick={handleClose}
            aria-label="關閉"
          >
            &times;
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={driver.avatarUrl} 
            alt={driver.name} 
            className="detail-img"
            style={{ objectPosition: 'center 30%' }}
          />
        </div>

        {/* Info Body */}
        <div className="detail-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="detail-title">{driver.name} 司機</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>
                車牌號碼: {driver.plateNumber}
              </p>
            </div>
            <span className={`category-badge ${driver.vehicleType}`}>
              {getVehicleLabel(driver.vehicleType)}
            </span>
          </div>
          
          <div className="detail-meta" style={{ marginTop: -4 }}>
            <div className="rating-badge">
              <span className="star-icon">★</span>
              <span>{driver.rating} ({driver.reviewsCount} 次服務)</span>
            </div>
            
            {/* Status indicator */}
            <span 
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: driver.status === 'busy' ? '#9ca3af' : '#10b981'
              }}
            >
              • {driver.status === 'busy' ? '客滿中' : '空車可指派'}
            </span>
          </div>

          <p className="location-desc" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
            {driver.description}
          </p>

          {/* Taxi specifics info grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <div className="detail-info-item">
              <Phone size={15} />
              <span>聯絡電話：{driver.phone}</span>
            </div>
            
            <div className="detail-info-item">
              <ShieldCheck size={15} />
              <span>乘車保障：具備乘客責任險、GPS 全程軌跡記錄</span>
            </div>
          </div>

          {/* Success Message Banner */}
          {dispatched && (
            <div 
              className="animate-fade-in"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                fontSize: '0.75rem',
                color: '#34d399',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                lineHeight: 1.4
              }}
            >
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="detail-actions">
            <button 
              className="action-btn primary" 
              onClick={handleDispatch}
              disabled={driver.status === 'busy'}
              style={{
                opacity: driver.status === 'busy' ? 0.6 : 1,
                cursor: driver.status === 'busy' ? 'not-allowed' : 'pointer'
              }}
            >
              <Navigation size={15} />
              <span>{driver.status === 'busy' ? '暫時客滿' : '指派此車輛'}</span>
            </button>
            <button 
              className="action-btn secondary"
              onClick={handleCall}
            >
              <MessageSquare size={15} />
              <span>聯絡司機</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
