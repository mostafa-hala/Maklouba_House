
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrderPage({ liveMenu, addToCart, cart, setIsCartOpen, isScrolled, setSelectedItem, isDarkMode }: any) {
  const [hoveredItem, setHoveredItem] = useState<any>(null);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0A0A0A] text-[#FDFCF0]' : 'bg-[#FDFCF0] text-[#1A1A1A]'}`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 h-20 shadow-xl ${isDarkMode ? 'bg-[#0A0A0A] border-b border-white/5' : 'bg-[#701524]'}`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[#D4AF37] font-bold hover:text-white transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            BACK TO HOME
          </Link>
          <div className="flex items-center gap-4">
             <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <ShoppingBag size={24} />
              {cart.length > 0 && (
                <span className={`absolute -top-1 -right-1 bg-[#D4AF37] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                  isDarkMode ? 'text-[#0A0A0A] border-[#0A0A0A]' : 'text-[#701524] border-[#701524]'
                }`}>
                  {cart.reduce((acc: any, i: any) => acc + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-20 text-center">
            <h1 className={`text-5xl md:text-7xl font-serif font-bold mb-6 ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>Order Online</h1>
            <p className={`text-lg max-w-2xl mx-auto font-light ${isDarkMode ? 'text-white/60' : 'text-[#666666]'}`}>Select your favorite dishes and we'll have them ready for pickup.</p>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto mt-8" />
          </header>

          <div className="grid lg:grid-cols-2 gap-x-24 gap-y-32">
            {liveMenu.map((section: any, sIdx: number) => (
              <motion.div 
                key={section.title} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <h3 className={`text-3xl md:text-4xl font-serif font-bold mb-12 border-b pb-4 ${
                  isDarkMode ? 'text-[#D4AF37] border-[#D4AF37]/20' : 'text-[#701524] border-[#D4AF37]/20'
                }`}>{section.title}</h3>
                <div className="space-y-10">
                  {section.items.map((item: any) => (
                    <div 
                      key={item.id || item.name} 
                      className={`group relative cursor-pointer ${!item.available ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-4 mb-2">
                        <div className="flex items-center gap-3">
                          <h4 className={`text-xl font-bold transition-colors ${
                            isDarkMode ? 'text-white group-hover:text-[#D4AF37]' : 'text-[#1A1A1A] group-hover:text-[#701524]'
                          }`}>{item.name}</h4>
                          {item.imageUrl && (
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D4AF37]/30 shadow-sm">
                              <img src={item.imageUrl} className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`font-mono text-lg font-bold tabular-nums ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>${item.price}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item);
                            }}
                            className={`text-xs font-bold transition-all uppercase tracking-widest px-4 py-2 rounded-full shadow-md active:scale-95 ${
                              isDarkMode ? 'bg-[#D4AF37] text-[#0A0A0A] hover:bg-white' : 'bg-[#701524] text-white hover:bg-[#D4AF37] hover:text-[#701524]'
                            }`}
                          >
                            Add +
                          </button>
                        </div>
                      </div>
                      {item.description && (
                        <p className={`text-sm leading-relaxed italic line-clamp-2 ${isDarkMode ? 'text-white/40' : 'text-[#666666]'}`}>{item.description}</p>
                      )}

                      {/* Hover Preview Pop-up */}
                      <AnimatePresence>
                        {hoveredItem?.id === item.id && item.imageUrl && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`absolute z-[100] left-0 -top-40 md:-left-4 md:top-auto md:bottom-full mb-4 w-48 p-2 rounded-xl shadow-2xl border pointer-events-none ${
                              isDarkMode ? 'bg-[#1A1A1A] border-[#D4AF37]/30' : 'bg-white border-[#D4AF37]/30'
                            }`}
                          >
                            <div className="aspect-square rounded-lg overflow-hidden mb-2">
                              <img src={item.imageUrl} className="w-full h-full object-cover" />
                            </div>
                            <p className={`text-[10px] font-bold px-1 uppercase tracking-widest text-center truncate ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#701524]'}`}>{item.name}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
