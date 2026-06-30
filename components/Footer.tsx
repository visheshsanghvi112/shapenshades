import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, Linkedin } from 'lucide-react';

interface FooterProps {
  isDarkBackground?: boolean;
  position?: 'fixed' | 'static';
}

const Footer: React.FC<FooterProps> = ({ isDarkBackground = false, position = 'fixed' }) => {
  const baseClasses =
    position === 'fixed'
      ? 'fixed bottom-0 left-0 w-full z-40 p-6 md:p-8 pointer-events-none'
      : 'w-full p-6 md:p-12 border-t border-gray-100 bg-white text-black';

  const contentClasses =
    position === 'fixed'
      ? 'flex justify-between items-end pointer-events-auto'
      : 'flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0';

  const textColorClass =
    position === 'fixed'
      ? isDarkBackground
        ? 'text-white'
        : 'text-black'
      : 'text-black';

  return (
    <footer className={`${baseClasses} ${textColorClass} transition-colors duration-500`}>
      <div className={contentClasses}>
        <span className="text-xs tracking-widest font-semibold opacity-70 flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <span>© SHAPE N SHADES {new Date().getFullYear()}</span>
          {/* Use react-router Link so Googlebot follows this as a real crawlable href.
              Source: https://developers.google.com/search/docs/crawling-indexing/links-crawlable */}
          <Link
            to="/interior-designers-mumbai"
            className="hidden sm:inline-block font-normal opacity-70 hover:opacity-100 transition-opacity pb-[1px] border-b border-black/20 hover:border-black"
          >
            Interior Designers in Mumbai
          </Link>
        </span>

        {/* External social links */}
        <div className="flex space-x-6 opacity-70">
          <a
            href="https://www.instagram.com/shape.n.shades.design"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Shape N Shades on Instagram"
            className="hover:opacity-100 transition-opacity"
          >
            <Instagram size={20} strokeWidth={1.5} />
          </a>
          <a
            href="https://www.youtube.com/@shapeNshades_designs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Shape N Shades on YouTube"
            className="hover:opacity-100 transition-opacity"
          >
            <Youtube size={20} strokeWidth={1.5} />
          </a>
          <a
            href="https://www.linkedin.com/company/shape-n-shades"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Shape N Shades on LinkedIn"
            className="hover:opacity-100 transition-opacity"
          >
            <Linkedin size={20} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;