import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon } from 'lucide-react';
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

// ─── Per-route SEO metadata ────────────────────────────────────────────────
// Source: https://developers.google.com/search/docs/crawling-indexing/valid-page-metadata
// BreadcrumbList per route
// Source: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
interface BreadcrumbItem { name: string; item: string; }
const PAGE_BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  '/': [{ name: 'Home', item: 'https://shapenshades.com/' }],
  '/projects': [
    { name: 'Home', item: 'https://shapenshades.com/' },
    { name: 'Projects', item: 'https://shapenshades.com/projects' },
  ],
  '/about': [
    { name: 'Home', item: 'https://shapenshades.com/' },
    { name: 'About', item: 'https://shapenshades.com/about' },
  ],
  '/contact': [
    { name: 'Home', item: 'https://shapenshades.com/' },
    { name: 'Contact', item: 'https://shapenshades.com/contact' },
  ],
  '/interior-designers-mumbai': [
    { name: 'Home', item: 'https://shapenshades.com/' },
    { name: 'Interior Designers Mumbai', item: 'https://shapenshades.com/interior-designers-mumbai' },
  ],
};

const PAGE_META: Record<string, { title: string; description: string; canonical: string }> = {
  '/': {
    title: 'Shape N Shades – Luxury Architecture & Interior Design Firm in Mumbai, Dadar East & Mira Road',
    description:
      'Shape N Shades is a luxury architecture and interior design firm operating across Dadar East, Mira Road, Thane, and Mumbai. We specialize in premium residential villas, modern workspaces, and bespoke interior projects.',
    canonical: 'https://shapenshades.com/',
  },
  '/projects': {
    title: 'Our Portfolio – Architecture & Interior Design Projects | Shape N Shades',
    description:
      'Explore our portfolio of luxury residential, commercial, and architectural design projects by Shape N Shades across Mumbai, Thane, Bandra, Nashik, Delhi and beyond.',
    canonical: 'https://shapenshades.com/projects',
  },
  '/about': {
    title: 'About Shape N Shades – Architecture Studio Founded by Ar. Sohan Suthar | Mumbai',
    description:
      'Learn about Shape N Shades, a premier architecture and interior design studio founded by Ar. Sohan Suthar in Dadar East, Mumbai. Specializing in luxury residential and commercial spaces.',
    canonical: 'https://shapenshades.com/about',
  },
  '/contact': {
    title: 'Contact Us – Book a Design Consultation | Shape N Shades, Mumbai',
    description:
      'Get in touch with Shape N Shades for your next architecture or interior design project in Mumbai. Visit our studio at Dadar East or call +91 80972 41237.',
    canonical: 'https://shapenshades.com/contact',
  },
  '/interior-designers-mumbai': {
    title: 'Interior Designers in Mumbai – Premium Design Services | Shape N Shades',
    description:
      'Shape N Shades is a premium architecture and interior design studio offering luxury residential, villa, and commercial interior solutions across Mumbai. Contact us for a consultation.',
    canonical: 'https://shapenshades.com/interior-designers-mumbai',
  },
};

// ─── Helper: inject dynamic SEO meta into <head> ──────────────────────────
// Google supports dynamically generated metadata from React SPAs.
// Source: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
function injectBreadcrumb(pathname: string): void {
  const crumbs = PAGE_BREADCRUMBS[pathname] ?? PAGE_BREADCRUMBS['/'];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  };
  let el = document.getElementById('schema-breadcrumb-global') as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = 'schema-breadcrumb-global';
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(schema);
}

function updateDocumentMeta(pathname: string): void {
  const meta = PAGE_META[pathname] ?? PAGE_META['/'];

  // Title
  document.title = meta.title;

  // Meta description
  const desc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (desc) desc.content = meta.description;

  // Canonical — must be an absolute URL per Google spec
  let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.rel = 'canonical';
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.href = meta.canonical;

  // Inject BreadcrumbList for this route
  injectBreadcrumb(pathname);

  // Open Graph — update so social crawlers see the correct per-page data
  const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = meta.title;

  const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = meta.description;

  const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (ogUrl) ogUrl.content = meta.canonical;

  // Twitter Cards
  const twTitle = document.querySelector<HTMLMetaElement>('meta[property="twitter:title"]');
  if (twTitle) twTitle.content = meta.title;

  const twDesc = document.querySelector<HTMLMetaElement>('meta[property="twitter:description"]');
  if (twDesc) twDesc.content = meta.description;

  const twUrl = document.querySelector<HTMLMetaElement>('meta[property="twitter:url"]');
  if (twUrl) twUrl.content = meta.canonical;
}

// ─── Route-aware inner shell (must be inside <BrowserRouter>) ─────────────
const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOfferPopupOpen, setIsOfferPopupOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  const isHome = location.pathname === '/';

  // Update all meta tags whenever the route changes
  useEffect(() => {
    updateDocumentMeta(location.pathname);
    trackPageView(location.pathname);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Offer popup logic
  useEffect(() => {
    const hasSubmitted = localStorage.getItem('offerFormSubmitted');
    const closeCount = parseInt(localStorage.getItem('offerCloseCount') || '0');
    if (!hasSubmitted && closeCount < 2) {
      setIsOfferPopupOpen(true);
    }
  }, []);

  // Smart header hide-on-scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isHome) {
        setShowHeader(true);
        return;
      }
      const currentScrollY = window.scrollY;
      if (currentScrollY < 50) {
        setShowHeader(true);
        lastScrollY.current = currentScrollY;
        return;
      }
      if (currentScrollY > lastScrollY.current + 10) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY.current - 10) {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const isAdmin = location.pathname === '/admin';
  const headerTextColor = isDarkMode ? 'text-white' : 'text-black';

  return (
    <div className="min-h-screen relative font-sans selection:bg-black selection:text-white flex flex-col">
      {/* ── Header ── */}
      <header
        className={`fixed top-0 left-0 w-full z-40 p-6 md:p-8 flex justify-between items-center transition-transform duration-500 ease-in-out ${headerTextColor} ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div
          className={`cursor-pointer z-50 pointer-events-auto ${isAdmin ? 'opacity-0 pointer-events-none' : ''}`}
          onClick={() => navigate('/')}
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
            setIsOfferPopupOpen(false);
          }}
          className="p-2 hover:opacity-70 transition-opacity z-50 pointer-events-auto"
          aria-label="Open navigation menu"
        >
          <MenuIcon size={28} strokeWidth={1.5} />
        </button>
      </header>

      {/* ── Main content ── */}
      <main className="w-full flex-grow">
        <Routes>
          {/* Each route gets its own crawlable URL.
              Per Google: use History API (pushState) so Googlebot can crawl each URL.
              Source: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics */}
          <Route path="/" element={<Home setIsDarkMode={setIsDarkMode} />} />
          <Route path="/projects" element={<Projects setIsDarkMode={setIsDarkMode} />} />
          <Route path="/about" element={<About setIsDarkMode={setIsDarkMode} />} />
          <Route path="/contact" element={<Contact setIsDarkMode={setIsDarkMode} />} />
          <Route path="/interior-designers-mumbai" element={<MumbaiSEO setIsDarkMode={setIsDarkMode} />} />
          <Route path="/admin" element={<Admin setIsDarkMode={setIsDarkMode} />} />
          {/* Catch-all: redirect unknown paths to home */}
          <Route path="*" element={<Home setIsDarkMode={setIsDarkMode} />} />
        </Routes>
      </main>

      {/* ── Footer ── */}
      <Footer
        isDarkBackground={isDarkMode}
        position={isHome ? 'fixed' : 'static'}
      />

      {/* ── Full-screen menu overlay ── */}
      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentPath={location.pathname}
        onNavigate={(path) => {
          navigate(path);
          setIsDarkMode(false);
          setShowHeader(true);
          setIsMenuOpen(false);
        }}
      />

      {/* ── Offer popup ── */}
      <OfferPopup
        isOpen={isOfferPopupOpen && !isMenuOpen}
        onClose={() => setIsOfferPopupOpen(false)}
      />

      {/* ── Cookie consent ── */}
      <CookieConsent />

      {/* ── Chatbot ── */}
      <Chatbot />

      {/* ── Vercel Analytics ── */}
      <Analytics />
    </div>
  );
};

// ─── Root export — wraps everything in BrowserRouter ──────────────────────
const App: React.FC = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);

export default App;