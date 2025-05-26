import React, { useState } from 'react';
import { X, Package, CreditCard, Clock, Settings, LogOut, Wallet, Bitcoin, DollarSign } from 'lucide-react';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardModal: React.FC<DashboardModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [walletBalance, setWalletBalance] = useState({ rial: 0, crypto: 0 });
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('rial');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    if (email && password) {
      setIsLoggedIn(true);
      // Simulate wallet data
      setWalletBalance({ rial: 1500000, crypto: 0.005 });
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }
    // Simulate registration
    if (email && password && name) {
      setIsLoggedIn(true);
      setWalletBalance({ rial: 0, crypto: 0 });
    }
  };

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('مبلغ نامعتبر است');
      return;
    }
    
    // Simulate top-up
    setWalletBalance(prev => ({
      ...prev,
      [selectedCurrency]: prev[selectedCurrency] + amount
    }));
    setTopUpAmount('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-auto flex items-start justify-center pt-10 pb-10">
      <div className="bg-[#111] rounded-2xl border border-[#39ff14] w-full max-w-2xl mx-4 shadow-lg animate-modal-in">
        <div className="relative p-6">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-[#39ff14] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl text-center font-bold mb-6 text-white">داشبورد من</h2>

          {!isLoggedIn ? (
            <div className="max-w-md mx-auto py-4">
              {!isRegistering ? (
                <>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-white text-sm mb-2">ایمیل</label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                        placeholder="ایمیل خود را وارد کنید"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-white text-sm mb-2">رمز عبور</label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                        placeholder="رمز عبور خود را وارد کنید"
                        required
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <a href="#" className="text-[#39ff14] text-sm hover:underline">فراموشی رمز عبور</a>
                      <button 
                        type="submit"
                        className="bg-gradient-to-r from-[#004d00] to-[#39ff14] text-black py-2 px-6 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(57,255,20,0.5)] transition-all"
                      >
                        ورود
                      </button>
                    </div>
                  </form>
                  <div className="pt-6 text-center">
                    <p className="text-gray-400 text-sm">حساب کاربری ندارید؟</p>
                    <button 
                      onClick={() => setIsRegistering(true)}
                      className="text-[#39ff14] text-sm hover:underline mt-1"
                    >
                      ثبت نام کنید
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label htmlFor="register-name" className="block text-white text-sm mb-2">نام و نام خانوادگی</label>
                      <input
                        id="register-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                        placeholder="نام و نام خانوادگی خود را وارد کنید"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="register-email" className="block text-white text-sm mb-2">ایمیل</label>
                      <input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                        placeholder="ایمیل خود را وارد کنید"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="register-password" className="block text-white text-sm mb-2">رمز عبور</label>
                      <input
                        id="register-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                        placeholder="رمز عبور خود را وارد کنید"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm-password" className="block text-white text-sm mb-2">تکرار رمز عبور</label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                        placeholder="رمز عبور را مجدداً وارد کنید"
                        required
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => setIsRegistering(false)}
                        className="text-gray-400 text-sm hover:text-white transition-colors"
                      >
                        بازگشت به صفحه ورود
                      </button>
                      <button 
                        type="submit"
                        className="bg-gradient-to-r from-[#004d00] to-[#39ff14] text-black py-2 px-6 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(57,255,20,0.5)] transition-all"
                      >
                        ثبت نام
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          ) : (
            <div>
              <div className="flex border-b border-[#39ff14]/20 mb-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`flex items-center px-4 py-3 whitespace-nowrap ${activeTab === 'wallet' ? 'text-[#39ff14] border-b-2 border-[#39ff14]' : 'text-gray-400 hover:text-white'}`}
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  کیف پول
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center px-4 py-3 whitespace-nowrap ${activeTab === 'orders' ? 'text-[#39ff14] border-b-2 border-[#39ff14]' : 'text-gray-400 hover:text-white'}`}
                >
                  <Package className="w-5 h-5 mr-2" />
                  سفارشات من
                </button>
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className={`flex items-center px-4 py-3 whitespace-nowrap ${activeTab === 'subscriptions' ? 'text-[#39ff14] border-b-2 border-[#39ff14]' : 'text-gray-400 hover:text-white'}`}
                >
                  <Clock className="w-5 h-5 mr-2" />
                  اشتراک های فعال
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`flex items-center px-4 py-3 whitespace-nowrap ${activeTab === 'payments' ? 'text-[#39ff14] border-b-2 border-[#39ff14]' : 'text-gray-400 hover:text-white'}`}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  پرداخت ها
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center px-4 py-3 whitespace-nowrap ${activeTab === 'settings' ? 'text-[#39ff14] border-b-2 border-[#39ff14]' : 'text-gray-400 hover:text-white'}`}
                >
                  <Settings className="w-5 h-5 mr-2" />
                  تنظیمات
                </button>
              </div>

              {activeTab === 'wallet' && (
                <div className="py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/40 rounded-xl p-4 border border-[#39ff14]/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">موجودی ریالی</span>
                        <DollarSign className="w-5 h-5 text-[#39ff14]" />
                      </div>
                      <div className="text-xl font-bold text-white">
                        {walletBalance.rial.toLocaleString()} تومان
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-4 border border-[#39ff14]/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">موجودی ارز دیجیتال</span>
                        <Bitcoin className="w-5 h-5 text-[#39ff14]" />
                      </div>
                      <div className="text-xl font-bold text-white">
                        {walletBalance.crypto} BTC
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-6 border border-[#39ff14]/20">
                    <h3 className="text-lg font-bold text-white mb-4">افزایش موجودی</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white text-sm mb-2">نوع ارز</label>
                        <select
                          value={selectedCurrency}
                          onChange={(e) => setSelectedCurrency(e.target.value)}
                          className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                        >
                          <option value="rial">ریال</option>
                          <option value="crypto">ارز دیجیتال</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white text-sm mb-2">مبلغ</label>
                        <input
                          type="number"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                          placeholder={selectedCurrency === 'rial' ? 'مبلغ به تومان' : 'مقدار BTC'}
                        />
                      </div>
                      <button
                        onClick={handleTopUp}
                        className="w-full bg-gradient-to-r from-[#004d00] to-[#39ff14] text-black py-3 px-6 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(57,255,20,0.5)] transition-all"
                      >
                        افزایش موجودی
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="py-6">
                  <div className="text-center py-10">
                    <p className="text-gray-400">شما هنوز سفارشی ثبت نکرده‌اید</p>
                  </div>
                </div>
              )}

              {activeTab === 'subscriptions' && (
                <div className="py-6">
                  <div className="text-center py-10">
                    <p className="text-gray-400">شما هیچ اشتراک فعالی ندارید</p>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="py-6">
                  <div className="text-center py-10">
                    <p className="text-gray-400">تاریخچه پرداخت‌های شما خالی است</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="py-6">
                  <div className="space-y-4 max-w-md mx-auto">
                    <div>
                      <label className="block text-white text-sm mb-2">ایمیل</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-2">تغییر رمز عبور</label>
                      <input
                        type="password"
                        placeholder="رمز عبور فعلی"
                        className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all mb-2"
                      />
                      <input
                        type="password"
                        placeholder="رمز عبور جدید"
                        className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                      />
                    </div>
                    <div className="pt-4">
                      <button 
                        className="bg-gradient-to-r from-[#004d00] to-[#39ff14] text-black py-2 px-6 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(57,255,20,0.5)] transition-all"
                      >
                        ذخیره تغییرات
                      </button>
                    </div>
                    <div className="pt-6 border-t border-[#39ff14]/20 mt-6">
                      <button 
                        onClick={() => setIsLoggedIn(false)}
                        className="flex items-center text-red-500 hover:text-red-400 transition-colors"
                      >
                        <LogOut className="w-5 h-5 mr-2" />
                        خروج از حساب کاربری
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardModal;