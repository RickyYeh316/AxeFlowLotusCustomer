'use client';

import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Settings, 
  Layers, 
  Coffee, 
  Sparkles, 
  Briefcase, 
  Wrench, 
  Compass, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Grid 
} from 'lucide-react';
import { Location, MapStyle } from '../types';

interface SidebarProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (location: Location | null) => void;
  mapStyle: MapStyle;
  onChangeMapStyle: (style: MapStyle) => void;
  showTraffic: boolean;
  onToggleTraffic: () => void;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  selectedCategory: string;
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
    { id: 'showroom', label: '展示中心', icon: Sparkles },
    { id: 'cafe', label: '咖啡館', icon: Coffee },
    { id: 'office', label: '創客研發', icon: Briefcase },
    { id: 'service', label: '服務中心', icon: Wrench },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cafe': return <Coffee className="icon-sm text-cyan" />;
      case 'showroom': return <Sparkles className="icon-sm text-gold" />;
      case 'office': return <Briefcase className="icon-sm text-purple" />;
      case 'service': return <Wrench className="icon-sm text-green" />;
      default: return <MapPin className="icon-sm" />;
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
              <h1 className="brand-title">Lotus Portal</h1>
              <p className="brand-subtitle">地圖探索平台</p>
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
            placeholder="搜尋地點或地址..."
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

        {/* Location List */}
        <div className="location-list">
          <div className="list-header">
            <span>精選地點 ({locations.length})</span>
          </div>

          {locations.length > 0 ? (
            <div className="scroll-wrapper">
              {locations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    className={`location-card ${isSelected ? 'active' : ''} animate-fade-in`}
                    onClick={() => onSelectLocation(loc)}
                  >
                    <div className="card-header">
                      <span className={`category-badge ${loc.category}`}>
                        {getCategoryIcon(loc.category)}
                        {loc.category === 'showroom' && '展示中心'}
                        {loc.category === 'cafe' && '咖啡館'}
                        {loc.category === 'office' && '辦公室'}
                        {loc.category === 'service' && '售後服務'}
                      </span>
                      <div className="rating-badge">
                        <Star size={12} className="star-icon" />
                        <span>{loc.rating}</span>
                      </div>
                    </div>

                    <h3 className="location-name">{loc.name}</h3>
                    <p className="location-address">{loc.address}</p>
                    
                    {isSelected && (
                      <p className="location-desc animate-fade-in">{loc.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-list animate-fade-in">
              <Compass size={40} className="empty-icon" />
              <p>找不到符合的地點</p>
              <button 
                className="btn-reset" 
                onClick={() => {
                  onChangeSearchQuery('');
                  onChangeCategory('all');
                }}
              >
                重設搜尋條件
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
