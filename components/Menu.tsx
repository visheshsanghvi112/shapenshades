import React from 'react';
import { ViewState } from '../types';
import { X } from 'lucide-react';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onNavigate }) => {
  const menuItems: { label: string; view: ViewState }[] = [
    { label: 'HOME', view: 'HOME' },
    { label: 'PROJECTS', view: 'PROJECTS' },
    { label: 'ABOUT US', view: 'ABOUT' },
    { label: 'CONTACT US', view: 'CONTACT' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f4f4] text-black flex flex-col justify-center items-center animate-fade-in">
      {/* Close Button positioned absolutely top right */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-2 hover:bg-gray-200 rounded-full transition-colors"
      >
        <X size={32} strokeWidth={1.5} />
      </button>

      <nav className="flex flex-col items-center space-y-6">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              onNavigate(item.view);
              onClose();
            }}
            className="text-2xl md:text-4xl font-semibold tracking-wider hover:text-gray-500 transition-colors uppercase font-brand"
          >
            {item.label}
          </button>
        ))}
      </nav>
      
      {/* Optional decorative background element or watermark */}
      <div className="absolute bottom-10 opacity-10 pointer-events-none">
        <h1 className="text-6xl md:text-9xl font-brand">S & S</h1>
      </div>
    </div>
  );
};

export default Menu;