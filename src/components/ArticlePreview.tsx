import React from 'react';
import { Clock, ArrowUpRight } from 'lucide-react';

export interface ArticlePreviewProps {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  readTime: string;
  category: string;
}

const ArticlePreview: React.FC<ArticlePreviewProps> = ({
  id,
  title,
  excerpt,
  imageUrl,
  date,
  readTime,
  category
}) => {
  return (
    <article className="bg-black/40 backdrop-blur-xl rounded-2xl border border-[#39ff14]/20 overflow-hidden hover:border-[#39ff14]/50 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(57,255,20,0.1)] hover:translate-y-[-5px] group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <span className="absolute bottom-4 left-4 bg-[#39ff14] text-black text-xs font-semibold px-3 py-1 rounded-full">
          {category}
        </span>
      </div>
      
      <div className="p-5">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span>{date}</span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {readTime} دقیقه مطالعه
          </span>
        </div>
        
        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#39ff14] transition-colors">
          {title}
        </h3>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {excerpt}
        </p>
        
        <div className="flex justify-end">
          <a 
            href={`/articles/${id}`}
            className="inline-flex items-center text-[#39ff14] text-sm font-medium hover:underline"
          >
            ادامه مطلب
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      </div>
    </article>
  );
};

export default ArticlePreview;