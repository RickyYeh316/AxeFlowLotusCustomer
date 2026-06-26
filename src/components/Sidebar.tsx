'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Settings, 
  Layers, 
  Sparkles, 
  Briefcase, 
  Compass, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Grid,
  Car,
  UserCheck,
  UserX
} from 'lucide-react';
import { Driver, MapStyle } from '../types';

interface SidebarProps {
  locations: Driver[]; // Driver list (passed as locations for naming compatibility)
  selectedLocation: Driver | null;
  onSelectLocation: (location: Driver | null) => void;
  mapStyle: MapStyle;
  onChangeMapStyle: (style: MapStyle) => void;
  showTraffic: boolean;
  onToggleTraffic: () => void;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  selectedCategory: string; // vehicleType filter
  onChangeCategory: (category: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  mapStyle,
  onChangeMapStyle,
  showTraffic,
  onToggleTraffic,
  searchQuery,
  onChangeSearchQuery,
  selectedCategory,
  onChangeCategory,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const categories = [
    { id: 'all', label: '全部', icon: Grid },
    { id: 'standard', label: '一般轎車', icon: Car },
    { id: 'suv', label: '舒適 SUV', icon: Sparkles },
    { id: 'luxury', label: '豪華商務', icon: Briefcase },
  ];

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'luxury': return <Briefcase className="icon-sm text-purple" />;
      case 'suv': return <Sparkles className="icon-sm text-cyan" />;
      default: return <Car className="icon-sm text-gold" />;
    }
  };

  return (
    <div className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse Toggle Button */}
      <button 
        className="sidebar-toggle glass" 
        onClick={() => setIsCollapsed(!isCollapsed)}
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
              <h1 className="brand-title">Taxi Dispatch</h1>
              <p className="brand-subtitle">車隊即時調度平台</p>
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

        {/* Search Panel */}
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="搜尋司機姓名、車牌..."
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search" 
              onClick={() => onChangeSearchQuery('')}
            >
              &times;
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="categories-scroll">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => onChangeCategory(cat.id)}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Driver List */}
        <div className="location-list">
          <div className="list-header">
            <span>在線車輛 ({locations.length})</span>
          </div>

          {locations.length > 0 ? (
            <div className="scroll-wrapper">
              {locations.map((driver) => {
                const isSelected = selectedLocation?.id === driver.id;
                return (
                  <div
                    key={driver.id}
                    className={`location-card ${isSelected ? 'active' : ''} animate-fade-in`}
                    onClick={() => onSelectLocation(driver)}
                  >
                    <div className="card-header">
                      <span className={`category-badge ${driver.vehicleType}`}>
                        {getVehicleIcon(driver.vehicleType)}
                        {driver.vehicleType === 'luxury' && '豪華商務'}
                        {driver.vehicleType === 'suv' && '舒適 SUV'}
                        {driver.vehicleType === 'standard' && '一般轎車'}
                      </span>
                      
                      {/* Driver Status Badge */}
                      <span 
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: driver.status === 'busy' ? 'rgba(107, 114, 128, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: driver.status === 'busy' ? '#9ca3af' : '#34d399'
                        }}
                      >
                        {driver.status === 'busy' ? (
                          <>
                            <UserX size={10} />
                            <span>客滿</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={10} />
                            <span>空車</span>
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="location-name" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{driver.name} 司機</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {driver.plateNumber}
                      </span>
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <p className="location-address" style={{ margin: 0, fontSize: '0.7rem' }}>
                        定位座標: {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
                      </p>
                      <div className="rating-badge">
                        <Star size={11} className="star-icon" />
                        <span style={{ fontSize: '0.7rem' }}>{driver.rating}</span>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <p className="location-desc animate-fade-in">{driver.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-list animate-fade-in">
              <Car size={40} className="empty-icon" />
              <p>找不到符合的車輛</p>
              <button 
                className="btn-reset" 
                onClick={() => {
                  onChangeSearchQuery('');
                  onChangeCategory('all');
                }}
              >
                重設篩選條件
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
