import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useShoppingCart } from '../context/ShoppingCartContext';

export interface PriceOption {
  name: string;
  value: number;
  formattedValue: string;
}

export interface ProductProps {
  id: string;
  title: string;
  options: PriceOption[];
  icon: React.ReactNode;
  articleLink: string;
}

const ProductCard: React.FC<ProductProps> = ({ id, title, options, icon, articleLink }) => {
  const [selectedOption, setSelectedOption] = useState<PriceOption | null>(null);
  const { addToCart } = useShoppingCart();

  const handleOptionClick = (option: PriceOption) => {
    setSelectedOption(option);
  };

  const handleAddToCart = () => {
    if (!selectedOption) {
      alert('لطفا یک گزینه اشتراک انتخاب کنید.');
      return;
    }

    addToCart({
      id,
      title,
      option: selectedOption.name,
      price: selectedOption.value
    });
  };

  return (
    <div className="bg-[#1a1a1a]/90 backdrop-blur-xl rounded-3xl p-7 mb-8 border border-[#39ff14]/20 shadow-xl relative overflow-hidden opacity-100 transition-all duration-500 hover:border-[#39ff14] hover:shadow-[0_15px_40px_rgba(57,255,20,0.2)] hover:translate-y-[-5px] hover:scale-[1.02] group">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#39ff14]/5 rounded-full blur-xl group-hover:bg-[#39ff14]/10 transition-all duration-700"></div>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#39ff14] text-2xl font-bold text-shadow-sm">{title}</h2>
        <div className="text-[#39ff14] w-10 h-10">
          {icon}
        </div>
      </div>
      
      <ul className="mb-5 space-y-4">
        {options.map((option, index) => (
          <li 
            key={index}
            className={`bg-[#39ff14]/5 border border-[#39ff14]/10 rounded-2xl p-4 flex justify-between items-center transition-all cursor-pointer hover:bg-[#39ff14]/10 hover:border-[#39ff14] hover:-translate-x-1 ${selectedOption?.name === option.name ? 'bg-[#39ff14]/30 !border-[#39ff14] text-[#39ff14]' : ''}`}
            onClick={() => handleOptionClick(option)}
          >
            <span className="text-white">{option.name}</span>
            <span className="text-[#39ff14] font-semibold bg-[#39ff14]/10 py-1 px-4 rounded-xl text-shadow-sm">
              {option.formattedValue}
            </span>
          </li>
        ))}
      </ul>
      
      <div className="flex gap-4">
        <button 
          onClick={handleAddToCart}
          className="flex-1 flex items-center justify-center bg-gradient-to-tr from-[#004d00] to-[#39ff14] text-black rounded-xl py-3 px-4 font-semibold relative overflow-hidden shadow-[0_5px_15px_rgba(57,255,20,0.3)] hover:shadow-[0_8px_20px_rgba(57,255,20,0.4)] hover:-translate-y-0.5 transition-all before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-all before:duration-500 hover:before:left-[100%]"
        >
          <ShoppingCart className="w-5 h-5 ml-2" />
          افزودن به سبد خرید
        </button>
        <a
          href={articleLink}
          className="flex-1 bg-transparent border-2 border-[#39ff14] text-[#39ff14] rounded-xl py-3 px-4 font-semibold transition-all hover:bg-[#39ff14]/10 hover:-translate-y-0.5 text-center relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-all before:duration-500 hover:before:left-[100%]"
        >
          بیشتر
        </a>
      </div>
    </div>
  );
};

export default ProductCard;