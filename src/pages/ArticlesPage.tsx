import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ArticlePreview from '../components/ArticlePreview';
import ShoppingCartBubble from '../components/ShoppingCartBubble';
import DashboardBubble from '../components/DashboardBubble';
import ShoppingCartModal from '../components/ShoppingCartModal';
import DashboardModal from '../components/DashboardModal';
import { Search } from 'lucide-react';

const articles = [
  {
    id: 'telegram-premium-guide',
    title: 'راهنمای جامع استفاده از تلگرام پریمیوم',
    excerpt: 'در این مقاله به بررسی تمامی امکانات تلگرام پریمیوم و نحوه استفاده از آن‌ها می‌پردازیم. از ارسال پیام‌های طولانی تا افزایش سرعت دانلود، اتصال به چندین اکانت و دسترسی به استیکرهای انحصاری.',
    imageUrl: 'https://images.pexels.com/photos/10132226/pexels-photo-10132226.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    date: '۱۵ مهر ۱۴۰۴',
    readTime: '۸',
    category: 'تلگرام'
  },
  {
    id: 'spotify-playlist-optimization',
    title: 'بهینه‌سازی پلی‌لیست‌های اسپاتیفای برای تجربه موسیقی بهتر',
    excerpt: 'چگونه پلی‌لیست‌های خود را در اسپاتیفای سازماندهی کنیم و از الگوریتم‌های پیشنهادی آن بهره ببریم. با روش‌های حرفه‌ای مدیریت موسیقی آشنا شوید و تجربه شنیداری خود را ارتقا دهید.',
    imageUrl: 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    date: '۸ مهر ۱۴۰۴',
    readTime: '۶',
    category: 'اسپاتیفای'
  },
  {
    id: 'chatgpt-advanced-prompts',
    title: 'ترفندهای پیشرفته برای دریافت پاسخ‌های بهتر از چت جی‌پی‌تی',
    excerpt: 'با استفاده از تکنیک‌های مهندسی پرامپت، می‌توانید خروجی‌های هوشمندتر و دقیق‌تری از چت جی‌پی‌تی دریافت کنید. در این مقاله شیوه‌های حرفه‌ای پرسش از هوش مصنوعی را یاد می‌گیرید.',
    imageUrl: 'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    date: '۱ مهر ۱۴۰۴',
    readTime: '۱۰',
    category: 'هوش مصنوعی'
  },
  {
    id: 'adobe-creative-cloud-guide',
    title: 'آموزش استفاده از نرم‌افزارهای ادوبی کریتیو کلود برای مبتدیان',
    excerpt: 'از فتوشاپ تا ایلاستریتور و پریمیر پرو، ادوبی مجموعه قدرتمندی از ابزارهای طراحی و ویرایش در اختیار کاربران قرار می‌دهد. با این راهنما اولین قدم‌های خود را در دنیای نرم‌افزارهای خلاقانه بردارید.',
    imageUrl: 'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    date: '۲۵ شهریور ۱۴۰۴',
    readTime: '۱۲',
    category: 'طراحی'
  },
  {
    id: 'netflix-hidden-features',
    title: 'ویژگی‌های پنهان نتفلیکس که احتمالاً از آن‌ها بی‌خبر هستید',
    excerpt: 'نتفلیکس قابلیت‌های متعددی دارد که بسیاری از کاربران از آن‌ها استفاده نمی‌کنند. از کدهای مخفی برای دسترسی به محتوای بیشتر تا تنظیمات پیشرفته کیفیت تصویر، همه را در این مقاله بررسی می‌کنیم.',
    imageUrl: 'https://images.pexels.com/photos/4009402/pexels-photo-4009402.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    date: '۱۸ شهریور ۱۴۰۴',
    readTime: '۷',
    category: 'استریمینگ'
  },
  {
    id: 'canva-pro-design-tips',
    title: 'ترفندهای حرفه‌ای طراحی با کنوا پرو',
    excerpt: 'کنوا ابزاری قدرتمند برای طراحی‌های گرافیکی آنلاین است که نسخه پرو آن امکانات بی‌نظیری در اختیار طراحان قرار می‌دهد. در این مقاله با تکنیک‌های پیشرفته برای ایجاد طرح‌های حرفه‌ای آشنا می‌شوید.',
    imageUrl: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    date: '۱۰ شهریور ۱۴۰۴',
    readTime: '۹',
    category: 'طراحی'
  },
  {
    id: 'vpn-security-guide',
    title: 'راهنمای امنیت آنلاین: چرا باید از VPN استفاده کنید؟',
    excerpt: 'در دنیای دیجیتال امروز، حفظ حریم خصوصی اهمیت بسیاری دارد. VPN چگونه به امنیت شما کمک می‌کند و چطور می‌توانید بهترین سرویس را انتخاب کنید؟',
    imageUrl: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    date: '۵ شهریور ۱۴۰۴',
    readTime: '۱۱',
    category: 'امنیت'
  },
  {
    id: 'online-services-comparison',
    title: 'مقایسه جامع سرویس‌های اشتراکی آنلاین: کدام برای شما مناسب است؟',
    excerpt: 'در این مقاله به مقایسه سرویس‌های مختلف استریمینگ، طراحی، هوش مصنوعی و شبکه‌های اجتماعی پرداخته‌ایم تا به شما در انتخاب بهترین گزینه متناسب با نیازهایتان کمک کنیم.',
    imageUrl: 'https://images.pexels.com/photos/7688460/pexels-photo-7688460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    date: '۱ شهریور ۱۴۰۴',
    readTime: '۱۵',
    category: 'مقایسه'
  }
];

const ArticlesPage: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filteredArticles, setFilteredArticles] = useState(articles);

  const categories = Array.from(new Set(articles.map(article => article.category)));

  useEffect(() => {
    let results = articles;
    
    if (searchQuery) {
      results = results.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      results = results.filter(article => article.category === selectedCategory);
    }
    
    setFilteredArticles(results);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen text-white rtl">
      <div className="max-w-4xl mx-auto px-4">
        <Header />
        
        <main className="mt-12">
          <h1 className="text-3xl font-bold text-[#39ff14] text-center mb-8">مقالات آموزشی</h1>
          
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="جستجو در مقالات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border border-[#39ff14]/30 rounded-xl py-3 px-4 pl-10 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            
            <div className="flex-shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-black/50 border border-[#39ff14]/30 rounded-xl py-3 px-4 text-white appearance-none min-w-[150px] focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
              >
                <option value="">همه دسته‌بندی‌ها</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400">هیچ مقاله‌ای با معیارهای جستجوی شما یافت نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map(article => (
                <ArticlePreview 
                  key={article.id}
                  {...article}
                />
              ))}
            </div>
          )}
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

export default ArticlesPage;