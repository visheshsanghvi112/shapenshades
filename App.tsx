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
import MumbaiSEO from './views/MumbaiSEO';
import { Analytics } from '@vercel/analytics/react';

const App: React.FC = () => {
  // Initialize from URL hash
  const getInitialView = (): ViewState => {
    if (window.location.pathname === '/interior-designers-mumbai' || window.location.pathname === '/interior-designers-mumbai/') {
      return 'INTERIOR_DESIGNERS_MUMBAI';
    }
    const hash = window.location.hash.slice(1).toUpperCase();
    const validViews: ViewState[] = ['HOME', 'PROJECTS', 'ABOUT', 'CONTACT', 'ADMIN', 'INTERIOR_DESIGNERS_MUMBAI'];
    return validViews.includes(hash as ViewState) ? (hash as ViewState) : 'HOME';
  };

  const [currentView, setCurrentView] = useState<ViewState>(getInitialView());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Controls Header/Footer color
  const [isOfferPopupOpen, setIsOfferPopupOpen] = useState(false);

  // Smart Header Logic
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  // Update URL and Title when view changes
  useEffect(() => {
    if (currentView === 'INTERIOR_DESIGNERS_MUMBAI') {
      window.history.replaceState(null, '', '/interior-designers-mumbai');
    } else {
      if (window.location.pathname !== '/') {
        window.history.replaceState(null, '', '/');
      }
      window.location.hash = currentView.toLowerCase();
    }
    window.scrollTo(0, 0); // Scroll to top on page change

    // Dynamic SEO Titles
    const titles: Record<ViewState, string> = {
      HOME: `Shape N Shades \u2013 Luxury Architecture & Interior Design Firm in Bhayandar East, Mumbai`,
      PROJECTS: `Projects | Shape N Shades`,
      ABOUT: `About Us | Shape N Shades`,
      CONTACT: `Contact | Shape N Shades`,
      ADMIN: `Admin Console | Shape N Shades`,
      INTERIOR_DESIGNERS_MUMBAI: `Interior Designers in Mumbai | Shape N Shades`
    };
    document.title = titles[currentView] || titles.HOME;

    // Dynamic SEO Meta Descriptions
    const descriptions: Record<ViewState, string> = {
      HOME: `Shape N Shades is a luxury architecture and interior design firm in Bhayandar East, Mumbai. We specialize in premium residential villas, modern workspaces, and bespoke interior projects across Mumbai.`,
      PROJECTS: `Explore our portfolio of luxury residential, commercial, and villa architectural projects by Shape N Shades in Mumbai and beyond.`,
      ABOUT: `Learn about Shape N Shades, a premier architecture and interior design studio founded by Ar. Sohan Suthar in Mumbai, specializing in luxury spaces.`,
      CONTACT: `Get in touch with Shape N Shades for your next architecture or interior design project in Mumbai. We turn your vision into reality.`,
      ADMIN: `Admin Console for Shape N Shades.`,
      INTERIOR_DESIGNERS_MUMBAI: `Shape N Shades is a premium architecture and interior design studio offering luxury residential, villa, and commercial interior solutions across Mumbai.`
    };
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', descriptions[currentView] || descriptions.HOME);
    }

    trackPageView(currentView);
  }, [currentView]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1).toUpperCase();
      const validViews: ViewState[] = ['HOME', 'PROJECTS', 'ABOUT', 'CONTACT', 'ADMIN', 'INTERIOR_DESIGNERS_MUMBAI'];
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
      case 'INTERIOR_DESIGNERS_MUMBAI': return <MumbaiSEO setIsDarkMode={setIsDarkMode} />;
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
          className={`cursor-pointer z-50 pointer-events-auto ${currentView === 'ADMIN' ? 'opacity-0 pointer-events-none' : ''}`}
          onClick={() => setCurrentView('HOME')}
        >
          <img
            src="/SNS-logo-2.2.png"
            alt={FIRM_NAME}
            className="h-24 md:h-32 w-auto object-contain"
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
          if (view !== 'HOME') setIsDarkMode(false);
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

      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
};

export default App;