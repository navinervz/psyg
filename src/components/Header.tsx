import React, { useState } from 'react';
import { Zap, Search } from 'lucide-react';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
  };

  return (
    <header className="text-center mb-10 pt-8 relative z-10">
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
        فروشگاه <span className="text-[#39ff14] text-shadow-neon">سای جی</span>
      </h1>
      <p className="text-xl md:text-2xl text-[#39ff14] text-shadow-sm">
        مرجع خرید آسان سرویس‌های آنلاین
      </p>
      <div className="flex justify-center mt-6">
        <nav className="bg-black/40 backdrop-blur-md rounded-full border border-[#39ff14]/20 p-2 inline-flex items-center">
          <a href="/" className="px-4 py-2 text-[#39ff14] hover:bg-[#39ff14]/10 rounded-full transition-all">
            خانه
          </a>
          <a href="/articles" className="px-4 py-2 text-white hover:text-[#39ff14] hover:bg-[#39ff14]/10 rounded-full transition-all">
            مقالات آموزشی
          </a>
          <a href="/faq" className="px-4 py-2 text-white hover:text-[#39ff14] hover:bg-[#39ff14]/10 rounded-full transition-all">
            سوالات متداول
          </a>
          <form onSubmit={handleSearch} className="relative ml-2">
            <input
              type="text"
              placeholder="جستجو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/30 border border-[#39ff14]/20 rounded-full py-2 px-4 pl-10 text-white text-sm focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all w-[200px]"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#39ff14] w-4 h-4" />
          </form>
        </nav>
      </div>
    </header>
  );
};

export default Header;