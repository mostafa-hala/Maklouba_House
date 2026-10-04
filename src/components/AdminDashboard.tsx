/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  db, auth 
} from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  setDoc,
  getDocs
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Calendar, 
  Utensils, 
  Star, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Plus,
  Trash2,
  Edit,
  Save,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { menu as initialMenu } from '../data/menu';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Data states
  const [orders, setOrders] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Add Item state
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    customCategory: '',
    price: '',
    description: '',
    imageUrl: '',
    minPickupTime: '15 min'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Real-time listeners
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (s) => {
      setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Admin orders listener error:", err);
    });

    const unsubRes = onSnapshot(query(collection(db, 'reservations'), orderBy('createdAt', 'desc')), (s) => {
      setReservations(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Admin reservations listener error:", err);
    });
    const unsubReviews = onSnapshot(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')), (s) => {
      setReviews(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Admin reviews listener error:", err);
    });
    const unsubMenu = onSnapshot(collection(db, 'menu'), (s) => {
      setMenuItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Admin menu listener error:", err);
    });

    return () => {
      unsubOrders();
      unsubRes();
      unsubReviews();
      unsubMenu();
    };
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const category = newItem.category === 'new' ? newItem.customCategory : newItem.category;
      if (!category) return alert('Please specify a category');

      const itemData = {
        name: newItem.name || '',
        category: category || '',
        price: newItem.price || '',
        description: newItem.description || '',
        imageUrl: newItem.imageUrl || '',
        minPickupTime: newItem.minPickupTime || '15 min',
        available: true
      };

      if (editingId) {
        await updateDoc(doc(db, 'menu', editingId), itemData);
      } else {
        await addDoc(collection(db, 'menu'), itemData);
      }

      setNewItem({
        name: '',
        category: '',
        customCategory: '',
        price: '',
        description: '',
        imageUrl: '',
        minPickupTime: '15 min'
      });
      setShowAddItem(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save item');
    }
  };

  const startEditing = (item: any) => {
    setNewItem({
      name: item.name || '',
      category: item.category || '',
      customCategory: '',
      price: item.price || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      minPickupTime: item.minPickupTime === 'ASAP' ? '15 min' : (item.minPickupTime || '15 min')
    });
    setEditingId(item.id);
    setShowAddItem(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Please select an image under 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1000; 
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setNewItem({ ...newItem, imageUrl: compressedDataUrl });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const seedMenu = async () => {
    try {
      for (const section of initialMenu) {
        for (const item of section.items) {
          await addDoc(collection(db, 'menu'), {
            ...item,
            category: section.title,
            available: true
          });
        }
      }
      alert('Menu seeded successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'menu', id), { available: !current });
  };

  const getItemStats = () => {
    const stats: { [key: string]: { count: number, revenue: number } } = {};
    orders.forEach(order => {
      order.items?.forEach((item: any) => {
        if (!stats[item.name]) stats[item.name] = { count: 0, revenue: 0 };
        const qty = item.quantity || 1;
        stats[item.name].count += qty;
        stats[item.name].revenue += (parseFloat(item.price) * qty);
      });
    });
    return Object.entries(stats)
      .sort(([, a], [, b]) => b.count - a.count);
  };

  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalItemsSold = orders.reduce((acc, o) => acc + (o.items?.reduce((a: number, i: any) => a + (i.quantity || 1), 0) || 0), 0);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'menu', itemToDelete));
      setItemToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert('Failed to delete item. Please check your permissions.');
      setItemToDelete(null);
    }
  };

  const deleteItem = (id: string) => {
    if (!id) return;
    setItemToDelete(id);
  };

  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items?.map((item: any) => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
        <span>${item.quantity}x ${item.name}</span>
        <span>$${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt - ${order.fullName}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; width: 300px; margin: 0 auto; color: #000; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .total { font-size: 18px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 10px; }
            .footer { text-align: center; font-size: 12px; margin-top: 20px; }
            @media print { body { width: 100%; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0;">MAKLOUBA HOUSE</h2>
            <p style="margin: 5px 0;">1068 Main St, Paterson, NJ</p>
            <p style="margin: 5px 0;">(973) 321-8611</p>
          </div>
          <div class="section">
            <p><strong>Order ID:</strong> ${order.id.slice(-6).toUpperCase()}</p>
            <p><strong>Customer:</strong> ${order.fullName}</p>
            <p><strong>Phone:</strong> ${order.phone}</p>
            <p><strong>Type:</strong> ${order.pickupTime} Pickup</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt?.seconds * 1000).toLocaleString()}</p>
          </div>
          <div class="section">
            <strong>ITEMS:</strong>
            <div style="margin-top: 10px;">${itemsHtml}</div>
          </div>
          <div class="section">
            <div class="total">
              <span>TOTAL</span>
              <span>$${order.total?.toFixed(2)}</span>
            </div>
          </div>
          ${order.notes ? `<div class="section"><strong>NOTES:</strong><br/>${order.notes}</div>` : ''}
          <div class="footer">
            <p>Shukran for ordering from Maklouba House!</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#701524] text-white">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#701524] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md"
        >
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-[#701524] mb-2">Staff Portal</h1>
            <p className="text-gray-500 text-sm md:text-base">Sign in to manage Maklouba House</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {authError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">{authError}</div>}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#701524] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#701524] outline-none"
                required
              />
            </div>
            <button className="w-full py-4 bg-[#701524] text-white font-bold rounded-lg shadow-lg hover:bg-[#5a111d] transition-all text-sm">
              LOGIN TO DASHBOARD
            </button>
          </form>
          <div className="mt-8 text-center text-[10px] md:text-xs text-gray-400">
            <p>Don't have an account? Ask your manager to create one in Firebase Console.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const navigation = [
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.filter(o => !o.completed).length },
    { id: 'reservations', label: 'Reservations', icon: Calendar, count: reservations.length },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'menu', label: 'Menu Management', icon: Utensils },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#701524] text-white sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#D4AF37] rounded-full" />
          <h2 className="text-lg font-display font-bold text-[#D4AF37]">Staff Panel</h2>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-lg"
        >
          {isSidebarOpen ? <LogOut size={24} className="rotate-90" /> : <LayoutDashboard size={24} />}
        </button>
      </div>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.div 
            initial={window.innerWidth < 768 ? { x: -300 } : false}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-[#701524] text-white flex flex-col p-6 z-[110] md:z-0 shadow-2xl md:shadow-none ${!isSidebarOpen && 'hidden md:flex'}`}
          >
            <div className="hidden md:flex mb-12 items-center gap-3">
              <div className="w-10 h-10 bg-[#D4AF37] rounded-full" />
              <h2 className="text-xl font-display font-bold text-[#D4AF37]">Staff Panel</h2>
            </div>

            <nav className="flex-1 space-y-2">
              {navigation.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-[#D4AF37] text-[#701524]' : 'hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon size={20} />
                    <span className="font-bold text-sm md:text-base">{tab.label}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-[#701524] text-white' : 'bg-[#D4AF37] text-[#701524]'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <button 
              onClick={() => signOut(auth)}
              className="mt-auto flex items-center gap-3 p-4 hover:bg-red-500/20 rounded-xl transition-all text-white/60 hover:text-white"
            >
              <LogOut size={20} />
              <span className="font-bold">Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[105] md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-[#701524] capitalize">{activeTab}</h1>
            <p className="text-sm md:text-base text-gray-500">Real-time management for Maklouba House</p>
          </div>
          {activeTab === 'menu' && (
            <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
              {menuItems.length === 0 && (
                <button onClick={seedMenu} className="flex-1 md:flex-none px-4 py-2 bg-white text-[#701524] border border-[#701524] font-bold rounded shadow-sm hover:bg-gray-50 transition-all text-xs md:text-sm">
                  Seed Menu
                </button>
              )}
              <button 
                onClick={() => {
                  setEditingId(null);
                  setNewItem({ name: '', category: '', customCategory: '', price: '', description: '', imageUrl: '', minPickupTime: '15 min' });
                  setShowAddItem(true);
                }}
                className="flex-1 md:flex-none px-4 py-2 bg-[#D4AF37] text-[#701524] font-bold rounded shadow-lg flex items-center justify-center gap-2 hover:bg-[#b8982f] transition-all text-xs md:text-sm"
              >
                <Plus size={18} /> Add Item
              </button>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div key="orders-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {orders.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                  <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400">No orders received yet.</p>
                </div>
              )}
              {orders.map(order => (
                <div key={order.id} className={`p-4 md:p-6 rounded-2xl bg-white shadow-sm border-l-4 md:border-l-8 ${order.completed ? 'border-gray-200' : 'border-[#D4AF37]'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">{order.pickupTime} Pickup</span>
                      <h3 className="text-lg md:text-xl font-bold">{order.fullName}</h3>
                      <p className="text-sm text-gray-500">{order.phone}</p>
                    </div>
                    <div className="sm:text-right w-full sm:w-auto">
                      <p className="text-lg font-bold text-[#701524]">${order.total?.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400">{new Date(order.createdAt?.seconds * 1000).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6 border-y border-gray-50 py-4">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="flex-1">{item.quantity}x {item.name}</span>
                        <span className="font-mono text-gray-400 ml-4">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {order.notes && <div className="p-3 bg-gray-50 rounded italic text-xs mb-6 border border-gray-100">"{order.notes}"</div>}
                  <div className="flex flex-wrap gap-2">
                    {!order.completed && (
                      <button 
                        onClick={() => updateDoc(doc(db, 'orders', order.id), { completed: true })}
                        className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
                      >
                        <CheckCircle2 size={16} /> Complete
                      </button>
                    )}
                    <button 
                      onClick={() => handlePrint(order)}
                      className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-[#D4AF37] text-[#1A1A1A] font-bold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-white transition-all"
                    >
                      <Printer size={16} /> Print Receipt
                    </button>
                    <button 
                      onClick={() => deleteDoc(doc(db, 'orders', order.id))}
                      className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-red-50 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'reservations' && (
            <motion.div key="res-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-[#701524] text-white">
                  <tr>
                    <th className="p-4 md:p-6 text-sm">Guest</th>
                    <th className="p-4 md:p-6 text-sm">Details</th>
                    <th className="p-4 md:p-6 text-sm">Date/Time</th>
                    <th className="p-4 md:p-6 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations.map(res => (
                    <tr key={res.id} className="hover:bg-gray-50 transition-all">
                      <td className="p-4 md:p-6">
                        <p className="font-bold text-sm md:text-base">{res.fullName}</p>
                        <p className="text-xs text-gray-500">{res.phone}</p>
                      </td>
                      <td className="p-4 md:p-6">
                        <div className="flex gap-2 mb-2">
                          <span className="px-2 md:px-3 py-1 bg-[#D4AF37]/20 text-[#701524] text-[10px] md:text-xs font-bold rounded-full">
                            {res.guests} G
                          </span>
                          <span className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold rounded-full ${res.smoking === 'Smoking Area' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                            {res.smoking || 'Non-Smoking'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 md:p-6">
                        <p className="font-bold text-xs md:text-sm">{res.date}</p>
                        <p className="text-[10px] text-gray-500">{res.time}</p>
                      </td>
                      <td className="p-4 md:p-6 text-center">
                        <button 
                          onClick={() => deleteDoc(doc(db, 'reservations', res.id))}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div key="insights-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-[#701524]">
                  <div className="flex items-center gap-3 mb-2 text-gray-400">
                    <TrendingUp size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Revenue</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-[#701524]">${totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-[#D4AF37]">
                  <div className="flex items-center gap-3 mb-2 text-gray-400">
                    <ShoppingBag size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Orders</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-[#701524]">{orders.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-[#701524]">
                  <div className="flex items-center gap-3 mb-2 text-gray-400">
                    <Utensils size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Sold</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-[#701524]">{totalItemsSold}</h3>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-lg md:text-xl font-bold text-[#701524]">Best Selling Items</h2>
                  <BarChart3 className="text-[#D4AF37]" size={24} />
                </div>
                <div className="space-y-6">
                  {getItemStats().length === 0 ? (
                    <p className="text-gray-400 text-center py-10">Waiting for data...</p>
                  ) : (
                    getItemStats().map(([name, stat], idx) => (
                      <div key={name} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#D4AF37] w-4">#{idx + 1}</span>
                            <span className="font-bold text-gray-800 text-sm">{name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-[#701524]">{stat.count} sold</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(stat.count / Math.max(...getItemStats().map(([, s]) => s.count))) * 100}%` }}
                            className="h-full bg-[#701524]/20 border-r-2 border-[#701524]"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'menu' && (
            <motion.div key="menu-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
              <AnimatePresence>
                {showAddItem && (
                  <motion.div 
                    key="add-item-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-10 bg-white p-4 md:p-8 rounded-2xl shadow-md border-2 border-[#D4AF37]/30 overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg md:text-xl font-bold text-[#701524]">{editingId ? 'Edit Item' : 'Add Item'}</h2>
                      <button onClick={() => { setShowAddItem(false); setEditingId(null); }} className="text-gray-400 hover:text-red-500"><XCircle size={24} /></button>
                    </div>
                    <form onSubmit={handleSaveItem} className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Item Name</label>
                          <input 
                            type="text" 
                            required
                            value={newItem.name}
                            onChange={e => setNewItem({...newItem, name: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Category</label>
                          <select 
                            value={newItem.category}
                            onChange={e => setNewItem({...newItem, category: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          >
                            <option value="">Select Category</option>
                            {Array.from(new Set(menuItems.map(m => m.category))).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="new">+ New Category</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Price ($)</label>
                          <input 
                            type="text" 
                            required
                            value={newItem.price}
                            onChange={e => setNewItem({...newItem, price: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Min. Pickup Time</label>
                          <select 
                            value={newItem.minPickupTime}
                            onChange={e => setNewItem({...newItem, minPickupTime: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          >
                            <option value="15 min">15 Minutes</option>
                            <option value="30 min">30 Minutes</option>
                            <option value="1 hr">1 Hour</option>
                            <option value="2 hr">2 Hours</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Image Upload</label>
                          <div className="flex flex-col gap-3">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleFileChange}
                              className="w-full text-[10px] text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#701524]/10 file:text-[#701524] hover:file:bg-[#701524]/20"
                            />
                            {newItem.imageUrl && (
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                <img src={newItem.imageUrl} className="w-full h-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => setNewItem({ ...newItem, imageUrl: '' })}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Description</label>
                          <textarea 
                            rows={3}
                            value={newItem.description}
                            onChange={e => setNewItem({...newItem, description: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full py-4 bg-[#701524] text-white font-bold rounded-lg shadow-lg text-sm"
                        >
                          <Save size={18} className="inline mr-2" /> {editingId ? 'UPDATE' : 'SAVE'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {Array.from(new Set(menuItems.map(m => m.category))).map(cat => (
                <div key={`cat-${cat}`} className="space-y-4">
                  <h2 className="text-lg font-bold text-[#701524] border-b border-[#D4AF37] pb-2">{cat}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {menuItems.filter(m => m.category === cat).map(item => (
                      <div key={`item-${item.id}`} className={`p-4 bg-white rounded-xl shadow-sm border ${item.available ? 'border-gray-100' : 'border-red-200 opacity-60'}`}>
                        {item.imageUrl && (
                          <div className="aspect-video w-full rounded-lg overflow-hidden mb-3 relative group">
                            <img src={item.imageUrl} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-sm">{item.name}</h3>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                              <Clock size={10} /> Min: {item.minPickupTime || '15 min'}
                            </span>
                          </div>
                          <span className="font-mono text-[#701524] text-sm">${item.price}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mb-4 line-clamp-1">{item.description}</p>
                        <div className="flex gap-2 mt-4">
                          <button 
                            onClick={() => toggleAvailability(item.id, item.available)}
                            className={`flex-1 text-[10px] font-bold py-2 rounded uppercase tracking-wider ${item.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                          >
                            {item.available ? 'Available' : 'Sold Out'}
                          </button>
                          <button onClick={() => startEditing(item)} className="p-2 bg-gray-50 text-gray-400 rounded"><Edit size={14} /></button>
                          <button onClick={() => deleteItem(item.id)} className="p-2 bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div key="reviews-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {reviews.map(review => (
                <div key={review.id} className="p-4 md:p-6 bg-white rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-200"} />
                      ))}
                    </div>
                  </div>
                  <p className="italic text-gray-700 text-xs md:text-sm mb-4">"{review.text}"</p>
                  <p className="font-bold text-xs">{review.name}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
              <h3 className="text-xl font-bold text-[#701524] mb-4">Delete Item?</h3>
              <div className="flex gap-4">
                <button onClick={() => setItemToDelete(null)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-sm">CANCEL</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm">DELETE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
