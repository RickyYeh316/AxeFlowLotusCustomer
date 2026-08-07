'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLiff } from '@/components/LiffProvider';
import { db } from '@/firebase/config';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getApps } from 'firebase/app';
import { Ticket, Calendar, User, ArrowLeft, AlertCircle, HelpCircle } from 'lucide-react';

interface Coupon {
  id: string;
  userId: string;
  couponCode: string;
  title: string;
  description: string;
  discountAmount: number;
  minOrderAmount: number;
  status: 'unused' | 'used' | 'expired';
  expiryDate: any;
}

type TabType = 'available' | 'used' | 'expired';

export default function CouponsPage() {
  const { isLoggedIn, profile, login, isLoading: isLiffLoading } = useLiff();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
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

    // Query user specific coupons
    const q = query(
      collection(activeDb, "userCoupons"),
      where("userId", "==", profile.userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const couponsList: Coupon[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const expiryDate = data.expiryDate;
        
        let status = data.status || 'unused';
        
        // Dynamically check if expired based on current local date
        if (status === 'unused' && expiryDate) {
          const expiryTime = expiryDate.seconds ? expiryDate.seconds * 1000 : new Date(expiryDate).getTime();
          if (expiryTime < Date.now()) {
            status = 'expired';
          }
        }

        couponsList.push({
          id: doc.id,
          userId: data.userId,
          couponCode: data.couponCode || doc.id,
          title: data.title || '乘車折價券',
          description: data.description || '限時乘車折抵使用。',
          discountAmount: typeof data.discountAmount === 'number' ? data.discountAmount : 50,
          minOrderAmount: typeof data.minOrderAmount === 'number' ? data.minOrderAmount : 0,
          status: status,
          expiryDate: expiryDate
        });
      });

      setCoupons(couponsList);
      setDbLoading(false);
    }, (error) => {
      console.error("Failed to fetch coupons:", error);
      setDbLoading(false);
    });

    return () => unsubscribe();
  }, [isLoggedIn, profile]);

  // Tab filtering logic
  const filteredCoupons = coupons.filter(coupon => {
    if (activeTab === 'available') {
      return coupon.status === 'unused';
    }
    if (activeTab === 'used') {
      return coupon.status === 'used';
    }
    if (activeTab === 'expired') {
      return coupon.status === 'expired';
    }
    return false;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '無效期限';
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
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
            <Ticket size={36} className="text-cyan animate-pulse" />
          </div>
          <h2>請登入 LINE 查看優惠券</h2>
          <p>此功能僅供 LINE 認證會員使用，登入後即可領取並查看您的新戶專屬折價券。</p>
          
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
        <h1>我的優惠券</h1>
        <div style={{ width: 20 }}></div>
      </header>

      {/* Tabs Menu */}
      <div className="liff-tabs glass">
        {(['available', 'used', 'expired'] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`liff-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'available' && '可使用'}
            {tab === 'used' && '已使用'}
            {tab === 'expired' && '已過期'}
          </button>
        ))}
      </div>

      {/* List Body */}
      <main className="liff-main">
        {dbLoading ? (
          <div className="liff-loading-state">
            <div className="loading-spinner"></div>
            <p>正在載入優惠券...</p>
          </div>
        ) : filteredCoupons.length > 0 ? (
          <div className="coupons-list">
            {filteredCoupons.map((coupon) => (
              <div 
                key={coupon.id} 
                className={`coupon-card glass animate-fade-in ${activeTab !== 'available' ? 'inactive-coupon' : ''}`}
              >
                {/* Left Cut-out ticket part with value */}
                <div className="coupon-left-value">
                  <span className="currency">NT$</span>
                  <span className="value-num">{coupon.discountAmount}</span>
                  <div className="sawtooth-border-left"></div>
                </div>

                {/* Right text info part */}
                <div className="coupon-right-info">
                  <h3>{coupon.title}</h3>
                  <p className="coupon-desc-text">{coupon.description}</p>
                  
                  <div className="coupon-requirements">
                    <AlertCircle size={11} />
                    <span>滿 NT$ {coupon.minOrderAmount} 可折抵</span>
                  </div>

                  <div className="coupon-expiry">
                    <Calendar size={11} />
                    <span>使用期限：{formatDate(coupon.expiryDate)}</span>
                  </div>
                  
                  {coupon.status === 'used' && (
                    <div className="coupon-status-stamp used-stamp">已使用</div>
                  )}
                  {coupon.status === 'expired' && (
                    <div className="coupon-status-stamp expired-stamp">已過期</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="liff-empty-state animate-fade-in">
            <Ticket size={44} className="text-muted" />
            <p>目前尚無此狀態的優惠券</p>
          </div>
        )}
      </main>
    </div>
  );
}
