'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLiff } from '@/components/LiffProvider';
import { db } from '@/firebase/config';
import { getFirestore, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { getApps } from 'firebase/app';
import { Calendar, MapPin, Navigation, User, ChevronRight, ArrowLeft } from 'lucide-react';
import { OrderStatus } from '@/types';

interface Order {
  id: string;
  passengerId: string;
  passengerName: string;
  driverId: string;
  driverName: string;
  carPlate: string;
  startAddress: string;
  endAddress: string;
  status: number; // 0: 已取消, 1: 派遣中/已指派, 2: 已完成, 3: 行程中
  statusText: string;
  fare?: number;
  createdAt: any;
}

type TabType = 'ongoing' | 'completed' | 'cancelled';

export default function OrdersPage() {
  const { isLoggedIn, profile, login, isLoading: isLiffLoading } = useLiff();
  const [activeTab, setActiveTab] = useState<TabType>('ongoing');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(true);

  // Firestore connection
  useEffect(() => {
    if (!isLoggedIn || !profile) {
      setDbLoading(false);
      return;
    }

    let activeDb = db;
    const dynamicApps = getApps();
    const dynamicApp = dynamicApps.find(app => app.name === 'dynamic-taxi-app');
    if (dynamicApp) {
      activeDb = getFirestore(dynamicApp);
    }

    if (!activeDb) {
      setDbLoading(false);
      return;
    }

    setDbLoading(true);

    // Query orders for this passenger
    const q = query(
      collection(activeDb, "orders"),
      where("passengerId", "==", profile.userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Status mapping helper for string/number compatibility
        const mapStatusToNumber = (status: any): number => {
          if (typeof status === 'number') return status;
          if (typeof status === 'string') {
            const normalized = status.toUpperCase();
            switch (normalized) {
              case 'CANCELLED':
              case OrderStatus.CANCELLED_BY_USER:
              case OrderStatus.DRIVER_CANCELLED:
              case OrderStatus.NO_SHOW:
              case OrderStatus.FAILED_MATCH:
                return 0;
              case 'PENDING':
              case OrderStatus.PENDING:
              case OrderStatus.MATCHING:
              case OrderStatus.ACCEPTED:
              case OrderStatus.ARRIVED:
                return 1;
              case 'COMPLETED':
              case OrderStatus.COMPLETED:
                return 2;
              case 'IN_PROGRESS':
              case OrderStatus.IN_PROGRESS:
                return 3;
              default:
                return 1;
            }
          }
          return 1;
        };

        const getFallbackStatusText = (status: any): string => {
          if (typeof status === 'string') {
            const normalized = status.toUpperCase();
            switch (normalized) {
              case OrderStatus.PENDING: return '等待派車';
              case OrderStatus.MATCHING: return '系統配車中';
              case OrderStatus.ACCEPTED: return '司機已接單';
              case OrderStatus.ARRIVED: return '司機已抵達';
              case OrderStatus.IN_PROGRESS: return '行程進行中';
              case OrderStatus.COMPLETED: return '已完成';
              case OrderStatus.CANCELLED_BY_USER: return '乘客取消';
              case OrderStatus.DRIVER_CANCELLED: return '司機取消';
              case OrderStatus.NO_SHOW: return '乘客未搭乘';
              case OrderStatus.FAILED_MATCH: return '配車失敗';
              case 'CANCELLED': return '已取消';
            }
          }
          return '處理中';
        };

        ordersList.push({
          id: doc.id,
          passengerId: data.passengerId || data.userId || '',
          passengerName: data.passengerName || '乘客',
          driverId: data.driverId || '',
          driverName: data.driverName || '未分配',
          carPlate: data.carPlate || '未填寫',
          startAddress: data.startAddress || '未填寫起點',
          endAddress: data.endAddress || '未填寫終點',
          status: mapStatusToNumber(data.status),
          statusText: data.statusText || getFallbackStatusText(data.status),
          fare: data.fare,
          createdAt: data.createdAt
        });
      });

      // Sort by createdAt descending (client-side to avoid index requirement warnings in Firestore console)
      ordersList.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setOrders(ordersList);
      setDbLoading(false);
    }, (error) => {
      console.error("Failed to fetch orders:", error);
      setDbLoading(false);
    });

    return () => unsubscribe();
  }, [isLoggedIn, profile]);

  // Tab filtering logic
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'ongoing') {
      return order.status === 1 || order.status === 3;
    }
    if (activeTab === 'completed') {
      return order.status === 2;
    }
    if (activeTab === 'cancelled') {
      return order.status === 0;
    }
    return false;
  });

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <span className="status-badge ongoing-badge animate-pulse">派遣中</span>;
      case 3:
        return <span className="status-badge driving-badge">行程中</span>;
      case 2:
        return <span className="status-badge completed-badge">已完成</span>;
      case 0:
        return <span className="status-badge cancelled-badge">已取消</span>;
      default:
        return <span className="status-badge">未確定</span>;
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '未知時間';
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return date.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (isLiffLoading) {
    return (
      <div className="liff-full-loading">
        <div className="loading-spinner"></div>
        <p>正在驗證 LINE 登入狀態...</p>
      </div>
    );
  }

  // Login Gate UI
  if (!isLoggedIn || !profile) {
    return (
      <div className="liff-login-gate">
        <div className="login-gate-card glass">
          <div className="gate-icon-wrapper">
            <User size={36} className="text-cyan animate-pulse" />
          </div>
          <h2>請登入 LINE 查看乘車紀錄</h2>
          <p>此功能僅供 LINE 認證會員使用，點選下方按鈕即可快速完成登入與綁定。</p>
          
          <button onClick={login} className="btn-line-login-full">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M24 10.3c0-4.8-5.4-8.8-12-8.8S0 5.5 0 10.3c0 4.3 4.3 7.9 10.1 8.7 1 .2 1.3.6 1.2 1.5l-.1 1.2c-.1.5.2.7.5.5 2-.9 8.2-4.8 10.8-8.2 1.1-1.3 1.5-2.5 1.5-3.7z"/>
            </svg>
            <span>LINE 帳號安全登入</span>
          </button>
          
          <Link href="/" className="btn-back-home">
            <ArrowLeft size={16} />
            <span>返回叫車地圖</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="liff-page-container">
      {/* Premium Header */}
      <header className="liff-header glass">
        <Link href="/" className="header-back-btn">
          <ArrowLeft size={20} />
        </Link>
        <h1>我的乘車紀錄</h1>
        <div style={{ width: 20 }}></div>
      </header>

      {/* Tabs Menu */}
      <div className="liff-tabs glass">
        {(['ongoing', 'completed', 'cancelled'] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`liff-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'ongoing' && '進行中'}
            {tab === 'completed' && '已完成'}
            {tab === 'cancelled' && '已取消'}
          </button>
        ))}
      </div>

      {/* List Body */}
      <main className="liff-main">
        {dbLoading ? (
          <div className="liff-loading-state">
            <div className="loading-spinner"></div>
            <p>正在載入紀錄...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order.id} className="order-card glass animate-fade-in">
                {/* Driver Info Header */}
                <div className="order-card-header">
                  <div className="driver-brief">
                    <div className="driver-avatar-mini">
                      <User size={16} className="text-muted" />
                    </div>
                    <div>
                      <h3>{order.driverName} 司機</h3>
                      <p className="car-plate-sub">{order.carPlate}</p>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Timeline Route Info */}
                <div className="order-route-timeline">
                  <div className="timeline-dot-container">
                    <div className="dot start-dot"></div>
                    <div className="line"></div>
                    <div className="dot end-dot"></div>
                  </div>
                  <div className="addresses-container">
                    <div className="address-item">
                      <span className="address-label">起點</span>
                      <p className="address-text">{order.startAddress}</p>
                    </div>
                    <div className="address-item">
                      <span className="address-label">終點</span>
                      <p className="address-text">{order.endAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Order Footer Info */}
                <div className="order-card-footer">
                  <div className="time-badge">
                    <Calendar size={13} />
                    <span>{formatTimestamp(order.createdAt)}</span>
                  </div>
                  {order.status === 2 && order.fare !== undefined && (
                    <div className="fare-badge">
                      <span>車資</span>
                      <strong>NT$ {order.fare}</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="liff-empty-state animate-fade-in">
            <Navigation size={44} className="text-muted" />
            <p>目前尚無此類別的行程紀錄</p>
            <Link href="/" className="action-btn primary mt-4" style={{ display: 'inline-flex', alignSelf: 'center', padding: '10px 24px' }}>
              <span>立即去預約叫車</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
