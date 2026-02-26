import React from 'react';
import { Instagram, Youtube, Linkedin } from 'lucide-react';

interface FooterProps {
  isDarkBackground?: boolean;
  position?: 'fixed' | 'static';
}

const Footer: React.FC<FooterProps> = ({ isDarkBackground = false, position = 'fixed' }) => {
  const baseClasses = position === 'fixed'
    ? "fixed bottom-0 left-0 w-full z-40 p-6 md:p-8 pointer-events-none"
    : "w-full p-6 md:p-12 border-t border-gray-100 bg-white text-black";

  const contentClasses = position === 'fixed'
    ? "flex justify-between items-end pointer-events-auto"
    : "flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0";

  const textColorClass = position === 'fixed'
    ? (isDarkBackground ? 'text-white' : 'text-black')
    : 'text-black';

  return (
    <footer className={`${baseClasses} ${textColorClass} transition-colors duration-500`}>
      <div className={contentClasses}>
        <span className="text-xs tracking-widest font-semibold opacity-70 flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <span>© SHAPE N SHADES 2025</span>
          <a href="/interior-designers-mumbai" className="hidden sm:inline-block font-normal opacity-70 hover:opacity-100 transition-opacity pb-[1px] border-b border-black/20 hover:border-black dark:border-white/20 dark:hover:border-white">
            Interior Designers in Mumbai
          </a>
        </span>
        <div className="flex space-x-6 opacity-70">
          <a href="https://www.instagram.com/shape.n.shades.design?igsh=MXVyZTg2MWlpNTc4eA==" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
            <Instagram size={20} strokeWidth={1.5} />
          </a>
          <a href="https://www.youtube.com/@shapeNshades_designs" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
            <Youtube size={20} strokeWidth={1.5} />
          </a>
          <a href="#" className="hover:opacity-100 transition-opacity">
            <Linkedin size={20} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;