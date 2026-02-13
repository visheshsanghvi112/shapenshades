import React, { useState, useEffect, useRef } from 'react';
import { Menu as MenuIcon } from 'lucide-react';
import { ViewState } from './types';
import { FIRM_NAME } from './constants';
import Menu from './components/Menu';
import Footer from './components/Footer';
import OfferPopup from './components/OfferPopup';
import Home from './views/Home';
import About from './views/About';
import Projects from './views/Projects';
import Contact from './views/Contact';

const App: React.FC = () => {
  // Initialize from URL hash
  const getInitialView = (): ViewState => {
    const hash = window.location.hash.slice(1).toUpperCase();
    const validViews: ViewState[] = ['HOME', 'PROJECTS', 'ABOUT', 'CONTACT'];
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
  }, [currentView]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1).toUpperCase();
      const validViews: ViewState[] = ['HOME', 'PROJECTS', 'ABOUT', 'CONTACT'];
      if (validViews.includes(hash as ViewState)) {
        setCurrentView(hash as ViewState);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Show offer popup after 3 seconds on first visit
  useEffect(() => {
    const hasSeenOffer = sessionStorage.getItem('hasSeenOffer');
    if (!hasSeenOffer) {
      const timer = setTimeout(() => {
        setIsOfferPopupOpen(true);
        sessionStorage.setItem('hasSeenOffer', 'true');
      }, 3000);
      return () => clearTimeout(timer);
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
        <h1 
          className="text-lg md:text-xl font-brand tracking-widest font-bold cursor-pointer z-50 pointer-events-auto"
          onClick={() => setCurrentView('HOME')}
        >
          {FIRM_NAME}
        </h1>
        
        <button 
          onClick={() => setIsMenuOpen(true)}
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
        isOpen={isOfferPopupOpen}
        onClose={() => setIsOfferPopupOpen(false)}
      />
    </div>
  );
};

export default App;