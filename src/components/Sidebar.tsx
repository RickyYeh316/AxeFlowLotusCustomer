'use client';

import React, { useState } from 'react';
import {
  Settings,
  Layers,
  Compass,
  Star,
  ChevronLeft,
  ChevronRight,
  Car,
  UserCheck,
  Phone,
  Gift,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Briefcase,
  MapPin
} from 'lucide-react';
import { Driver, MapStyle } from '../types';
import { useLiff } from '@/components/LiffProvider';

interface SidebarProps {
  mapStyle: MapStyle;
  onChangeMapStyle: (style: MapStyle) => void;
  showTraffic: boolean;
  onToggleTraffic: () => void;
  
  // Collapse controls
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;

  // Route inputs
  startAddress: string;
  onChangeStartAddress: (addr: string) => void;
  endAddress: string;
  onChangeEndAddress: (addr: string) => void;

  // Selection mode
  mapSelectingMode: 'idle' | 'start' | 'end';
  onStartMapSelection: (mode: 'start' | 'end') => void;

  // Custom preferences
  isSenior: boolean;
  onChangeIsSenior: (isSenior: boolean) => void;
  selectedCouponId: string;
  onChangeSelectedCouponId: (couponId: string) => void;
  availableCoupons: Array<{ id: string; couponCode: string; title: string; discountAmount: number }>;

  // Booking state machine
  bookingStatus: 'idle' | 'searching' | 'assigned';
  assignedDriver: Driver | null;
  onStartBooking: () => void;
  onCancelBooking: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mapStyle,
  onChangeMapStyle,
  showTraffic,
  onToggleTraffic,
  isCollapsed,
  onToggleCollapse,
  startAddress,
  onChangeStartAddress,
  endAddress,
  onChangeEndAddress,
  mapSelectingMode,
  onStartMapSelection,
  isSenior,
  onChangeIsSenior,
  selectedCouponId,
  onChangeSelectedCouponId,
  availableCoupons,
  bookingStatus,
  assignedDriver,
  onStartBooking,
  onCancelBooking,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const { isLoggedIn, profile, login, logout, isLoading } = useLiff();

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'luxury': return <Briefcase className="icon-sm text-purple" />;
      case 'suv': return <Sparkles className="icon-sm text-cyan" />;
      default: return <Car className="icon-sm text-gold" />;
    }
  };

  const getVehicleLabel = (type: string) => {
    if (type === 'luxury') return '豪華商務車';
    if (type === 'suv') return '舒適 SUV';
    return '一般客車';
  };

  const isFormValid = startAddress.trim() !== '' && endAddress.trim() !== '';

  return (
    <div className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse Toggle Button */}
      <button 
        className="sidebar-toggle glass" 
        onClick={() => onToggleCollapse(!isCollapsed)}
        aria-label={isCollapsed ? "展開側邊欄" : "收合側邊欄"}
        title={isCollapsed ? "展開側邊欄" : "收合側邊欄"}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="sidebar-content glass">
        {/* Header */}
        <header className="sidebar-header">
          <div className="logo-area">
            <div className="logo-icon">
              <Compass size={24} className="spinning-logo" />
            </div>
            <div>
              <h1 className="brand-title">建豐車行</h1>
              <p className="brand-subtitle">敬老與即時乘車調度平台</p>
            </div>
          </div>
          <button
            className={`btn-settings glass ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="地圖設定"
          >
            <Settings size={18} />
          </button>
        </header>

        {/* LINE LIFF Login/Profile Panel */}
        <div className="liff-panel" style={{ marginTop: -4, marginBottom: -4 }}>
          {isLoading ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
              載入 LINE 服務中...
            </div>
          ) : isLoggedIn && profile ? (
            <div className="line-profile-card animate-fade-in">
              <div className="line-avatar-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.pictureUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                  alt={profile.displayName}
                  className="line-avatar"
                />
                <span className="line-status-dot"></span>
              </div>
              <div className="line-profile-info">
                <span className="line-profile-name">{profile.displayName}</span>
                <span className="line-profile-status">{profile.statusMessage || "LINE 已連線"}</span>
              </div>
              <button onClick={logout} className="btn-line-logout">
                登出
              </button>
            </div>
          ) : (
            <div className="line-login-container animate-fade-in">
              <p className="line-login-text">登入 LINE 即可啟用乘客調度與綁定官方帳號服務</p>
              <button onClick={login} className="btn-line-login">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M24 10.3c0-4.8-5.4-8.8-12-8.8S0 5.5 0 10.3c0 4.3 4.3 7.9 10.1 8.7 1 .2 1.3.6 1.2 1.5l-.1 1.2c-.1.5.2.7.5.5 2-.9 8.2-4.8 10.8-8.2 1.1-1.3 1.5-2.5 1.5-3.7z" />
                </svg>
                <span>LINE 快速登入</span>
              </button>
            </div>
          )}
        </div>

        {/* Floating Settings Drawer */}
        {showSettings && (
          <div className="settings-drawer glass animate-fade-in">
            <h3 className="drawer-title"><Layers size={14} /> 地圖顯示設定</h3>

            <div className="settings-section">
              <label className="section-label">地圖配色主題</label>
              <div className="style-grid">
                {(['standard', 'dark', 'retro', 'cool-blue'] as MapStyle[]).map((style) => (
                  <button
                    key={style}
                    className={`style-btn ${mapStyle === style ? 'active' : ''}`}
                    onClick={() => onChangeMapStyle(style)}
                  >
                    {style === 'standard' && '標準'}
                    {style === 'dark' && '極致暗色'}
                    {style === 'retro' && '復古銀'}
                    {style === 'cool-blue' && '酷炫藍'}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-section row-layout">
              <span className="section-label">即時路況圖層</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showTraffic}
                  onChange={onToggleTraffic}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        )}

        {/* MAIN INTERACTIVE WORKFLOW CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px 0' }}>

          {/* STATE A: IDLE - INPUTTING BOOKING FIELDS */}
          {bookingStatus === 'idle' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 16px' }}>

              {/* Route Planner Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Compass size={14} className="text-cyan" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>乘車起訖點設定</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Start Address */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                    <input
                      type="text"
                      value={startAddress}
                      onChange={(e) => onChangeStartAddress(e.target.value)}
                      placeholder="請輸入乘車起點..."
                      style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem', width: '100%', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => onStartMapSelection('start')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: mapSelectingMode === 'start' ? 'var(--color-secondary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        transition: 'var(--transition-smooth)'
                      }}
                      title="在地圖上選點"
                    >
                      <MapPin size={16} className={mapSelectingMode === 'start' ? 'animate-bounce' : ''} />
                    </button>
                  </div>

                  {/* End Address */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    <input
                      type="text"
                      value={endAddress}
                      onChange={(e) => onChangeEndAddress(e.target.value)}
                      placeholder="請輸入下車終點..."
                      style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem', width: '100%', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => onStartMapSelection('end')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: mapSelectingMode === 'end' ? '#ef4444' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        transition: 'var(--transition-smooth)'
                      }}
                      title="在地圖上選點"
                    >
                      <MapPin size={16} className={mapSelectingMode === 'end' ? 'animate-bounce' : ''} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preferences: Senior Toggle & Coupons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: 8, color: 'var(--text-secondary)' }}>
                  乘車設定與偏好
                </div>

                {/* Senior Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>敬老愛心卡服務</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>啟用政府社福點數折抵</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={isSenior}
                      onChange={(e) => onChangeIsSenior(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                {/* Coupon Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Gift size={13} className="text-purple" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>乘車優惠券折抵</span>
                  </div>
                  {isLoggedIn ? (
                    <select
                      value={selectedCouponId}
                      onChange={(e) => onChangeSelectedCouponId(e.target.value)}
                      style={{
                        background: 'rgba(15, 18, 36, 0.85)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '0.75rem',
                        outline: 'none',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      <option value="">不使用優惠券</option>
                      {availableCoupons.map((coupon) => (
                        <option key={coupon.id} value={coupon.id}>
                          {coupon.title} (省 NT${coupon.discountAmount})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={12} />
                      <span>請先登入 LINE 帳號以讀取您的優惠券</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Trigger Button */}
              <div style={{ marginTop: 10 }}>
                {isLoggedIn ? (
                  <button
                    onClick={onStartBooking}
                    disabled={!isFormValid}
                    className="action-btn primary"
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: isFormValid ? 1 : 0.45,
                      cursor: isFormValid ? 'pointer' : 'not-allowed',
                      boxShadow: isFormValid ? '0 4px 20px var(--color-primary-glow)' : 'none'
                    }}
                  >
                    <Car size={18} />
                    <span>立即呼叫計程車</span>
                  </button>
                ) : (
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'not-allowed'
                    }}
                  >
                    <span>請由上方登入以開始叫車</span>
                  </button>
                )}
              </div>

            </div>
          )}

          {/* STATE B: SEARCHING / DISPATCHING */}
          {bookingStatus === 'searching' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 16px', alignItems: 'center', justifyContent: 'center', minHeight: '300px', textAlign: 'center' }}>

              <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                {/* Glowing Pulsing Rings */}
                <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(99,102,241,0.06)', border: '2px solid var(--color-primary)', animation: 'ping 2s infinite' }} />
                <div style={{ position: 'absolute', width: '75%', height: '75%', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={36} className="text-cyan animate-pulse" />
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 6 }}>正在尋找附近車輛...</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '240px', margin: '0 auto', lineHeight: 1.5 }}>
                  系統正將您的派遣需求發送給附近空車司機，請稍候。
                </p>
              </div>

              {/* Order Info Summary */}
              <div className="glass" style={{ width: '100%', padding: 14, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>起點</span>
                  <span style={{ color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{startAddress}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>終點</span>
                  <span style={{ color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{endAddress}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>敬老服務</span>
                  <span style={{ color: isSenior ? 'var(--color-secondary)' : 'var(--text-secondary)', fontWeight: 700 }}>
                    {isSenior ? '啟用 (敬老卡折抵)' : '一般叫車'}
                  </span>
                </div>
                {selectedCouponId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>使用優惠券</span>
                    <span style={{ color: '#a78bfa', fontWeight: 700 }}>
                      {availableCoupons.find(c => c.id === selectedCouponId)?.title || '已折抵'}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={onCancelBooking}
                className="action-btn"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                取消叫車
              </button>

            </div>
          )}

          {/* STATE C: ASSIGNED - TRACKING DRIVER */}
          {bookingStatus === 'assigned' && assignedDriver && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 16px' }}>

              {/* Status Header */}
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={16} className="text-emerald animate-pulse" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>配對司機成功</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>司機正前往您的起點位置...</span>
                </div>
              </div>

              {/* Dynamic Assigned Driver Profile Card */}
              <div className="glass" style={{ padding: 18, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="var(--text-muted)">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, background: '#10b981', border: '2px solid #07080d', borderRadius: '50%' }}></span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{assignedDriver.name} 司機</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: 10 }}>
                        <Star size={10} fill="#f59e0b" className="text-gold" />
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24' }}>{assignedDriver.rating}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span className={`category-badge ${assignedDriver.vehicleType}`} style={{ display: 'inline-flex', padding: '1px 6px', fontSize: '0.6rem' }}>
                        {getVehicleIcon(assignedDriver.vehicleType)}
                        <span>{getVehicleLabel(assignedDriver.vehicleType)}</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {assignedDriver.plateNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.7rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>車輛定位</span>
                    <span style={{ color: 'white', fontFamily: 'monospace' }}>{assignedDriver.lat.toFixed(5)}, {assignedDriver.lng.toFixed(5)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>安全防護</span>
                    <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <ShieldCheck size={12} />
                      <span>認證合規車輛</span>
                    </span>
                  </div>
                </div>

                {/* Call Driver Button */}
                <a
                  href={`tel:${assignedDriver.phone}`}
                  className="action-btn primary"
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={14} />
                  <span>撥打電話聯絡司機</span>
                </a>

              </div>

              {/* Cancel Booking (During trip / en route) */}
              <button
                onClick={onCancelBooking}
                className="action-btn"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                取消此次乘車預約
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
