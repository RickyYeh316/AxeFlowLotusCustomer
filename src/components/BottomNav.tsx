'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, History, Ticket } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  // Helper to determine if a route is active
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div
      className="bottom-nav-container"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: 'calc(64px + env(safe-area-inset-bottom))',
        background: 'rgba(12, 13, 22, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 999,
        boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.4)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        pointerEvents: 'auto'
      }}
    >
      {/* Tab 1: 即時叫車 */}
      <Link
        href="/"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive('/') ? '#06b6d4' : '#64748b',
          textDecoration: 'none',
          gap: 4,
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
      >
        {isActive('/') && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              width: '80%',
              height: '3px',
              background: '#06b6d4',
              borderRadius: '0 0 4px 4px',
              boxShadow: '0 2px 10px rgba(6, 182, 212, 0.5)'
            }}
          />
        )}
        <MapPin size={20} />
        <span style={{ fontSize: '0.7rem', fontWeight: isActive('/') ? 700 : 500, letterSpacing: '0.05em' }}>即時叫車</span>
      </Link>

      {/* Tab 2: 我的行程 */}
      <Link
        href="/orders"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive('/orders') ? '#06b6d4' : '#64748b',
          textDecoration: 'none',
          gap: 4,
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
      >
        {isActive('/orders') && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              width: '80%',
              height: '3px',
              background: '#06b6d4',
              borderRadius: '0 0 4px 4px',
              boxShadow: '0 2px 10px rgba(6, 182, 212, 0.5)'
            }}
          />
        )}
        <History size={20} />
        <span style={{ fontSize: '0.7rem', fontWeight: isActive('/orders') ? 700 : 500, letterSpacing: '0.05em' }}>我的行程</span>
      </Link>

      {/* Tab 3: 優惠好康 */}
      <Link
        href="/coupons"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive('/coupons') ? '#06b6d4' : '#64748b',
          textDecoration: 'none',
          gap: 4,
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
      >
        {isActive('/coupons') && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              width: '80%',
              height: '3px',
              background: '#06b6d4',
              borderRadius: '0 0 4px 4px',
              boxShadow: '0 2px 10px rgba(6, 182, 212, 0.5)'
            }}
          />
        )}
        <Ticket size={20} />
        <span style={{ fontSize: '0.7rem', fontWeight: isActive('/coupons') ? 700 : 500, letterSpacing: '0.05em' }}>優惠好康</span>
      </Link>
    </div>
  );
};
