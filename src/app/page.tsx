'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapContainer } from '@/components/MapContainer';
import { Sidebar } from '@/components/Sidebar';
import { DetailCard } from '@/components/DetailCard';
import { MockMap } from '@/components/MockMap';
import { mockDrivers } from '@/data/drivers';
import { Driver, MapStyle, DriverStatus, VehicleType } from '@/types';
import { db, hasFirebaseConfig, firebaseConfig as defaultEnvConfig } from '@/firebase/config';
import { Key, AlertCircle, Play, Pause, Database, Check, UploadCloud } from 'lucide-react';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc, serverTimestamp, getDoc, query, where } from 'firebase/firestore';
import { useLiff } from '@/components/LiffProvider';

export default function Home() {
  const { isLoggedIn, profile, isLoading, liff } = useLiff();

  // Read keys from environment
  const envApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // States
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [startAddress, setStartAddress] = useState<string>('台北車站 (起點)');
  const [endAddress, setEndAddress] = useState<string>('台北 101 (終點)');

  // New Taxi Dispatch State Machine
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'searching' | 'assigned'>('idle');
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [isSenior, setIsSenior] = useState<boolean>(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [dispatchTimer, setDispatchTimer] = useState<any>(null);

  // Map Pin Selection States
  const [mapSelectingMode, setMapSelectingMode] = useState<'idle' | 'start' | 'end'>('idle');
  const [startLatLng, setStartLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [endLatLng, setEndLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Firebase Live Stream States
  const [isLiveFirestore, setIsLiveFirestore] = useState<boolean>(false);
  const [firebaseProjectName, setFirebaseProjectName] = useState<string>('');
  const [firebaseTrigger, setFirebaseTrigger] = useState<number>(0);

  // Animation/Simulation states
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const driversRef = useRef<Driver[]>([]);

  // Ref to track if LINE message has been sent for a specific order to prevent duplication
  const messageSentForOrderRef = useRef<string | null>(null);

  // Helper to send LINE notification message via LIFF SDK
  const sendOrderMatchedLineMessage = async (orderId: string, driver: Driver) => {
    if (!orderId || messageSentForOrderRef.current === orderId) return;
    messageSentForOrderRef.current = orderId;

    if (liff && liff.isInClient()) {
      try {
        await liff.sendMessages([
          {
            type: 'text',
            text: `🚖【建豐叫車 - 派車成功通知】\n\n已成功為您媒合到車輛！\n\n👤 司機姓名：${driver.name}\n🚗 車牌號碼：${driver.plateNumber}\n📱 司機電話：${driver.phone || "暫無"}\n📍 乘車起點：${startAddress}\n📍 乘車終點：${endAddress}\n\n司機正前往接駁，感謝您的使用！`
          }
        ]);
        console.log("LINE dispatch message sent successfully via LIFF.");
      } catch (err) {
        console.error("Failed to send LINE message via LIFF:", err);
      }
    }
  };

  // Settings Modal State
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [inputApiKey, setInputApiKey] = useState<string>('');
  const [inputFirebaseConfig, setInputFirebaseConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  // Load config on mount
  useEffect(() => {
    setApiKey(envApiKey === 'YOUR_GOOGLE_MAPS_API_KEY' ? '' : envApiKey);

    // Check if we have Firebase environment config
    if (hasFirebaseConfig) {
      setInputFirebaseConfig(defaultEnvConfig);
      setFirebaseTrigger(prev => prev + 1); // trigger initial load if env config is present
    }

    setDrivers(mockDrivers);
    driversRef.current = mockDrivers;
    setIsLoaded(true);
  }, [envApiKey]);

  // 1. Automatically retrieve user's GPS coordinates on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setStartLatLng({ lat: latitude, lng: longitude });

          // Try reverse geocoding if Google Maps API is already loaded
          try {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                let cleanAddress = results[0].formatted_address;
                cleanAddress = cleanAddress
                  .replace(/^中華民國台灣/, '')
                  .replace(/^台灣/, '')
                  .replace(/^\d{3,5}/, '')
                  .trim();
                setStartAddress(cleanAddress + ' (目前位置)');
              } else {
                setStartAddress(`目前位置 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
              }
            });
          } catch (e) {
            // Script not loaded yet: fallback to coordinates
            setStartAddress(`目前位置 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          }
        },
        (error) => {
          console.warn("GPS Geolocation access denied or failed:", error);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  // 2. Delayed Geocoding: Resolve coordinate address once Google Maps script loads
  useEffect(() => {
    if (startLatLng && startAddress.startsWith('目前位置 (') && typeof google !== 'undefined') {
      try {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat: startLatLng.lat, lng: startLatLng.lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            let cleanAddress = results[0].formatted_address;
            cleanAddress = cleanAddress
              .replace(/^中華民國台灣/, '')
              .replace(/^台灣/, '')
              .replace(/^\d{3,5}/, '')
              .trim();
            setStartAddress(cleanAddress + ' (目前位置)');
          }
        });
      } catch (err) {
        console.warn("Delayed GPS geocoding failed:", err);
      }
    }
  }, [startLatLng, startAddress, apiKey]);

  // Vehicle Type Mapping Helper based on Model Name
  const mapVehicleType = (maker: string, model: string): VehicleType => {
    const combinedStr = `${maker} ${model}`.toLowerCase();
    if (
      combinedStr.includes('tesla') ||
      combinedStr.includes('benz') ||
      combinedStr.includes('mercedes') ||
      combinedStr.includes('bmw') ||
      combinedStr.includes('lexus') ||
      combinedStr.includes('audi') ||
      combinedStr.includes('luxury') ||
      combinedStr.includes('尊榮')
    ) {
      return 'luxury';
    }
    if (
      combinedStr.includes('suv') ||
      combinedStr.includes('rav4') ||
      combinedStr.includes('crv') ||
      combinedStr.includes('kuga') ||
      combinedStr.includes('sienta') ||
      combinedStr.includes('休旅')
    ) {
      return 'suv';
    }
    return 'standard';
  };

  // Firestore Collection Subscription
  useEffect(() => {
    let activeDb = db;
    let configName = defaultEnvConfig.projectId;

    const dynamicApps = getApps();
    const dynamicApp = dynamicApps.find(app => app.name === 'dynamic-taxi-app');

    if (dynamicApp) {
      try {
        activeDb = getFirestore(dynamicApp);
        configName = (dynamicApp.options as any).projectId;
      } catch (e) {
        console.error("Failed to load dynamic firestore:", e);
      }
    }

    if (!activeDb) {
      setIsLiveFirestore(false);
      return;
    }

    // Disable local simulator since we are connecting to live Firestore!
    setIsSimulating(false);
    setIsLiveFirestore(true);
    setFirebaseProjectName(configName);

    // Subscribe to "drivers" collection
    const unsubscribe = onSnapshot(collection(activeDb, "drivers"), (snapshot) => {
      const liveDriversList: Driver[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Only display drivers that have active locations
        if (data.currentLocation && typeof data.currentLocation.lat === 'number') {
          let status: DriverStatus = 'offline';
          if (data.status === 1 || data.working === true) {
            status = 'online';
          } else if (data.status === 2 || data.isWorking === true) {
            status = 'busy';
          }

          const mappedDriver: Driver = {
            id: doc.id,
            name: data.name || doc.id.split('@')[0],
            lat: data.currentLocation.lat,
            lng: data.currentLocation.lng,
            heading: data.currentLocation.bearing || 0,
            plateNumber: data.carPlate || "未填寫車牌",
            status,
            vehicleType: mapVehicleType(data.carMaker || '', data.carModel || ''),
            phone: data.phone || "無電話",
            rating: data.rating || 4.9,
            reviewsCount: data.reviewsCount || Math.floor(Math.random() * 500) + 120,
            avatarUrl: data.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            description: data.carColor
              ? `${data.carColor}色 ${data.carMaker || ''} ${data.carModel || ''}。車內舒適整潔，聯絡正常。`
              : "專業優質司機，定位服務正常連線中。"
          };

          liveDriversList.push(mappedDriver);
        }
      });

      setDrivers(liveDriversList);
      driversRef.current = liveDriversList;
    }, (error) => {
      console.error("Firestore subscription error:", error);
      setIsLiveFirestore(false);
      setIsSimulating(true);
    });

    return () => unsubscribe();
  }, [firebaseTrigger]);

  // Sync LINE User Profile to Firestore "users" collection
  useEffect(() => {
    if (!isLoggedIn || !profile) return;

    const syncUserProfile = async () => {
      let activeDb = db;
      const dynamicApps = getApps();
      const dynamicApp = dynamicApps.find(app => app.name === 'dynamic-taxi-app');
      if (dynamicApp) {
        activeDb = getFirestore(dynamicApp);
      }

      if (!activeDb) return;

      try {
        const userRef = doc(activeDb, "users", profile.userId);
        const userSnap = await getDoc(userRef);
        const isNewUser = !userSnap.exists();

        const userData = {
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl || "",
          statusMessage: profile.statusMessage || "",
          role: "passenger",
          lastLoginAt: new Date(),
          updatedAt: new Date()
        };

        if (isNewUser) {
          // New User: Set registration timestamp and write profile
          (userData as any).createdAt = new Date();
          await setDoc(userRef, userData);

          // Issue Welcome Coupon: Save to coupons with unique ID to prevent double issuance
          const couponRef = doc(activeDb, "coupons", `${profile.userId}_WELCOME100`);
          const welcomeCoupon = {
            userId: profile.userId,
            couponCode: "WELCOME100",
            title: "新戶註冊乘車券",
            description: "首次註冊叫車享 100 元折抵優惠，不限車款。",
            discountAmount: 100,
            minOrderAmount: 200,
            status: "unused", // unused, used, expired
            expiryDate: new Date(Date.now() + 3600000 * 24 * 30), // 30 days expiry
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await setDoc(couponRef, welcomeCoupon);
          console.log("New user registered. WELCOME100 coupon issued.");
          alert(`歡迎新加入！系統已自動發送「新戶註冊乘車券 (100元)」至您的優惠券！`);
        } else {
          // Existing User: Sync profile changes and update lastLoginAt using merge
          await setDoc(userRef, userData, { merge: true });
          console.log("LINE user profile synced to users collection successfully.");
        }
      } catch (err) {
        console.error("Failed to sync user profile or issue welcome coupon:", err);
      }
    };

    syncUserProfile();
  }, [isLoggedIn, profile, firebaseTrigger]);

  // Subscribe to available coupons of the LINE user
  useEffect(() => {
    if (!isLoggedIn || !profile) {
      setAvailableCoupons([]);
      return;
    }

    let activeDb = db;
    const dynamicApps = getApps();
    const dynamicApp = dynamicApps.find(app => app.name === 'dynamic-taxi-app');
    if (dynamicApp) {
      activeDb = getFirestore(dynamicApp);
    }

    if (!activeDb) return;

    const q = query(
      collection(activeDb, "coupons"),
      where("userId", "==", profile.userId),
      where("status", "==", "unused")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          ...data
        });
      });
      setAvailableCoupons(list);
    }, (err) => {
      console.error("Failed to query user coupons:", err);
    });

    return () => unsubscribe();
  }, [isLoggedIn, profile, firebaseTrigger]);

  // Subscribe to the current active order
  useEffect(() => {
    if (!currentOrderId) return;

    let activeDb = db;
    const dynamicApps = getApps();
    const dynamicApp = dynamicApps.find(app => app.name === 'dynamic-taxi-app');
    if (dynamicApp) {
      activeDb = getFirestore(dynamicApp);
    }

    if (!activeDb) return;

    const unsubscribe = onSnapshot(doc(activeDb, "orders", currentOrderId), (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      if (data.status === 0) {
        // Order cancelled
        setBookingStatus('idle');
        setAssignedDriver(null);
        setCurrentOrderId(null);
      } else if (data.driverId) {
        // Driver accepted the order!
        // Find driver details from current list of drivers
        const foundDriver = driversRef.current.find(d => d.id === data.driverId) || mockDrivers.find(d => d.id === data.driverId);
        if (foundDriver) {
          setAssignedDriver(foundDriver);
          setBookingStatus('assigned');
          sendOrderMatchedLineMessage(currentOrderId, foundDriver);
        }
      }
    }, (err) => {
      console.error("Failed to query active order status:", err);
    });

    return () => unsubscribe();
  }, [currentOrderId]);

  // Real-time Local Movement Simulator (Used when Firestore is not active)
  useEffect(() => {
    if (!isSimulating || isLiveFirestore) return;

    const interval = setInterval(() => {
      const updatedDrivers = driversRef.current.map((driver) => {
        let heading = driver.heading;
        if (Math.random() < 0.1) {
          const turns = [-90, 0, 90, 180];
          const turn = turns[Math.floor(Math.random() * turns.length)];
          heading = (heading + turn + 360) % 360;
        }

        const rad = (heading * Math.PI) / 180;
        const speed = 0.00008 + Math.random() * 0.00004;
        let newLat = driver.lat + Math.sin(rad) * speed;
        let newLng = driver.lng + Math.cos(rad) * speed;

        const minLat = 25.02;
        const maxLat = 25.07;
        const minLng = 121.51;
        const maxLng = 121.57;

        if (newLat < minLat || newLat > maxLat || newLng < minLng || newLng > maxLng) {
          heading = (heading + 180) % 360;
          newLat = Math.max(minLat, Math.min(maxLat, driver.lat));
          newLng = Math.max(minLng, Math.min(maxLng, driver.lng));
        }

        return {
          ...driver,
          lat: newLat,
          lng: newLng,
          heading
        };
      });

      setDrivers(updatedDrivers);
      driversRef.current = updatedDrivers;

      if (selectedDriver) {
        const currentSelected = updatedDrivers.find(d => d.id === selectedDriver.id);
        if (currentSelected) {
          setSelectedDriver(currentSelected);
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating, isLiveFirestore, selectedDriver]);

  // Seeding Mock Data to Firestore (One-click Helper)
  const handleSeedDatabase = async () => {
    let activeDb = db;
    const dynamicApps = getApps();
    const dynamicApp = dynamicApps.find(app => app.name === 'dynamic-taxi-app');
    if (dynamicApp) {
      activeDb = getFirestore(dynamicApp);
    }

    if (!activeDb) {
      alert("請先設定並套用有效的 Firebase 憑證後再執行寫入！");
      return;
    }

    try {
      // 1. Seed drivers
      const driverData = [
        {
          email: "lin.driver@gmail.com",
          name: "林信宏",
          phone: "0912-345-678",
          carPlate: "TDY-5866",
          carColor: "黃",
          carMaker: "Toyota",
          carModel: "Sienta",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          status: 1,
          working: true,
          isWorking: false,
          loginCount: 15,
          currentLocation: {
            lat: 25.0412,
            lng: 121.5645,
            bearing: 90,
            speed: 15,
            gpsSeq: 20001,
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: "chen.driver@gmail.com",
          name: "陳建志",
          phone: "0928-888-777",
          carPlate: "TAX-9981",
          carColor: "銀",
          carMaker: "Toyota",
          carModel: "RAV4",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          status: 1,
          working: true,
          isWorking: false,
          loginCount: 34,
          currentLocation: {
            lat: 25.0336,
            lng: 121.5432,
            bearing: 180,
            speed: 10,
            gpsSeq: 20002,
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: "chang.driver@gmail.com",
          name: "張家豪",
          phone: "0975-123-456",
          carPlate: "VIP-0888",
          carColor: "黑",
          carMaker: "Tesla",
          carModel: "Model Y",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
          status: 1,
          working: true,
          isWorking: false,
          loginCount: 52,
          currentLocation: {
            lat: 25.0482,
            lng: 121.5170,
            bearing: 270,
            speed: 0,
            gpsSeq: 20003,
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: "lee.driver@gmail.com",
          name: "李淑芬",
          phone: "0933-456-789",
          carPlate: "TDA-3321",
          carColor: "白",
          carMaker: "Toyota",
          carModel: "Altis",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
          status: 1,
          working: true,
          isWorking: false,
          loginCount: 28,
          currentLocation: {
            lat: 25.0592,
            lng: 121.5345,
            bearing: 120,
            speed: 18,
            gpsSeq: 20004,
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const item of driverData) {
        await setDoc(doc(activeDb, "drivers", item.email), item);
      }

      // 2. Seed users (members)
      const mockUsers = [
        {
          userId: "mock_user_ricky",
          displayName: "Ricky Yeh",
          pictureUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          statusMessage: "Lotus Customer!",
          role: "passenger",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: "mock_user_amy",
          displayName: "Amy Chen",
          pictureUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
          statusMessage: "每天搭乘優質計程車",
          role: "passenger",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const item of mockUsers) {
        await setDoc(doc(activeDb, "users", item.userId), item);
      }

      // 3. Seed coupons
      const mockCoupons = [
        {
          couponCode: "WELCOME100",
          title: "新戶註冊乘車券",
          description: "首次註冊叫車享 100 元折抵優惠，不限車款。",
          discountAmount: 100,
          minOrderAmount: 200,
          expiryDate: new Date(Date.now() + 3600000 * 24 * 30),
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          couponCode: "LOTUS50",
          title: "建豐車行體驗券",
          description: "蓮花尊榮商務車專屬體驗折價 50 元券。",
          discountAmount: 50,
          minOrderAmount: 150,
          expiryDate: new Date(Date.now() + 3600000 * 24 * 15),
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          couponCode: "RAINY30",
          title: "雨天出行關懷券",
          description: "下雨天叫車關懷折抵 30 元券。",
          discountAmount: 30,
          minOrderAmount: 100,
          expiryDate: new Date(Date.now() + 3600000 * 24 * 7),
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const item of mockCoupons) {
        await setDoc(doc(activeDb, "coupons", item.couponCode), item);
      }

      // 4. Seed orders (historical trips)
      const mockOrders = [
        {
          passengerId: "mock_user_amy",
          passengerName: "Amy Chen",
          passengerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
          driverId: "lin.driver@gmail.com",
          driverName: "林信宏",
          carPlate: "TDY-5866",
          startAddress: "台北車站",
          endAddress: "台北 101",
          status: 2, // 2 = 已完成
          statusText: "訂單已完成",
          fare: 280,
          createdAt: new Date(Date.now() - 3600000 * 2),
          updatedAt: new Date(Date.now() - 3600000 * 2)
        },
        {
          passengerId: "mock_user_ricky",
          passengerName: "Ricky Yeh",
          passengerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          driverId: "chen.driver@gmail.com",
          driverName: "陳建志",
          carPlate: "TAX-9981",
          startAddress: "市政府捷運站",
          endAddress: "國父紀念館",
          status: 2, // 2 = 已完成
          statusText: "訂單已完成",
          fare: 120,
          createdAt: new Date(Date.now() - 3600000 * 24),
          updatedAt: new Date(Date.now() - 3600000 * 24)
        }
      ];

      for (const item of mockOrders) {
        await addDoc(collection(activeDb, "orders"), item);
      }

      alert("成功初始化資料庫！已成功寫入 4 筆司機資料、2 筆會員資料、3 款優惠券及 2 筆歷史訂單！");
    } catch (error: any) {
      console.error("Firestore seeding failed:", error);
      alert("寫入失敗：" + error.message + "\n請檢查您的 Firestore 安全規則 (Security Rules) 是否已開放寫入。");
    }
  };

  // Display only the assigned vehicle if booked, otherwise hide all vehicles
  const displayedDrivers = useMemo(() => {
    if (bookingStatus === 'assigned' && assignedDriver) {
      const liveDriver = drivers.find(d => d.id === assignedDriver.id);
      return liveDriver ? [liveDriver] : [assignedDriver];
    }
    return [];
  }, [bookingStatus, assignedDriver, drivers]);

  const handleSelectDriver = (driver: Driver | null) => {
    setSelectedDriver(driver);
  };

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();

    // Save Google Maps Key
    if (inputApiKey.trim()) {
      setApiKey(inputApiKey.trim());
    }

    // Save Firebase Configurations dynamically
    if (inputFirebaseConfig.projectId.trim() && inputFirebaseConfig.apiKey.trim()) {
      try {
        const apps = getApps();
        const existingApp = apps.find(app => app.name === 'dynamic-taxi-app');

        if (existingApp) {
          await deleteApp(existingApp);
        }
        initializeApp(inputFirebaseConfig, 'dynamic-taxi-app');
        setFirebaseTrigger(prev => prev + 1); // Trigger Firestore collection subscription
      } catch (err) {
        console.error("Dynamic Firebase initialization error:", err);
      }
    }

    setShowConfigModal(false);
  };

  const handleResetConfigs = () => {
    setApiKey('');
    setInputApiKey('');
    setInputFirebaseConfig({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    });
    setIsLiveFirestore(false);
    setIsSimulating(true);
    setDrivers(mockDrivers);
    driversRef.current = mockDrivers;
  };

  // Start Booking Flow - Creates Order in Firestore and triggers 5-second simulated acceptance
  const handleStartBooking = async () => {
    let activeDb = db;
    const dynamicApps = getApps();
    const dynamicApp = dynamicApps.find(app => app.name === 'dynamic-taxi-app');
    if (dynamicApp) {
      activeDb = getFirestore(dynamicApp);
    }

    setBookingStatus('searching');
    setAssignedDriver(null);

    // 1. Create order payload with precise Lat/Lng coordinates
    const orderData = {
      passengerId: isLoggedIn && profile ? profile.userId : "mock_user_ricky",
      passengerName: isLoggedIn && profile ? profile.displayName : "Ricky Yeh",
      passengerAvatar: isLoggedIn && profile ? (profile.pictureUrl || "") : "",
      driverId: "", // Empty initially! No driver has accepted yet.
      driverName: "",
      carPlate: "",
      startAddress: startAddress,
      endAddress: endAddress,
      startLatLng: startLatLng ? { lat: startLatLng.lat, lng: startLatLng.lng } : null,
      endLatLng: endLatLng ? { lat: endLatLng.lat, lng: endLatLng.lng } : null,
      isSenior: isSenior,
      couponId: selectedCouponId || "",
      status: 1, // 1 = 待處理/已指派 (Pending/Searching)
      statusText: "尋找司機中...",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    let createdOrderId = "";
    if (activeDb) {
      try {
        const docRef = await addDoc(collection(activeDb, "orders"), orderData);
        createdOrderId = docRef.id;
        setCurrentOrderId(createdOrderId);
      } catch (err) {
        console.error("Failed to write order to Firestore:", err);
      }
    } else {
      // Local Mock Mode: generate random order ID
      createdOrderId = `mock_order_${Date.now()}`;
      setCurrentOrderId(createdOrderId);
    }

    // 2. Simulate Driver Acceptance Timer (5 seconds)
    const timer = setTimeout(async () => {
      // Select a random driver from current list of online drivers
      const availableDriversList = driversRef.current.filter(d => d.status === 'online');
      const fallbackList = driversRef.current.length > 0 ? driversRef.current : mockDrivers;
      const pool = availableDriversList.length > 0 ? availableDriversList : fallbackList;
      const selected = pool[Math.floor(Math.random() * pool.length)];

      if (!selected) return;

      if (activeDb && createdOrderId) {
        // Update the order in Firestore
        try {
          const orderRef = doc(activeDb, "orders", createdOrderId);
          await setDoc(orderRef, {
            driverId: selected.id,
            driverName: selected.name,
            carPlate: selected.plateNumber,
            status: 3, // 3 = 行程中/前往接駁中 (Driving/En Route)
            statusText: "司機接單前往中",
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          console.error("Failed to update order with driver:", err);
        }
      } else {
        // Local Mock Mode update
        setAssignedDriver(selected);
        setBookingStatus('assigned');
        sendOrderMatchedLineMessage(createdOrderId, selected);
      }

      alert(`司機已接單！為您媒合到：${selected.name} 司機，車牌 ${selected.plateNumber}。`);
    }, 5000);

    setDispatchTimer(timer);
  };

  // Cancel Booking Flow - Cancel order in Firestore and reset local states
  const handleCancelBooking = async () => {
    if (dispatchTimer) {
      clearTimeout(dispatchTimer);
      setDispatchTimer(null);
    }

    let activeDb = db;
    const dynamicApps = getApps();
    const dynamicApp = dynamicApps.find(app => app.name === 'dynamic-taxi-app');
    if (dynamicApp) {
      activeDb = getFirestore(dynamicApp);
    }

    if (activeDb && currentOrderId) {
      try {
        const orderRef = doc(activeDb, "orders", currentOrderId);
        await setDoc(orderRef, {
          status: 0, // 0 = 已取消
          statusText: "訂單已取消",
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to cancel order in Firestore:", err);
      }
    }

    setBookingStatus('idle');
    setAssignedDriver(null);
    setCurrentOrderId(null);
  };

  // Map Pin Selection Handlers
  const handleStartMapSelection = (mode: 'start' | 'end') => {
    setMapSelectingMode(mode);
    setIsSidebarCollapsed(true); // 自動收起側邊欄，釋放全螢幕視野
  };

  const handleResolveAddress = (address: string, lat: number, lng: number) => {
    if (mapSelectingMode === 'start') {
      setStartAddress(address);
      setStartLatLng({ lat, lng });
    } else if (mapSelectingMode === 'end') {
      setEndAddress(address);
      setEndLatLng({ lat, lng });
    }
    setMapSelectingMode('idle');
    setIsSidebarCollapsed(false); // 自動展開側邊欄，讓用戶確認細節與點擊叫車
  };

  const handleCancelSelection = () => {
    setMapSelectingMode('idle');
    setIsSidebarCollapsed(false); // 自動展開側邊欄，還原叫車介面
  };

  const hasValidKey = apiKey.startsWith('AIzaSy');

  if (isLoading) {
    return (
      <div className="liff-full-loading">
        <div className="loading-spinner"></div>
        <p>正在驗證 LINE 登入狀態...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Floating Control Row */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          pointerEvents: 'auto',
          display: 'flex',
          gap: 12
        }}
      >
        {/* Status Settings Trigger Badge */}
        <div className="glass">
          <button
            onClick={() => {
              setInputApiKey(apiKey);
              setShowConfigModal(true);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 16px',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Database size={14} className={isLiveFirestore ? 'text-green' : 'text-gold'} />
            <span>
              {isLiveFirestore
                ? `Firestore: ${firebaseProjectName} (已連線)`
                : 'Firestore: 模擬移動模式 (按此設定串接)'}
            </span>
          </button>
        </div>

        {/* Local Simulator controls */}
        {!isLiveFirestore && (
          <div className="glass animate-fade-in">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px 16px',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              title={isSimulating ? "暫停車輛移動" : "開始車輛移動"}
            >
              {isSimulating ? (
                <>
                  <Pause size={14} className="text-cyan" />
                  <span>模擬移動中</span>
                </>
              ) : (
                <>
                  <Play size={14} className="text-muted" />
                  <span>移動已暫停</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Map Area - Conditional Rendering */}
      {hasValidKey ? (
        <APIProvider key={apiKey} apiKey={apiKey}>
          <MapContainer
            locations={displayedDrivers}
            selectedLocation={assignedDriver}
            onSelectLocation={handleSelectDriver}
            mapStyle={mapStyle}
            showTraffic={showTraffic}
            mapSelectingMode={mapSelectingMode}
            onResolveAddress={handleResolveAddress}
            onCancelSelection={handleCancelSelection}
            startLatLng={startLatLng}
          />
        </APIProvider>
      ) : (
        <MockMap
          locations={displayedDrivers}
          selectedLocation={assignedDriver}
          onSelectLocation={handleSelectDriver}
          mapStyle={mapStyle}
          mapSelectingMode={mapSelectingMode}
          onResolveAddress={handleResolveAddress}
          onCancelSelection={handleCancelSelection}
          startLatLng={startLatLng}
        />
      )}

      {/* Floating Layout Overlays */}
      <div className="overlay-layout">
        {/* Sidebar Panel */}
        <Sidebar
          mapStyle={mapStyle}
          onChangeMapStyle={setMapStyle}
          showTraffic={showTraffic}
          onToggleTraffic={() => setShowTraffic(!showTraffic)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={setIsSidebarCollapsed}
          startAddress={startAddress}
          onChangeStartAddress={setStartAddress}
          endAddress={endAddress}
          onChangeEndAddress={setEndAddress}
          mapSelectingMode={mapSelectingMode}
          onStartMapSelection={handleStartMapSelection}
          isSenior={isSenior}
          onChangeIsSenior={setIsSenior}
          selectedCouponId={selectedCouponId}
          onChangeSelectedCouponId={setSelectedCouponId}
          availableCoupons={availableCoupons}
          bookingStatus={bookingStatus}
          assignedDriver={assignedDriver}
          onStartBooking={handleStartBooking}
          onCancelBooking={handleCancelBooking}
        />
      </div>

      {/* API Key & Firebase Config Settings Overlay Modal */}
      {showConfigModal && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(5, 6, 10, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto'
          }}
          onClick={() => setShowConfigModal(false)}
        >
          <div
            className="glass animate-fade-in"
            style={{
              width: '90%',
              maxWidth: 520,
              maxHeight: '90%',
              overflowY: 'auto',
              padding: 32,
              background: '#0c0d16',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Database size={24} className="text-cyan" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>系統與金鑰設定</h2>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              在此設定您的 Google Maps 與 Firebase 憑證。當填入有效的 Firebase 設定時，系統會自動斷開模擬器，並透過 WebSocket 即時串接您 Firestore 的車輛位置！
            </p>

            <form onSubmit={handleSaveConfigs} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Section 1: Google Maps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                  1. Google Maps 設定
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    GOOGLE MAPS API KEY
                  </label>
                  <input
                    type="text"
                    placeholder="AIzaSy..."
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'white',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Section 2: Firebase Firestore */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                  2. Firebase Firestore 設定
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      PROJECT ID (專案 ID)
                    </label>
                    <input
                      type="text"
                      placeholder="my-firebase-project"
                      value={inputFirebaseConfig.projectId}
                      onChange={(e) => setInputFirebaseConfig({ ...inputFirebaseConfig, projectId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'white',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      API KEY
                    </label>
                    <input
                      type="text"
                      placeholder="AIzaSy..."
                      value={inputFirebaseConfig.apiKey}
                      onChange={(e) => setInputFirebaseConfig({ ...inputFirebaseConfig, apiKey: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'white',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      AUTH DOMAIN
                    </label>
                    <input
                      type="text"
                      placeholder="project-id.firebaseapp.com"
                      value={inputFirebaseConfig.authDomain}
                      onChange={(e) => setInputFirebaseConfig({ ...inputFirebaseConfig, authDomain: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'white',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      APP ID
                    </label>
                    <input
                      type="text"
                      placeholder="1:1234:web:abcd"
                      value={inputFirebaseConfig.appId}
                      onChange={(e) => setInputFirebaseConfig({ ...inputFirebaseConfig, appId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'white',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Seeding Helper Button */}
              {isLiveFirestore && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    完整叫車系統資料庫初始化 (Seed: drivers, users, orders, coupons)
                  </label>
                  <button
                    type="button"
                    onClick={handleSeedDatabase}
                    className="action-btn secondary"
                    style={{
                      width: '100%',
                      border: '1px solid #10b981',
                      color: '#34d399',
                      background: 'rgba(16, 185, 129, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <UploadCloud size={16} />
                    <span>初始化 4 個集合 (司機、會員、歷史訂單、優惠券)</span>
                  </button>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  className="action-btn primary"
                  style={{ flex: 1, border: 'none' }}
                >
                  <Check size={16} />
                  <span>套用設定</span>
                </button>
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={handleResetConfigs}
                  style={{ flex: 1 }}
                >
                  清除並恢復預設
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
