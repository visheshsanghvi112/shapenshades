import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

// Navigation items now use real URL paths instead of hash fragments.
// Per Google Search Central: use crawlable <a href> with real paths so
// Googlebot can discover and index each URL independently.
// Source: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
const menuItems: { label: string; path: string }[] = [
  { label: 'HOME',       path: '/' },
  { label: 'PROJECTS',   path: '/projects' },
  { label: 'ABOUT US',   path: '/about' },
  { label: 'CONTACT US', path: '/contact' },
];

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, currentPath, onNavigate }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#f4f4f4] text-black flex flex-col justify-center items-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close navigation menu"
        className="absolute top-8 right-8 p-2 hover:bg-gray-200 rounded-full transition-colors"
      >
        <X size={32} strokeWidth={1.5} />
      </button>

      {/* Navigation — real <a> tags via react-router Link so Googlebot crawls them */}
      <nav aria-label="Main navigation">
        <ul className="flex flex-col items-center space-y-6 list-none">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => onNavigate(item.path)}
                aria-current={currentPath === item.path ? 'page' : undefined}
                className={`text-2xl md:text-4xl font-semibold tracking-wider transition-colors uppercase font-brand
                  ${currentPath === item.path ? 'text-black' : 'hover:text-gray-500'}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Decorative watermark */}
      <div className="absolute bottom-10 opacity-10 pointer-events-none" aria-hidden="true">
        <div className="text-6xl md:text-9xl font-brand">S &amp; S</div>
      </div>
    </div>
  );
};

export default Menu;