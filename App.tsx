import React, { useState, useEffect, useRef } from 'react';
import { Menu as MenuIcon } from 'lucide-react';
import { ViewState } from './types';
import { FIRM_NAME } from './constants';
import { trackPageView } from './src/analytics';
import Menu from './components/Menu';
import Footer from './components/Footer';
import OfferPopup from './components/OfferPopup';
import CookieConsent from './components/CookieConsent';
import Chatbot from './components/Chatbot';
import Home from './views/Home';
import About from './views/About';
import Projects from './views/Projects';
import Contact from './views/Contact';
import Admin from './views/Admin';

const App: React.FC = () => {
  // Initialize from URL hash
  const getInitialView = (): ViewState => {
    const hash = window.location.hash.slice(1).toUpperCase();
    const validViews: ViewState[] = ['HOME', 'PROJECTS', 'ABOUT', 'CONTACT', 'ADMIN'];
    return validViews.includes(hash as ViewState) ? (hash as ViewState) : 'HOME';
  };

  const [currentView, setCurrentView] = useState<ViewState>(getInitialView());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Controls Header/Footer color
  const [isOfferPopupOpen, setIsOfferPopupOpen] = useState(false);

  // Smart Header Logic
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  // Update URL when view changes
  useEffect(() => {
    window.location.hash = currentView.toLowerCase();
    window.scrollTo(0, 0); // Scroll to top on page change
    trackPageView(currentView);
  }, [currentView]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1).toUpperCase();
      const validViews: ViewState[] = ['HOME', 'PROJECTS', 'ABOUT', 'CONTACT', 'ADMIN'];
      if (validViews.includes(hash as ViewState)) {
        setCurrentView(hash as ViewState);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Show offer popup logic
  useEffect(() => {
    const hasSubmitted = localStorage.getItem('offerFormSubmitted');
    const closeCount = parseInt(localStorage.getItem('offerCloseCount') || '0');
    
    // Show popup if:
    // 1. User hasn't submitted the form AND
    // 2. They've closed it less than 2 times (show max 2 times)
    if (!hasSubmitted && closeCount < 2) {
      setIsOfferPopupOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // On HOME view (which is typically fixed height), always keep header visible
      if (currentView === 'HOME') {
        setShowHeader(true);
        return;
      }

      const currentScrollY = window.scrollY;
      
      // Always show at the very top to avoid getting stuck
      if (currentScrollY < 50) {
        setShowHeader(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Determine scroll direction
      if (currentScrollY > lastScrollY.current + 10) {
        // Scrolling Down -> Hide
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY.current - 10) {
        // Scrolling Up -> Show
        setShowHeader(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const renderView = () => {
    switch (currentView) {
      case 'HOME': return <Home setIsDarkMode={setIsDarkMode} />;
      case 'PROJECTS': return <Projects setIsDarkMode={setIsDarkMode} />;
      case 'ABOUT': return <About setIsDarkMode={setIsDarkMode} />;
      case 'CONTACT': return <Contact setIsDarkMode={setIsDarkMode} />;
      case 'ADMIN': return <Admin setIsDarkMode={setIsDarkMode} />;
      default: return <Home setIsDarkMode={setIsDarkMode} />;
    }
  };

  const headerTextColor = isDarkMode ? 'text-white' : 'text-black';

  return (
    <div className="min-h-screen relative font-sans selection:bg-black selection:text-white flex flex-col">
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 w-full z-40 p-6 md:p-8 flex justify-between items-center transition-transform duration-500 ease-in-out ${headerTextColor} ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div 
          className="cursor-pointer z-50 pointer-events-auto"
          onClick={() => setCurrentView('HOME')}
        >
          <img 
            src="/logo-web.png" 
            alt={FIRM_NAME}
            className="h-24 md:h-28 w-auto object-contain"
          />
        </div>
        
        <button 
          onClick={() => {
            setIsMenuOpen(true);
            setIsOfferPopupOpen(false); // Close popup when opening menu
          }}
          className="p-2 hover:opacity-70 transition-opacity z-50 pointer-events-auto"
        >
          <MenuIcon size={28} strokeWidth={1.5} />
        </button>
      </header>

      {/* Main View Area */}
      {/* For Home (which is fixed/h-screen), we might not want flex-grow, but for others we do */}
      <main className="w-full flex-grow">
        {renderView()}
      </main>

      {/* Footer */}
      {/* Fixed on Home view, Static on others */}
      <Footer 
        isDarkBackground={isDarkMode} 
        position={currentView === 'HOME' ? 'fixed' : 'static'} 
      />

      {/* Full Screen Menu Overlay */}
      <Menu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        currentView={currentView}
        onNavigate={(view) => {
            setCurrentView(view);
            // Default reset on nav
            if(view !== 'HOME') setIsDarkMode(false);
            // Ensure header shows immediately on nav
            setShowHeader(true);
        }}
      />

      {/* Offer Popup */}
      <OfferPopup 
        isOpen={isOfferPopupOpen && !isMenuOpen}
        onClose={() => setIsOfferPopupOpen(false)}
      />

      {/* Cookie Consent */}
      <CookieConsent />

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default App;