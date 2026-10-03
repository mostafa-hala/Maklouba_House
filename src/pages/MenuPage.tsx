
import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MenuPage({ isDarkMode }: any) {
  const menuPages = [
    "/images/menu_pdf_page_1.png",
    "/images/menu_pdf_page_2.png"
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0A0A0A] text-white' : 'bg-[#FDFCF0] text-[#1A1A1A]'}`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 h-20 shadow-xl flex items-center px-6 ${isDarkMode ? 'bg-[#0A0A0A] border-b border-white/5' : 'bg-[#701524]'}`}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[#D4AF37] font-bold hover:text-white transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            BACK TO HOME
          </Link>
          <h1 className="text-xl md:text-2xl font-display font-bold text-white">Our Full Menu</h1>
          <a 
            href="/menu.pdf" 
            download
            className={`hidden sm:flex items-center gap-2 px-4 py-2 bg-[#D4AF37] font-bold rounded-lg hover:bg-white transition-all text-xs ${isDarkMode ? 'text-[#1A1A1A]' : 'text-[#701524]'}`}
          >
            <Download size={16} />
            DOWNLOAD PDF
          </a>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-4 flex flex-col items-center gap-12 max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <p className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm mb-2 text-glow-gold">Digital Menu</p>
          <h2 className={`text-3xl md:text-5xl font-display font-bold mb-4 text-glow-gold ${isDarkMode ? 'text-white' : 'text-[#701524]'}`}>Authentic Flavors</h2>
          <div className="w-24 h-1 bg-[#D4AF37] mx-auto shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
        </div>

        {menuPages.map((page, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2 }}
            className={`w-full rounded-lg shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-[#1A1A1A] border-[#D4AF37]/10' : 'bg-white border-gray-200'}`}
          >
            <img 
              src={page} 
              alt={`Menu Page ${idx + 1}`} 
              className="w-full h-auto"
              onError={(e: any) => {
                e.target.src = `https://via.placeholder.com/1200x1600/${isDarkMode ? '1A1A1A' : 'FFFFFF'}/${isDarkMode ? 'D4AF37' : '701524'}?text=Menu+Page+` + (idx + 1);
              }}
            />
          </motion.div>
        ))}

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className={`text-center p-12 rounded-3xl w-full border ${isDarkMode ? 'bg-[#1A1A1A] border-[#D4AF37]/20' : 'bg-[#701524] border-transparent'}`}
        >
          <h2 className="text-3xl font-serif font-bold text-[#D4AF37] mb-6">Ready to Order?</h2>
          <p className={`mb-8 max-w-xl mx-auto font-light ${isDarkMode ? 'text-white/80' : 'text-white/90'}`}>Enjoy our authentic flavors delivered straight to your door or ready for pickup from our Paterson location.</p>
          <Link 
            to="/order"
            className={`px-10 py-5 bg-[#D4AF37] font-bold rounded-full hover:scale-105 transition-transform inline-block shadow-2xl uppercase tracking-widest ${isDarkMode ? 'text-[#1A1A1A]' : 'text-[#701524]'}`}
          >
            ORDER ONLINE NOW
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
