/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Utensils, 
  Calendar, 
  MapPin, 
  Phone, 
  Clock, 
  Instagram, 
  Music2, 
  ChevronRight, 
  Menu as MenuIcon, 
  X,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Star,
  XCircle,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { menu } from './data/menu';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  limit,
  getDocs 
} from 'firebase/firestore';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import OrderPage from './pages/OrderPage';
import MenuPage from './pages/MenuPage';

const COLORS = {
  primary: '#1A1A1A', // Dark Charcoal
  secondary: '#D4AF37', // Gold
  accent: '#0A0A0A', // Deep Dark
  text: '#FDFCF0', // Light Cream
  textMuted: '#A0A0A0', // Muted Light
};

export default function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'order' | 'res'}[]>([]);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showSplash, setShowSplash] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [hoveredItem, setHoveredItem] = useState<any>(null);
  
  // Dynamic Menu State
  const [liveMenu, setLiveMenu] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'menu'), (snapshot) => {
      if (snapshot.empty) {
        // Fallback to static menu if Firestore is empty
        const transformed = menu.map(section => ({
          ...section,
          items: section.items.map(i => ({ 
            ...i, 
            id: `static-${i.name.replace(/\s+/g, '-').toLowerCase()}`,
            available: true 
          }))
        }));
        setLiveMenu(transformed);
      } else {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const categories = Array.from(new Set(items.map((i: any) => i.category)));
        const grouped = categories.map(cat => ({
          title: cat,
          items: items.filter((i: any) => i.category === cat)
        }));
        setLiveMenu(grouped);
      }
    }, (err) => {
      console.error("Menu listener error:", err);
    });

    return () => unsubscribe();
  }, []);

  // Reservation Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    guests: '2 People',
    date: '',
    time: '6:00 PM',
    smoking: 'Non-Smoking',
    requests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Order Form State
  const [cart, setCart] = useState<{id: string, name: string, price: string, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    fullName: '',
    phone: '',
    pickupTime: 'In 15 minutes',
    notes: ''
  });
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  
  // Testimonials State
  const [reviews, setReviews] = useState<{id: string, name: string, rating: number, text: string, createdAt: any}[]>([]);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, text: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setReviews(fetchedReviews);
    }, (err) => {
      console.error("Reviews listener error:", err);
    });

    return () => unsubscribe();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.text) return;
    setIsSubmittingReview(true);
    
    try {
      await addDoc(collection(db, 'reviews'), {
        ...reviewForm,
        createdAt: serverTimestamp()
      });
      setReviewSubmitted(true);
      setReviewForm({ name: '', rating: 5, text: '' });
      setTimeout(() => setReviewSubmitted(false), 5000);
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const addToCart = (item: any) => {
    const itemId = item.id || item.name;
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing) {
        return prev.map(i => i.id === itemId ? {...i, quantity: i.quantity + 1} : i);
      }
      return [...prev, { 
        id: itemId, 
        name: item.name, 
        price: item.price, 
        quantity: 1,
        minPickupTime: item.minPickupTime && item.minPickupTime !== 'ASAP' ? item.minPickupTime : '15 min'
      }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.quantity + delta);
        return {...i, quantity: newQty};
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const cartTotal = cart.reduce((acc: number, item: any) => acc + (parseFloat(item.price) * item.quantity), 0);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsOrdering(true);
    setError(null);

    try {
      await addDoc(collection(db, 'orders'), {
        items: cart,
        orderHistory: cart.map(item => item.name), // Flattened list for quick insight
        total: cartTotal,
        ...orderFormData,
        type: 'pickup',
        createdAt: serverTimestamp()
      });
      setOrderComplete(true);
      setCart([]);
      setOrderFormData({
        fullName: '',
        phone: '',
        pickupTime: 'ASAP',
        notes: ''
      });
    } catch (err) {
      console.error("Error adding order: ", err);
      setError("Something went wrong with your order. Please call us at (973) 321-8611.");
    } finally {
      setIsOrdering(false);
    }
  };

  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      const sections = ['home', 'menu', 'reservations', 'delivery'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'reservations'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setIsSubmitted(true);
      setFormData({
        fullName: '',
        phone: '',
        guests: '2 People',
        date: '',
        time: '6:00 PM',
        smoking: 'Non-Smoking',
        requests: ''
      });
    } catch (err) {
      console.error("Error adding reservation: ", err);
      setError("Something went wrong. Please call us at (973) 321-8611 to book your table.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Real-time notification listeners for Staff
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10)), (s) => {
      s.docChanges().forEach((change) => {
        if (change.type === 'added' && !s.metadata.hasPendingWrites) {
          const data = change.doc.data();
          const isRecent = data.createdAt?.seconds > (Date.now() / 1000) - 30;
          if (isRecent) {
            addNotification(`New Order from ${data.fullName}`, 'order');
          }
        }
      });
    });

    const unsubRes = onSnapshot(query(collection(db, 'reservations'), orderBy('createdAt', 'desc'), limit(10)), (s) => {
      s.docChanges().forEach((change) => {
        if (change.type === 'added' && !s.metadata.hasPendingWrites) {
          const data = change.doc.data();
          const isRecent = data.createdAt?.seconds > (Date.now() / 1000) - 30 || !data.createdAt;
          if (isRecent) {
            addNotification(`New Reservation: ${data.fullName}`, 'res');
          }
        }
      });
    });

    return () => {
      unsubOrders();
      unsubRes();
    };
  }, [user]);

  const addNotification = (message: string, type: 'order' | 'res') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  };

  return (
    <>
      {/* Global Notifications for Staff */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-[#1A1A1A] text-white p-5 rounded-2xl shadow-2xl border-2 border-[#D4AF37] flex items-center gap-4 min-w-[300px]"
            >
              <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#1A1A1A]">
                {n.type === 'order' ? <ShoppingBag size={24} /> : <Calendar size={24} />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase text-[#D4AF37] mb-0.5">
                  {n.type === 'order' ? 'New Order Received' : 'New Table Booking'}
                </p>
                <p className="font-bold">{n.message}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                className="text-white/40 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/menu" element={<MenuPage isDarkMode={isDarkMode} />} />
        <Route path="/order" element={<OrderPage 
          liveMenu={liveMenu} 
          addToCart={addToCart} 
          cart={cart} 
          setIsCartOpen={setIsCartOpen}
          isScrolled={isScrolled}
          setSelectedItem={setSelectedItem}
          activeSection="delivery"
          isDarkMode={isDarkMode}
        />} />
        <Route path="/" element={<Home 
          showSplash={showSplash}
          setShowSplash={setShowSplash}
          isScrolled={isScrolled}
          activeSection={activeSection}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          cart={cart}
          setIsCartOpen={setIsCartOpen}
          formData={formData}
          setFormData={setFormData}
          handleReservation={handleReservation}
          isSubmitting={isSubmitting}
          isSubmitted={isSubmitted}
          setIsSubmitted={setIsSubmitted}
          error={error}
          reviews={reviews}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          handleReviewSubmit={handleReviewSubmit}
          isSubmittingReview={isSubmittingReview}
          reviewSubmitted={reviewSubmitted}
          setSelectedItem={setSelectedItem}
          setHoveredItem={setHoveredItem}
          addToCart={addToCart}
          isGalleryOpen={isGalleryOpen}
          setIsGalleryOpen={setIsGalleryOpen}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />} />
      </Routes>

      {/* Shared UI: Cart Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            key="cart-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
          >
            <div 
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute top-0 right-0 bottom-0 w-full max-w-md z-[70] shadow-2xl flex flex-col border-l transition-colors duration-500 ${
                isDarkMode ? 'bg-[#1A1A1A] border-[#D4AF37]/10' : 'bg-white border-gray-100'
              }`}
            >
              <div className={`p-6 flex items-center justify-between border-b ${
                isDarkMode ? 'bg-[#1A1A1A] text-white border-white/5' : 'bg-[#701524] text-white border-transparent'
              }`}>
                <div className="flex items-center gap-3">
                  <ShoppingBag size={24} className="text-[#D4AF37]" />
                  <h2 className="text-xl font-serif font-bold">Your Pickup Order</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {orderComplete ? (
                  <div key="order-success" className="text-center py-20">
                    <div className="w-20 h-20 bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className={`text-2xl font-serif font-bold mb-4 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Order Confirmed!</h3>
                    <p className={isDarkMode ? 'text-[#A0A0A0]' : 'text-gray-600'}>Thank you for your order! We'll have it ready for pickup. See you soon at Maklouba House.</p>
                    <button 
                      onClick={() => {
                        setOrderComplete(false);
                        setIsCartOpen(false);
                      }}
                      className={`w-full py-4 font-bold rounded shadow-lg transition-all mt-8 ${
                        isDarkMode ? 'bg-[#D4AF37] text-[#1A1A1A] hover:bg-white' : 'bg-[#701524] text-white hover:bg-black'
                      }`}
                    >
                      CONTINUE BROWSING
                    </button>
                  </div>
                ) : cart.length === 0 ? (
                  <div key="empty-cart" className="text-center py-20">
                    <ShoppingBag size={64} className={`mx-auto mb-6 ${isDarkMode ? 'text-white/5' : 'text-gray-200'}`} />
                    <p className={`text-lg mb-8 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-gray-400'}`}>Your cart is empty.</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className={`px-8 py-3 font-bold rounded transition-all ${
                        isDarkMode ? 'bg-[#D4AF37] text-[#1A1A1A] hover:bg-white' : 'bg-[#701524] text-white hover:bg-black'
                      }`}
                    >
                      START ORDERING
                    </button>
                  </div>
                ) : (
                  <div key="cart-content" className="space-y-8">
                    <div className="space-y-4">
                      {cart.map((item: any) => (
                        <div key={item.id} className={`flex justify-between items-center py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <div>
                            <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>{item.name}</h4>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>${item.price}</p>
                          </div>
                          <div className={`flex items-center gap-4 rounded-lg px-3 py-1 border ${
                            isDarkMode ? 'bg-[#0A0A0A] border-[#D4AF37]/20' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <button onClick={() => updateQuantity(item.id, -1)} className={`font-bold ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>-</button>
                            <span className={`w-6 text-center font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className={`font-bold ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`pt-6 border-t-2 ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                      <div className="flex justify-between items-center mb-10">
                        <span className={`text-xl font-serif font-bold ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Total Amount</span>
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>${cartTotal.toFixed(2)}</span>
                      </div>

                      <form onSubmit={handleOrder} className="space-y-4">
                        <h4 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Pickup Details</h4>
                        <input 
                          required
                          placeholder="Your Full Name"
                          value={orderFormData.fullName}
                          onChange={(e) => setOrderFormData({...orderFormData, fullName: e.target.value})}
                          className={`w-full px-4 py-3 border rounded outline-none transition-all ${
                            isDarkMode 
                              ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-[#D4AF37] placeholder:text-white/20' 
                              : 'bg-gray-50 border-gray-200 text-[#1A1A1A] focus:border-[#701524] placeholder:text-gray-500'
                          }`}
                        />
                        <input 
                          required
                          type="tel"
                          placeholder="Phone Number"
                          value={orderFormData.phone}
                          onChange={(e) => setOrderFormData({...orderFormData, phone: e.target.value})}
                          className={`w-full px-4 py-3 border rounded outline-none transition-all ${
                            isDarkMode 
                              ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-[#D4AF37] placeholder:text-white/20' 
                              : 'bg-gray-50 border-gray-200 text-[#1A1A1A] focus:border-[#701524] placeholder:text-gray-500'
                          }`}
                        />
                        <div className="space-y-1">
                          <label className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Requested Pickup Time</label>
                          <select 
                            value={orderFormData.pickupTime}
                            onChange={(e) => setOrderFormData({...orderFormData, pickupTime: e.target.value})}
                            className={`w-full px-4 py-3 border rounded outline-none appearance-none ${
                              isDarkMode ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-[#D4AF37]' : 'bg-gray-50 border-gray-200 text-[#1A1A1A] focus:border-[#701524]'
                            }`}
                          >
                            {(() => {
                              const timeMap: any = { '15 min': 15, '30 min': 30, '1 hr': 60 };
                              const maxMinTime = Math.max(15, ...cart.map((i: any) => timeMap[i.minPickupTime] || 0));
                              
                              return [
                                { label: 'In 15 minutes', val: 15 },
                                { label: 'In 30 minutes', val: 30 },
                                { label: 'In 1 hour', val: 60 }
                              ].map(opt => (
                                <option key={opt.label} disabled={opt.val < maxMinTime} value={opt.label}>
                                  {opt.label} {opt.val < maxMinTime ? '(Unavailable for these items)' : ''}
                                </option>
                              ));
                            })()}
                          </select>
                          {(() => {
                            const timeMap: Record<string, number> = { '15 min': 15, '30 min': 30, '1 hr': 60 };
                            const maxTime = Math.max(15, ...cart.map((i: any) => timeMap[i.minPickupTime] || 0));
                            if (maxTime > 15) {
                              return <p className="text-[10px] text-amber-500 font-medium">Some items in your cart require at least {maxTime} minutes to prepare.</p>;
                            }
                            return null;
                          })()}
                        </div>
                        <textarea 
                          placeholder="Any special instructions for the chef?"
                          value={orderFormData.notes}
                          onChange={(e) => setOrderFormData({...orderFormData, notes: e.target.value})}
                          className={`w-full px-4 py-3 border rounded outline-none resize-none h-24 transition-all ${
                            isDarkMode 
                              ? 'bg-[#0A0A0A] border-white/10 text-white focus:border-[#D4AF37] placeholder:text-white/20' 
                              : 'bg-gray-50 border-gray-200 text-[#1A1A1A] focus:border-[#701524] placeholder:text-gray-500'
                          }`}
                        />
                        <button 
                          disabled={isOrdering}
                          className={`w-full py-4 font-bold rounded shadow-lg transition-all disabled:opacity-50 ${
                            isDarkMode ? 'bg-[#D4AF37] text-[#1A1A1A] hover:bg-white' : 'bg-[#701524] text-white hover:bg-black'
                          }`}
                        >
                          {isOrdering ? 'PLACING ORDER...' : `PLACE PICKUP ORDER - $${cartTotal.toFixed(2)}`}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared UI: Footer */}
      <footer className="bg-[#1A1A1A] text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-4 mb-8">
                <img 
                  src="/images/maklouba_house_branding_logo_1790434541805.jpg" 
                  alt="Maklouba House Logo" 
                  className="w-16 h-16 rounded-full border-2 border-[#D4AF37]"
                />
                <h2 className="text-4xl font-serif font-bold text-[#D4AF37]">Maklouba House</h2>
              </div>
              <p className="text-white/60 text-lg leading-relaxed max-w-md">
                Dedicated to preserving the rich culinary heritage of Palestine. We bring authentic flavors and traditional hospitality to the heart of Paterson, NJ.
              </p>
              <div className="flex gap-6 mt-10">
                <a href="https://www.tiktok.com/@maklouba.house" target="_blank" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#D4AF37] hover:border-[#D4AF37] transition-all">
                  <Music2 size={20} />
                </a>
                <a href="https://www.instagram.com/maklouba_house" target="_blank" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#D4AF37] hover:border-[#D4AF37] transition-all">
                  <Instagram size={20} />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-8 font-serif border-b border-[#D4AF37] pb-4 inline-block">Contact</h3>
              <ul className="space-y-6 text-white/70">
                <li className="flex items-start gap-4">
                  <MapPin className="text-[#D4AF37] shrink-0" size={20} />
                  <span>1068 Main St, Paterson, NJ 07503</span>
                </li>
                <li className="flex items-center gap-4">
                  <Phone className="text-[#D4AF37] shrink-0" size={20} />
                  <a href="tel:9733218611" className="hover:text-white transition-colors">(973) 321-8611</a>
                </li>
                <li className="flex items-center gap-4">
                  <Clock className="text-[#D4AF37] shrink-0" size={20} />
                  <span>Mon - Sun: 10AM - 10PM</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-8 font-serif border-b border-[#D4AF37] pb-4 inline-block">Quick Links</h3>
              <ul className="space-y-4 text-white/70">
                <li><Link to="/" className="hover:text-[#D4AF37] transition-colors">Home</Link></li>
                <li><Link to="/menu" className="hover:text-[#D4AF37] transition-colors">Our Menu</Link></li>
                <li><a href="#reservations" className="hover:text-[#D4AF37] transition-colors">Reservations</a></li>
                <li><Link to="/order" className="hover:text-[#D4AF37] transition-colors">Order Online</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 text-white/40 text-sm">
            <p>© {new Date().getFullYear()} Maklouba House. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Shared UI: Menu Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            key="item-modal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
          >
            <div 
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#1A1A1A] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] border border-[#D4AF37]/20"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all"
              >
                <X size={20} />
              </button>

              <div className="w-full md:w-1/2 h-64 md:h-auto bg-black/20">
                <img 
                  src={selectedItem.imageUrl || "/images/hero_maklouba_house_1790432903302.jpg"} 
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto text-left">
                <div className="mb-8">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-2 block">{selectedItem.category}</span>
                  <h2 className="text-4xl font-serif font-bold text-white mb-4">{selectedItem.name}</h2>
                  <div className="w-12 h-1 bg-[#D4AF37] mb-6" />
                  <p className="text-[#A0A0A0] text-lg leading-relaxed mb-8">
                    {selectedItem.description}
                  </p>
                  <span className="text-3xl font-mono font-bold text-[#D4AF37]">${selectedItem.price}</span>
                </div>

                <div className="mt-auto space-y-4">
                  <button 
                    onClick={() => {
                      addToCart(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="w-full py-5 bg-[#D4AF37] text-[#1A1A1A] font-bold rounded-xl hover:bg-white transition-all shadow-xl flex items-center justify-center gap-3 group"
                  >
                    <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                    ADD TO ORDER
                  </button>
                  <p className="text-center text-xs text-white/30">
                    Standard preparation time: 15-20 minutes
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function QualitySection({ isDarkMode }: { isDarkMode: boolean }) {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -350]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 350]);

  return (
    <section ref={containerRef} className={`py-16 md:py-32 overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-[#FDFCF0]'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4 md:mb-6">
              <div className="w-8 md:w-12 h-px bg-[#D4AF37]" />
              <p className="text-[#D4AF37] font-serif italic text-base md:text-xl tracking-wide">Cooked to perfection</p>
            </div>
            <h2 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif font-bold leading-[1.2] md:leading-tight mb-6 md:mb-8 ${isDarkMode ? 'text-white' : 'text-[#701524]'}`}>
              Fresh And Authentic <br />
              <span className="italic font-light">Cuisine</span> Made With The <br />
              Highest Quality Ingredients
            </h2>
            <div className="w-16 md:w-24 h-1 md:h-1.5 bg-[#D4AF37] mx-auto lg:mx-0" />
          </motion.div>

          <div className={`flex flex-col md:relative md:h-[700px] md:flex-row items-center justify-center mt-12 lg:mt-0 gap-6 md:gap-0`}>
            {/* Photo 1 */}
            <motion.div 
              style={{ y: isMobile ? 0 : y1 }}
              className="relative md:absolute md:right-0 md:top-0 w-full md:w-4/5 aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl z-0 border-4 border-white/5"
            >
              <img 
                src="/images/77cb2c6e-826f-4366-bb46-4eed2162b755.jpg" 
                alt="Maklouba House Kitchen" 
                className="w-full h-full object-cover"
                onError={(e: any) => e.target.src = "/images/menu_entrees_grill_1790432926196.jpg"}
              />
            </motion.div>

            {/* Photo 2 */}
            <motion.div 
              style={{ y: isMobile ? 0 : y2 }}
              className="relative md:absolute md:left-0 md:bottom-0 w-full md:w-3/4 aspect-square rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] z-10 border-4 border-white/10"
            >
              <img 
                src="/images/77dff7e9-7a0a-408e-8e7d-7270d3da7d5f.jpg" 
                alt="Beautiful Garden Seating" 
                className="w-full h-full object-cover"
                onError={(e: any) => e.target.src = "/images/hero_maklouba_house_1790432903302.jpg"}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home({ 
  showSplash, 
  setShowSplash, 
  isScrolled, 
  activeSection, 
  isMenuOpen, 
  setIsMenuOpen, 
  cart, 
  setIsCartOpen,
  formData,
  setFormData,
  handleReservation,
  isSubmitting,
  isSubmitted,
  setIsSubmitted,
  error,
  reviews,
  reviewForm,
  setReviewForm,
  handleReviewSubmit,
  isSubmittingReview,
  reviewSubmitted,
  selectedItem,
  setSelectedItem,
  setHoveredItem,
  addToCart,
  isGalleryOpen,
  setIsGalleryOpen,
  isDarkMode,
  setIsDarkMode
}: any) {

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4500); // 4.5 seconds splash
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen selection:bg-[#D4AF37] selection:text-white transition-colors duration-500 ${isDarkMode ? 'bg-[#0A0A0A] text-[#FDFCF0]' : 'bg-[#FDFCF0] text-[#1A1A1A]'}`}>
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
            className={`fixed inset-0 z-[100] flex items-center justify-center p-6 ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-[#701524]'}`}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="max-w-xl mx-auto mb-10"
              >
                <img 
                  src="/images/maklouba_house_branding_logo_1790434541805.jpg" 
                  alt="Maklouba House Logo" 
                  className="w-full h-auto rounded-full shadow-2xl border-4 border-[#D4AF37]"
                />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <h2 className="text-5xl md:text-7xl font-serif font-bold text-[#D4AF37] mb-4">Welcome to Maklouba House</h2>
                <div className="w-24 h-1.5 bg-[#D4AF37] mx-auto mb-8" />
                <p className="text-white/80 text-xl md:text-2xl uppercase tracking-[0.4em] animate-pulse">Authentic Taste of Palestine</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? (isDarkMode ? 'bg-[#0A0A0A]/95 backdrop-blur-md h-16 md:h-20 shadow-xl border-b border-white/5' : 'bg-[#701524]/95 backdrop-blur-md h-16 md:h-20 shadow-xl') 
          : 'bg-transparent h-20 md:h-28'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Zone 1: Brand */}
          <div className="flex items-center gap-4">
            <a href="#home" className="flex items-center gap-3 group">
              <motion.img 
                animate={{ scale: isScrolled ? 0.8 : 1 }}
                src="/images/maklouba_house_branding_logo_1790434541805.jpg" 
                alt="Logo" 
                className={`w-14 h-14 md:w-24 md:h-24 rounded-full border-2 border-[#D4AF37] group-hover:rotate-12 transition-transform shadow-2xl`}
              />
              <span className={`text-2xl md:text-3xl font-serif font-bold tracking-tight hidden sm:block transition-colors ${
                isScrolled ? (isDarkMode ? 'text-[#D4AF37]' : 'text-white') : 'text-white'
              }`}>
                Maklouba House
              </span>
            </a>
          </div>

          {/* Zone 2: Nav Links */}
          <div className={`hidden md:flex items-center gap-8 text-sm font-medium ${isDarkMode ? 'text-white' : (isScrolled ? 'text-white' : 'text-white')}`}>
            <a href="#home" className={`hover:text-[#D4AF37] transition-colors ${activeSection === 'home' ? 'text-[#D4AF37]' : ''}`}>Home</a>
            <Link to="/menu" className={`hover:text-[#D4AF37] transition-colors ${activeSection === 'menu' ? 'text-[#D4AF37]' : ''}`}>Menu</Link>
            <a href="#reservations" className={`hover:text-[#D4AF37] transition-colors ${activeSection === 'reservations' ? 'text-[#D4AF37]' : ''}`}>Book Table</a>
            <Link to="/order" className={`hover:text-[#D4AF37] transition-colors ${activeSection === 'delivery' ? 'text-[#D4AF37]' : ''}`}>Order Online</Link>
          </div>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-4 text-white">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-white/10 rounded-full transition-all text-[#D4AF37]"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-white/10 rounded transition-colors"
            >
              <ShoppingBag size={24} />
              {cart.length > 0 && (
                <span className={`absolute -top-1 -right-1 bg-[#D4AF37] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                  isDarkMode ? 'text-[#0A0A0A] border-[#0A0A0A]' : 'text-[#701524] border-[#701524]'
                }`}>
                  {cart.reduce((acc: number, i: any) => acc + i.quantity, 0)}
                </span>
              )}
            </button>
            <a 
              href="#reservations" 
              className={`hidden sm:block px-6 py-2.5 bg-[#D4AF37] font-bold rounded hover:bg-white transition-all text-sm uppercase tracking-wider ${
                isDarkMode ? 'text-[#0A0A0A]' : 'text-[#701524]'
              }`}
            >
              Reservation
            </a>
            <button 
              className="md:hidden p-2 hover:bg-white/10 rounded"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`md:hidden absolute top-20 left-0 right-0 border-t border-white/10 p-6 flex flex-col gap-4 shadow-xl text-white ${
                isDarkMode ? 'bg-[#0A0A0A]' : 'bg-[#701524]'
              }`}
            >
              <a href="#home" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium py-2 border-b border-white/5">Home</a>
              <Link to="/menu" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium py-2 border-b border-white/5">Menu</Link>
              <a href="#reservations" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium py-2 border-b border-white/5">Book Table</a>
              <Link to="/order" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium py-2 border-b border-white/5">Order Online</Link>
              <a href="#reservations" onClick={() => setIsMenuOpen(false)} className={`mt-4 w-full text-center py-4 bg-[#D4AF37] font-bold rounded ${
                isDarkMode ? 'text-[#0A0A0A]' : 'text-[#701524]'
              }`}>
                BOOK A TABLE
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section id="home" className="relative h-[100vh] flex items-center overflow-hidden -mt-20">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            <img 
              src="/images/hero_maklouba_house_1790432903302.jpg" 
              alt="Authentic Palestinian Maklouba" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/50 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
          </motion.div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-16 md:pt-0">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl text-white"
            >
              <span className="inline-block px-4 md:px-6 py-1.5 md:py-2 bg-[#D4AF37] text-[#0A0A0A] font-bold text-[10px] md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] mb-4 md:mb-8 rounded-sm">
                Authentic Palestinian Cuisine
              </span>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-serif font-bold mb-6 md:mb-8 leading-[1.1] md:leading-[1.05] text-wrap-balance"
              >
                The Heart of <br /><span className="text-[#D4AF37]">Palestine</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-base sm:text-lg md:text-3xl text-white/90 mb-8 md:mb-12 font-light leading-relaxed max-w-2xl"
              >
                Experience the tradition of Maklouba and authentic Arabic hospitality at Maklouba House.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-5"
              >
                <a 
                  href="#reservations" 
                  className="px-8 py-4 bg-[#D4AF37] text-[#0A0A0A] font-bold rounded flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-xl"
                >
                  <Calendar size={20} />
                  BOOK A TABLE
                </a>
                <Link 
                  to="/order" 
                  className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded flex items-center justify-center gap-3 hover:bg-white/20 transition-all shadow-xl"
                >
                  <Utensils size={20} />
                  VIEW OUR MENU
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60"
          >
            <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent" />
          </motion.div>
        </section>

        {/* Feature Highlights */}
        <section className={`py-24 transition-colors duration-500 ${isDarkMode ? 'bg-[#121212]' : 'bg-white/50'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.2 } }
              }}
              className="grid md:grid-cols-3 gap-12"
            >
              {[
                { icon: <MapPin size={28} />, title: "Visit Us", content: "1068 Main St, Paterson, NJ 07503", link: "https://maps.app.goo.gl/nYUYRgguxnJeeJZB6", linkText: "GET DIRECTIONS" },
                { icon: <Phone size={28} />, title: "Call Us", content: "(973) 321-8611", link: "tel:9733218611", linkText: "TAP TO CALL" },
                { icon: <Clock size={28} />, title: "Opening Hours", content: "Mon - Sun: 10:00 AM - 10:00 PM", badge: "OPEN NOW" }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)" }}
                  className={`flex flex-col items-center text-center p-8 rounded-xl border transition-all ${
                    isDarkMode ? 'bg-[#1A1A1A] border-[#D4AF37]/10' : 'bg-white border-[#701524]/10 shadow-xl'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg border ${
                    isDarkMode ? 'bg-[#1A1A1A] text-[#D4AF37] border-[#D4AF37]/20' : 'bg-[#701524] text-white border-transparent'
                  }`}>
                    {item.icon}
                  </div>
                  <h3 className={`text-xl font-bold mb-4 font-serif ${isDarkMode ? 'text-white' : 'text-[#701524]'}`}>{item.title}</h3>
                  <p className={isDarkMode ? 'text-[#A0A0A0]' : 'text-gray-600'}>{item.content}</p>
                  {item.link && (
                    <a href={item.link} target="_blank" className={`mt-4 font-bold text-sm flex items-center gap-1 hover:underline ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>
                      {item.linkText} <ExternalLink size={14} />
                    </a>
                  )}
                  {item.badge && (
                    <span className={`mt-4 font-bold text-xs px-3 py-1 rounded-full border ${
                      isDarkMode ? 'text-[#D4AF37] bg-[#1A1A1A] border-[#D4AF37]/20' : 'text-white bg-[#701524] border-transparent'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Brand Quality Parallax Section */}
        <QualitySection isDarkMode={isDarkMode} />

        {/* Menu Section */}
        <section id="menu" className={`py-20 md:py-32 transition-colors duration-500 ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-[#FDFCF0]'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <span className="text-[#D4AF37] font-bold text-sm tracking-[0.3em] uppercase mb-4 block">Visual Experience</span>
              <h2 className={`text-4xl sm:text-5xl md:text-7xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#701524]'}`}>Explore Our Menu</h2>
              <p className={`text-lg max-w-2xl mx-auto mb-10 font-light ${isDarkMode ? 'text-white/40' : 'text-gray-600'}`}>
                See the authentic dishes we prepare with love and tradition.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <button 
                  onClick={() => setIsGalleryOpen(true)}
                  className={`px-10 py-5 border-2 font-bold rounded-full flex items-center justify-center gap-3 transition-all shadow-xl uppercase tracking-widest ${
                    isDarkMode 
                      ? 'bg-white/5 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1A1A1A]' 
                      : 'bg-white border-[#701524] text-[#701524] hover:bg-[#701524] hover:text-white'
                  }`}
                >
                  <Utensils size={20} />
                  VIEW MENU IMAGES
                </button>
                <Link 
                  to="/order"
                  className={`px-10 py-5 font-bold rounded-full flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-xl uppercase tracking-widest border-2 ${
                    isDarkMode 
                      ? 'bg-[#D4AF37] text-[#0A0A0A] border-[#D4AF37]' 
                      : 'bg-[#701524] text-white border-[#701524]'
                  }`}
                >
                  <ShoppingBag size={20} />
                  ORDER ONLINE NOW
                </Link>
              </div>
            </motion.div>

            {/* Compact Preview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[
                "/images/679071e1-c5ab-49e3-a4ab-5b1003282df2.jpg",
                "/images/8f641255-c4ad-4d86-9657-08a10b8b5160.jpg",
                "/images/77cb2c6e-826f-4366-bb46-4eed2162b755.jpg",
                "/images/46cdaccc-840e-4062-b2b1-2cc7412c54ce.jpg"
              ].map((img, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setIsGalleryOpen(true)}
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/10"
                >
                  <img src={img} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Modal */}
        <AnimatePresence>
          {isGalleryOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 p-4 md:p-10"
            >
              <button 
                onClick={() => setIsGalleryOpen(false)}
                className="absolute top-6 right-6 text-white hover:text-[#D4AF37] transition-colors z-[2001]"
              >
                <X size={40} />
              </button>

              <div className="w-full h-full flex flex-col items-center justify-center gap-8">
                <div className="max-w-4xl w-full h-[70vh] relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto pr-4 custom-scrollbar">
                    {[
                      { title: "Premium Dining Hall", img: "/images/8f641255-c4ad-4d86-9657-08a10b8b5160.jpg" },
                      { title: "Garden Seating Area", img: "/images/77dff7e9-7a0a-408e-8e7d-7270d3da7d5f.jpg" },
                      { title: "Authentic Kitchen", img: "/images/77cb2c6e-826f-4366-bb46-4eed2162b755.jpg" },
                      { title: "Atmospheric Night View", img: "/images/679071e1-c5ab-49e3-a4ab-5b1003282df2.jpg" },
                      { title: "Maklouba House Exterior", img: "/images/6960ba77-634b-4a4b-8b83-4adbea49f28e.jpg" },
                      { title: "Entrance & Patio", img: "/images/46cdaccc-840e-4062-b2b1-2cc7412c54ce.jpg" }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10">
                          <img src={item.img} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[#D4AF37] font-serif text-xl font-bold">{item.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    to="/menu" 
                    onClick={() => setIsGalleryOpen(false)}
                    className="px-8 py-3 bg-[#D4AF37] text-[#1A1A1A] font-bold rounded-full"
                  >
                    VIEW FULL MENU (PDF)
                  </Link>
                  <Link 
                    to="/order" 
                    onClick={() => setIsGalleryOpen(false)}
                    className="px-8 py-3 bg-[#D4AF37] text-[#1A1A1A] font-bold rounded-full hover:bg-white transition-all"
                  >
                    GO TO ORDER PAGE
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delivery / Takeaway Section */}
        <section id="delivery" className={`py-32 overflow-hidden relative border-y transition-colors duration-500 ${isDarkMode ? 'bg-[#111111] border-white/5' : 'bg-[#701524] border-transparent'}`}>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none">
             <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#D4AF37_0%,_transparent_70%)] blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 text-white">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <span className="text-[#D4AF37] font-bold text-sm tracking-[0.3em] uppercase mb-6 block">Order Online</span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-8 leading-tight text-white">
                  Tastes Better at <span className="text-[#D4AF37]">Home</span>
                </h2>
                <p className="text-lg md:text-xl text-white/60 mb-12 leading-relaxed max-w-xl font-light">
                  Order through your favorite delivery platform and enjoy authentic Palestinian flavors delivered straight to your door.
                </p>
                
                  <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { name: 'DoorDash', icon: <ShoppingBag className="text-[#FF3008]" size={40} />, link: 'https://www.doordash.com/store/maqlouba-house-paterson-42310560/109388953/' },
                    { name: 'Grubhub', icon: <ShoppingBag className="text-[#F6343F]" size={40} />, link: 'https://www.grubhub.com/restaurant/maklouba-house-1068-main-street-paterson/15459256' },
                    { name: 'Uber Eats', icon: <ShoppingBag className="text-[#06C167]" size={40} />, link: 'https://www.ubereats.com/store-browse-uuid/6bd21af1-c3c8-583e-b5ca-bd1a67c44074' }
                  ].map((platform) => (
                    <motion.a 
                      key={platform.name}
                      whileHover={{ scale: 1.05 }}
                      href={platform.link} 
                      target="_blank"
                      className={`group p-6 rounded-xl flex flex-col items-center gap-4 transition-all shadow-lg border ${
                        isDarkMode ? 'bg-[#1A1A1A] border-white/5 hover:border-[#D4AF37]/50' : 'bg-white border-transparent shadow-xl'
                      }`}
                    >
                      <div className="h-12 flex items-center justify-center">
                        {platform.icon}
                      </div>
                      <span className={`font-bold text-sm transition-colors ${isDarkMode ? 'text-white group-hover:text-[#D4AF37]' : 'text-[#1A1A1A] group-hover:text-[#701524]'}`}>
                        {platform.name}
                      </span>
                    </motion.a>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative"
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-8 border-white/5 group">
                  <img 
                    src="/images/menu_entrees_grill_1790432926196.jpg" 
                    alt="Delivery Platter" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute -bottom-10 -left-10 bg-[#D4AF37] p-8 rounded-2xl shadow-xl hidden md:block"
                >
                  <p className={`font-bold text-4xl mb-1 italic ${isDarkMode ? 'text-[#0A0A0A]' : 'text-[#701524]'}`}>Fast & Fresh</p>
                  <p className={`font-medium uppercase tracking-widest text-xs ${isDarkMode ? 'text-[#0A0A0A]/70' : 'text-[#701524]/70'}`}>Delivery Paterson Area</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Reservations Section */}
        <section id="reservations" className={`py-32 transition-colors duration-500 ${isDarkMode ? 'bg-[#121212]' : 'bg-white/30'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="order-2 lg:order-1"
              >
                <div className={`aspect-[3/4] rounded-2xl overflow-hidden shadow-xl group border-4 ${isDarkMode ? 'border-[#D4AF37]/10' : 'border-[#701524]/10'}`}>
                  <img 
                    src="/images/8f641255-c4ad-4d86-9657-08a10b8b5160.jpg" 
                    alt="Restaurant Ambiance" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="order-1 lg:order-2"
                >
                <div className="mb-8 md:mb-12">
                  <h2 className={`text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-6 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Book a Table</h2>
                  <p className={`text-base md:text-lg leading-relaxed ${isDarkMode ? 'text-[#A0A0A0]' : 'text-gray-600'}`}>
                    Join us for an unforgettable dining experience. Whether it's a family gathering or an intimate dinner, we'll make sure you feel at home.
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {isSubmitted ? (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-green-900/20 border border-green-500/30 p-8 rounded-2xl text-center"
                    >
                      <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-2xl font-bold text-green-400 mb-2">Reservation Received!</h3>
                      <p className="text-green-100/70 mb-6">We've received your request and look forward to seeing you. We'll contact you if there are any issues.</p>
                      <button 
                        onClick={() => setIsSubmitted(false)}
                        className="text-[#D4AF37] font-bold hover:underline"
                      >
                        Make another reservation
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`p-8 md:p-10 rounded-3xl shadow-2xl border ${
                        isDarkMode ? 'bg-[#1A1A1A] border-[#D4AF37]/10' : 'bg-white border-[#701524]/10'
                      }`}
                    >
                      <form className="space-y-6" onSubmit={handleReservation}>
                        {error && (
                          <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded text-sm">
                            {error}
                          </div>
                        )}
                        <div className="grid sm:grid-cols-2 gap-6">
                          <div>
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Full Name</label>
                            <input 
                              required
                              type="text" 
                              placeholder="John Doe"
                              value={formData.fullName}
                              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                              className={`w-full px-5 py-4 border rounded outline-none transition-all placeholder:text-white/20 ${
                                isDarkMode ? 'bg-[#0A0A0A] border-[#D4AF37]/20 text-white focus:border-[#D4AF37]' : 'bg-gray-50 border-gray-200 text-[#1A1A1A] focus:border-[#701524]'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Phone Number</label>
                            <input 
                              required
                              type="tel" 
                              placeholder="(973) 555-0123"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              className={`w-full px-5 py-4 border rounded outline-none transition-all placeholder:text-white/20 ${
                                isDarkMode ? 'bg-[#0A0A0A] border-[#D4AF37]/20 text-white focus:border-[#D4AF37]' : 'bg-gray-50 border-gray-200 text-[#1A1A1A] focus:border-[#701524]'
                              }`}
                            />
                          </div>
                        </div>
                        
                        <div className="grid sm:grid-cols-3 gap-6">
                          <div>
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Guests</label>
                            <select 
                              value={formData.guests}
                              onChange={(e) => setFormData({...formData, guests: e.target.value})}
                              className={`w-full px-5 py-4 border rounded outline-none transition-all appearance-none ${
                                isDarkMode ? 'bg-[#0A0A0A] border-[#D4AF37]/20 text-white focus:border-[#D4AF37]' : 'bg-gray-50 border-gray-200 text-[#1A1A1A] focus:border-[#701524]'
                              }`}
                            >
                              <option>1 Person</option>
                              <option>2 People</option>
                              <option>4 People</option>
                              <option>6 People</option>
                              <option>8+ People</option>
                            </select>
                          </div>
                          <div>
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Date</label>
                            <input 
                              required
                              type="date" 
                              min={new Date().toISOString().split('T')[0]}
                              value={formData.date}
                              onChange={(e) => setFormData({...formData, date: e.target.value})}
                              className={`w-full px-5 py-4 border rounded outline-none transition-all ${
                                isDarkMode 
                                  ? 'bg-[#0A0A0A] border-[#D4AF37]/20 text-white focus:border-[#D4AF37] [color-scheme:dark]' 
                                  : 'bg-gray-50 border-gray-200 text-[#1A1A1A] focus:border-[#701524] [color-scheme:light]'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Smoking Area</label>
                            <select 
                              value={formData.smoking}
                              onChange={(e) => setFormData({...formData, smoking: e.target.value})}
                              className={`w-full px-5 py-4 border rounded outline-none transition-all appearance-none ${
                                isDarkMode ? 'bg-[#0A0A0A] border-[#D4AF37]/20 text-white focus:border-[#D4AF37]' : 'bg-gray-50 border-gray-200 text-[#1A1A1A] focus:border-[#701524]'
                              }`}
                            >
                              <option>Non-Smoking</option>
                              <option>Smoking Area</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Time</label>
                          <select 
                            value={formData.time}
                            onChange={(e) => setFormData({...formData, time: e.target.value})}
                            className={`w-full px-5 py-4 border rounded outline-none transition-all appearance-none ${
                              isDarkMode ? 'bg-[#0A0A0A] border-[#D4AF37]/20 text-white focus:border-[#D4AF37]' : 'bg-gray-50 border-gray-200 text-[#1A1A1A] focus:border-[#701524]'
                            }`}
                          >
                            {Array.from({ length: 25 }).map((_, i) => {
                              const hour = Math.floor(i / 2) + 10;
                              const minutes = i % 2 === 0 ? '00' : '30';
                              const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                              const ampm = hour >= 12 ? 'PM' : 'AM';
                              const timeStr = `${displayHour}:${minutes} ${ampm}`;
                              return <option key={timeStr} value={timeStr}>{timeStr}</option>;
                            })}
                          </select>
                        </div>

                        <div>
                          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Special Requests</label>
                          <textarea 
                            rows={4}
                            placeholder="Any allergies or special occasions?"
                            value={formData.requests}
                            onChange={(e) => setFormData({...formData, requests: e.target.value})}
                            className={`w-full px-5 py-4 border rounded outline-none transition-all resize-none placeholder:text-white/20 ${
                              isDarkMode ? 'bg-[#0A0A0A] border-[#D4AF37]/20 text-white focus:border-[#D4AF37]' : 'bg-gray-50 border-gray-200 text-[#1A1A1A] focus:border-[#701524]'
                            }`}
                          />
                        </div>

                        <button 
                          disabled={isSubmitting}
                          className={`w-full py-5 font-bold rounded transition-all shadow-lg flex items-center justify-center gap-3 ${
                            isDarkMode 
                              ? 'bg-[#D4AF37] text-[#1A1A1A] hover:bg-white' 
                              : 'bg-[#701524] text-white hover:bg-black'
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 size={20} className="animate-spin" />
                              PROCESSING...
                            </>
                          ) : (
                            <>
                              CONFIRM RESERVATION
                              <ArrowRight size={20} />
                            </>
                          )}
                        </button>
                        <p className={`text-center text-xs ${isDarkMode ? 'text-[#A0A0A0]' : 'text-gray-500'}`}>
                          Or call us directly at <a href="tel:9733218611" className={`font-bold ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>(973) 321-8611</a>
                        </p>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Social Media Feed Section */}
        <section className={`py-20 md:py-32 transition-colors duration-500 ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 md:mb-20">
              <h2 className={`text-4xl md:text-5xl font-serif font-bold mb-6 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Stay Connected</h2>
              <p className={`text-base md:text-lg max-w-2xl mx-auto mb-10 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-gray-600'}`}>
                Follow our journey, see our latest creations, and join the Maklouba House family on social media.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                <a 
                  href="https://www.tiktok.com/@maklouba.house" 
                  target="_blank"
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-black text-white rounded-full hover:scale-105 transition-transform"
                >
                  <Music2 size={24} />
                  <span className="font-bold">Follow on TikTok</span>
                </a>
                <a 
                  href="https://www.instagram.com/maklouba_house" 
                  target="_blank"
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-full hover:scale-105 transition-transform"
                >
                  <Instagram size={24} />
                  <span className="font-bold">Follow on Instagram</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "/images/77dff7e9-7a0a-408e-8e7d-7270d3da7d5f.jpg",
                "/images/679071e1-c5ab-49e3-a4ab-5b1003282df2.jpg",
                "/images/6960ba77-634b-4a4b-8b83-4adbea49f28e.jpg",
                "/images/46cdaccc-840e-4062-b2b1-2cc7412c54ce.jpg"
              ].map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden group relative">
                  <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Instagram className="text-white" size={32} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className={`py-32 overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#121212]' : 'bg-[#FDFCF0]'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-20">
              <div className="lg:col-span-2">
                <div className="mb-16">
                  <h2 className={`text-5xl font-serif font-bold mb-6 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>What Our Guests Say</h2>
                  <p className={`text-lg max-w-xl ${isDarkMode ? 'text-[#A0A0A0]' : 'text-gray-600'}`}>
                    Discover why food lovers from all over New Jersey come to Maklouba House for an authentic taste of Palestine.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {reviews.length > 0 ? (
                    reviews.map((review: any) => (
                      <motion.div 
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className={`p-8 rounded-2xl border shadow-sm transition-colors duration-500 ${
                          isDarkMode ? 'bg-[#1A1A1A] border-[#D4AF37]/10' : 'bg-white border-[#701524]/10 shadow-lg'
                        }`}
                      >
                        <div className="flex gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={16} 
                              className={i < review.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-300"} 
                            />
                          ))}
                        </div>
                        <p className={`mb-6 italic leading-relaxed ${isDarkMode ? 'text-[#FDFCF0]' : 'text-[#1A1A1A]'}`}>"{review.text}"</p>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 border rounded-full flex items-center justify-center font-bold text-sm ${
                            isDarkMode ? 'bg-[#1A1A1A] border-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#701524] border-transparent text-white'
                          }`}>
                            {review.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>{review.name}</p>
                            <p className="text-[10px] text-[#A0A0A0] uppercase tracking-widest">Verified Guest</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <>
                      {/* Placeholder highlights if no reviews yet */}
                      {[
                        { name: "Ahmad S.", rating: 5, text: "The Maklouba here is just like how my grandmother used to make it back in Ramallah. Truly authentic and delicious!" },
                        { name: "Sarah L.", rating: 5, text: "Best Middle Eastern food in Paterson. The mezze platter is huge and everything is fresh. Don't miss the lemon mint juice!" }
                      ].map((mock, i) => (
                        <div key={i} className={`p-8 rounded-2xl border shadow-sm transition-colors duration-500 ${
                          isDarkMode ? 'bg-[#1A1A1A] border-[#D4AF37]/10' : 'bg-white border-[#701524]/10 shadow-lg'
                        }`}>
                          <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} size={16} className="fill-[#D4AF37] text-[#D4AF37]" />
                            ))}
                          </div>
                          <p className={`mb-6 italic leading-relaxed ${isDarkMode ? 'text-[#FDFCF0]' : 'text-[#1A1A1A]'}`}>"{mock.text}"</p>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 border rounded-full flex items-center justify-center font-bold text-sm ${
                              isDarkMode ? 'bg-[#1A1A1A] border-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#701524] border-transparent text-white'
                            }`}>
                              {mock.name[0]}
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>{mock.name}</p>
                              <p className="text-[10px] text-[#A0A0A0] uppercase tracking-widest">Featured Review</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className={`p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden border transition-colors duration-500 ${
                  isDarkMode ? 'bg-[#1A1A1A] border-[#D4AF37]/10' : 'bg-[#701524] border-transparent'
                }`}>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-serif font-bold mb-6 text-[#D4AF37]">Rate Your Experience</h3>
                    <p className="text-white/70 mb-8 text-sm">Share your feedback and help us improve your next visit.</p>

                    <form onSubmit={handleReviewSubmit} className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-2">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                              className="p-1 transition-transform hover:scale-125"
                            >
                              <Star 
                                size={24} 
                                className={star <= reviewForm.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white/20"} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-2">Your Name</label>
                        <input
                          required
                          type="text"
                          placeholder="John Doe"
                          value={reviewForm.name}
                          onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                          className={`w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-white/30 ${
                            isDarkMode ? 'focus:border-[#D4AF37]' : 'focus:border-white'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-2">Review</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Tell us about your meal..."
                          value={reviewForm.text}
                          onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                          className={`w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-white/30 resize-none ${
                            isDarkMode ? 'focus:border-[#D4AF37]' : 'focus:border-white'
                          }`}
                        />
                      </div>

                      <button
                        disabled={isSubmittingReview}
                        className={`w-full py-4 font-bold rounded-lg hover:bg-white transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 ${
                          isDarkMode ? 'bg-[#D4AF37] text-[#0A0A0A]' : 'bg-white text-[#701524] hover:bg-black hover:text-white'
                        }`}
                      >
                        {isSubmittingReview ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : reviewSubmitted ? (
                          <>
                            <CheckCircle2 size={20} />
                            THANK YOU!
                          </>
                        ) : (
                          "SUBMIT REVIEW"
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Decorative background element */}
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Item Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div 
              key="item-modal-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
            >
              <div 
                onClick={() => setSelectedItem(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-[#1A1A1A] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] border border-[#D4AF37]/20"
              >
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all"
                >
                  <X size={20} />
                </button>

                <div className="w-full md:w-1/2 h-64 md:h-auto bg-black/20">
                  <img 
                    src={selectedItem.imageUrl || "/images/hero_maklouba_house_1790432903302.jpg"} 
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto text-left">
                  <div className="mb-8">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-2 block">{selectedItem.category}</span>
                    <h2 className="text-4xl font-serif font-bold text-white mb-4">{selectedItem.name}</h2>
                    <div className="w-12 h-1 bg-[#D4AF37] mb-6" />
                    <p className="text-[#A0A0A0] text-lg leading-relaxed mb-8">
                      {selectedItem.description}
                    </p>
                    <span className="text-3xl font-mono font-bold text-[#D4AF37]">${selectedItem.price}</span>
                  </div>

                  <div className="mt-auto space-y-4">
                    <button 
                      onClick={() => {
                        addToCart(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="w-full py-5 bg-[#D4AF37] text-[#1A1A1A] font-bold rounded-xl hover:bg-white transition-all shadow-xl flex items-center justify-center gap-3 group"
                    >
                      <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                      ADD TO ORDER
                    </button>
                    <p className="text-center text-xs text-white/30">
                      Standard preparation time: 15-20 minutes
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
