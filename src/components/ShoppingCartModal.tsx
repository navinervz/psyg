import React, { useState } from 'react';
import { X, Plus, Minus, CheckCircle } from 'lucide-react';
import { useShoppingCart } from '../context/ShoppingCartContext';
import ProductIcon from './ProductIcon';

interface ShoppingCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShoppingCartModal: React.FC<ShoppingCartModalProps> = ({ isOpen, onClose }) => {
  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart, calculateTotal } = useShoppingCart();
  const [email, setEmail] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const hasTelegramProduct = cartItems.some(item => item.id === 'telegram-premium');
  const total = calculateTotal();

  const handleSubmitOrder = () => {
    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('ایمیل نامعتبر است.');
      return;
    }

    // Check Telegram ID if product is in cart
    if (hasTelegramProduct && !telegramId) {
      alert('شناسه تلگرام اجباری است.');
      return;
    }

    // Simulate order submission
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 2000);
    }, 1500);
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

          <h2 className="text-2xl text-center font-bold mb-6 text-white">سبد خرید شما</h2>

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle className="w-16 h-16 text-[#39ff14] mb-4" />
              <p className="text-xl text-white">سفارش شما با موفقیت ثبت شد</p>
            </div>
          ) : (
            <>
              {cartItems.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400">سبد خرید شما خالی است</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 max-h-[250px] overflow-y-auto p-2">
                    {cartItems.map((item) => (
                      <div key={`${item.id}-${item.option}`} className="bg-black/40 rounded-xl p-4 flex flex-col items-center">
                        <div className="w-12 h-12 mb-2 text-[#39ff14]">
                          <ProductIcon productId={item.id} />
                        </div>
                        <h3 className="text-[#39ff14] text-sm mb-1">{item.title}</h3>
                        <p className="text-white text-xs mb-2">{item.option}</p>
                        <div className="flex items-center mt-2">
                          <button 
                            onClick={() => decreaseQuantity(item.id, item.option)}
                            className="w-7 h-7 bg-[#39ff14] text-black rounded flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="mx-2 text-white">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => increaseQuantity(item.id, item.option)}
                            className="w-7 h-7 bg-[#39ff14] text-black rounded flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-4">
                    <p className="text-sm text-white mb-3">
                      {hasTelegramProduct 
                        ? 'ایمیل و شناسه تلگرام مورد نظر برای اشتراک را وارد کنید' 
                        : 'ایمیل مورد نظر برای اعمال اشتراک را وارد کنید'}
                    </p>
                    
                    <input
                      type="email"
                      placeholder="ایمیل خود را وارد کنید"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                    />
                    
                    {hasTelegramProduct && (
                      <input
                        type="text"
                        placeholder="شناسه تلگرام"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value)}
                        className="w-full p-3 rounded-lg bg-black border border-[#39ff14]/30 text-white focus:border-[#39ff14] focus:ring focus:ring-[#39ff14]/20 outline-none transition-all"
                      />
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-6">
                    <span className="text-lg font-bold text-white">
                      جمع کل: {total.toLocaleString()} تومان
                    </span>
                    <button 
                      onClick={handleSubmitOrder}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-[#004d00] to-[#39ff14] text-black py-3 px-6 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(57,255,20,0.5)] transition-all relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          در حال ثبت...
                        </span>
                      ) : 'ثبت سفارش'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingCartModal;