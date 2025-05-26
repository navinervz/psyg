import React, { useState } from 'react';
import Header from '../components/Header';
import LEDBoard from '../components/LEDBoard';
import ProductCard from '../components/ProductCard';
import ArticlePreview from '../components/ArticlePreview';
import Footer from '../components/Footer';
import ShoppingCartBubble from '../components/ShoppingCartBubble';
import DashboardBubble from '../components/DashboardBubble';
import ShoppingCartModal from '../components/ShoppingCartModal';
import DashboardModal from '../components/DashboardModal';
import { MessageSquare, Music, Bot } from 'lucide-react';

const HomePage: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const featuredArticles = [
    {
      id: 'telegram-premium-guide',
      title: 'راهنمای جامع استفاده از تلگرام پریمیوم',
      excerpt: 'در این مقاله به بررسی تمامی امکانات تلگرام پریمیوم و نحوه استفاده از آن‌ها می‌پردازیم...',
      imageUrl: 'https://images.pexels.com/photos/10132226/pexels-photo-10132226.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      date: '۱۵ مهر ۱۴۰۴',
      readTime: '۸',
      category: 'تلگرام'
    },
    {
      id: 'spotify-playlist-optimization',
      title: 'بهینه‌سازی پلی‌لیست‌های اسپاتیفای برای تجربه موسیقی بهتر',
      excerpt: 'چگونه پلی‌لیست‌های خود را در اسپاتیفای سازماندهی کنیم و از الگوریتم‌های پیشنهادی آن بهره ببریم...',
      imageUrl: 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      date: '۸ مهر ۱۴۰۴',
      readTime: '۶',
      category: 'اسپاتیفای'
    }
  ];

  return (
    <div className="min-h-screen text-white rtl">
      <div className="max-w-4xl mx-auto px-4">
        <Header />
        <LEDBoard />
        
        <main className="mt-12">
          <section>
            <div className="grid grid-cols-1 gap-6">
              <ProductCard 
                id="chatgpt"
                title="چت جی‌پی‌تی"
                options={[
                  { name: "پلن پلاس", value: 2125000, formattedValue: "۲,۱۲۵,۰۰۰ تومان" },
                  { name: "پلن پرو", value: 17460000, formattedValue: "۱۷٬۴۶۷,۰۰۰ تومان" }
                ]}
                icon={<Bot />}
                articleLink="/articles/chatgpt-advanced-prompts"
              />
              
              <ProductCard 
                id="spotify"
                title="اسپاتیفای"
                options={[
                  { name: "اشتراک ماهانه", value: 510000, formattedValue: "۵۱۰٬۰۰۰ تومان" },
                  { name: "اشتراک دوماهه", value: 893000, formattedValue: "۸۹۳٬۰۰۰ تومان" },
                  { name: "اشتراک سه‌ماهه", value: 1115000, formattedValue: "۱٬۱۵۰٬۰۰۰ تومان" },
                  { name: "اشتراک شش‌ماهه", value: 1900000, formattedValue: "۱٬۹۰۰٬۰۰۰ تومان" },
                  { name: "اشتراک سالانه", value: 4700000, formattedValue: "۴٬۷۰۰٬۰۰۰ تومان" }
                ]}
                icon={<Music />}
                articleLink="/articles/spotify-playlist-optimization"
              />
              
              <ProductCard 
                id="telegram-premium"
                title="تلگرام پریمیوم"
                options={[
                  { name: "اشتراک ماهانه", value: 795000, formattedValue: "۷۹۵,۰۰۰ تومان" },
                  { name: "اشتراک سه‌ماهه", value: 1246000, formattedValue: "۱٬۲۴۶٬۰۰۰ تومان" },
                  { name: "اشتراک شش‌ماهه", value: 1728000, formattedValue: "۱٬۷۲۸٬۰۰۰ تومان" },
                  { name: "اشتراک سالانه", value: 3200000, formattedValue: "۳٬۲۰۰٬۰۰۰ تومان" }
                ]}
                icon={<MessageSquare />}
                articleLink="/articles/telegram-premium-guide"
              />
            </div>
          </section>
          
          <section className="mt-20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-[#39ff14]">مقالات آموزشی</h2>
              <a href="/articles" className="text-white hover:text-[#39ff14] transition-colors text-sm">
                مشاهده همه مقالات
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredArticles.map(article => (
                <ArticlePreview 
                  key={article.id}
                  {...article}
                />
              ))}
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
      
      <ShoppingCartBubble onClick={() => setIsCartOpen(true)} />
      <DashboardBubble onClick={() => setIsDashboardOpen(true)} />
      
      <ShoppingCartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
      />
      
      <DashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />
    </div>
  );
};

export default HomePage;