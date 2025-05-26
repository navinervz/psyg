import React from 'react';
import { Instagram, MessageCircle, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-16 py-8 px-6 rounded-2xl bg-black/80 backdrop-blur-xl border border-[#39ff14]/20 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#39ff14]/5 rounded-full blur-3xl"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-bold text-[#39ff14] mb-4">درباره سای جی</h3>
          <p className="text-gray-300 text-sm mb-4">
            سای جی، مرجع خرید آسان سرویس‌های آنلاین، با ارائه خدمات متنوع و پشتیبانی 24 ساعته در خدمت شماست.
          </p>
          <div className="flex space-x-4 rtl:space-x-reverse">
            <a href="https://www.instagram.com/psygstore" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#39ff14] transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://t.me/Psygsupport" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#39ff14] transition-colors">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-[#39ff14] mb-4">لینک‌های سریع</h3>
          <ul className="space-y-2">
            <li>
              <a href="/articles" className="text-gray-300 hover:text-[#39ff14] transition-colors text-sm">
                مقالات آموزشی
              </a>
            </li>
            <li>
              <a href="/faq" className="text-gray-300 hover:text-[#39ff14] transition-colors text-sm">
                سوالات متداول
              </a>
            </li>
            <li>
              <a href="/contact" className="text-gray-300 hover:text-[#39ff14] transition-colors text-sm">
                تماس با ما
              </a>
            </li>
            <li>
              <a href="/terms" className="text-gray-300 hover:text-[#39ff14] transition-colors text-sm">
                قوانین و مقررات
              </a>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-[#39ff14] mb-4">پشتیبانی</h3>
          <p className="text-gray-300 text-sm mb-4">
            پشتیبانی 24 ساعته، 7 روز هفته از طریق تلگرام
          </p>
          <a 
            href="https://t.me/Psygsupport" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center bg-gradient-to-r from-[#004d00] to-[#39ff14] text-black py-2 px-4 rounded-xl font-bold transition-all hover:shadow-[0_0_15px_rgba(57,255,20,0.4)]"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            پشتیبانی آنلاین
          </a>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-[#39ff14]/20 text-center">
        <p className="text-gray-400 text-sm flex items-center justify-center">
          ساخته شده با <Heart className="w-4 h-4 mx-1 text-red-500" /> توسط تیم سای جی - تمامی حقوق محفوظ است © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default Footer;