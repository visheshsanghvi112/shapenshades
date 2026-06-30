import React, { useState, useEffect, useCallback } from 'react';
import { HERO_SLIDES, HERO_VIDEOS } from '../constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ViewProps } from '../types';
import { useNavigate, Link } from 'react-router-dom';

// Preload all hero images on module load so they're cached before first render
const preloadedImages: HTMLImageElement[] = [];
HERO_SLIDES.forEach(slide => {
  const img = new Image();
  img.src = slide.imageUrl;
  preloadedImages.push(img);
});

const VideoSlide: React.FC<{ url: string; onVideoError: () => void }> = ({ url, onVideoError }) => {
  const [isReady, setIsReady] = useState(false);

  return (
    <>
      <video
        key={url}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80&auto=format&fit=crop"
        onCanPlay={() => setIsReady(true)}
        onError={onVideoError}
        className={`absolute min-w-full min-h-full object-cover transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-0'}`}
      >
        <source src={url} type="video/mp4" />
      </video>
      <div className={`absolute inset-0 bg-black/30 transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-0'}`}></div>
      {/* H1 is visually rendered as an overlay — Google needs to see rendered H1 content.
          Source: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics */}
      <div className={`absolute inset-0 flex items-center justify-center z-10 px-6 transition-all duration-1000 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif-display text-white text-center leading-tight drop-shadow-2xl">
          Luxury Architects &amp; Interior Designers<br />
          <span className="font-light italic opacity-90">Bhayandar East, Mumbai</span>
        </h1>
      </div>
    </>
  );
};

const Home: React.FC<ViewProps> = ({ setIsDarkMode }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Combine videos and images into a single slides array
  const slides = [
    ...HERO_VIDEOS.map(url => ({ type: 'video', url, tagline: null })),
    ...HERO_SLIDES.map(s => ({ type: 'image', url: s.imageUrl, tagline: s.tagline }))
  ];

  const activeSlide = slides[currentSlide];

  useEffect(() => {
    setIsDarkMode(false);
    const timer = setTimeout(() => setIsLoaded(true), 800);
    return () => clearTimeout(timer);
  }, [setIsDarkMode]);

  // Removed auto-advance effect for images as requested.

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleVideoError = () => {
    console.warn(`Video failed to play: ${activeSlide.url}`);
    // Immediately skip to next slide if video fails
    nextSlide();
  };

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-[#f8f8f8] flex items-center justify-center z-0 text-black">
        <div className="w-12 h-12 border-t-2 border-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#f8f8f8] overflow-hidden group">

      {/* Slide Content */}
      <div className="absolute inset-0 w-full h-full">
        {activeSlide.type === 'video' ? (
          <VideoSlide url={activeSlide.url} onVideoError={handleVideoError} />
        ) : (
          <>
          <Link to="/projects" className="absolute inset-0 w-full h-full block">
            <div className="absolute inset-0 w-full h-full animate-fade-in">
              <img
                src={activeSlide.url}
                alt="Shape N Shades | Architecture & Interior Design in Mumbai"
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
            {/* Dark overlay for images */}
            <div className="absolute inset-0 bg-black/30"></div>
            {/* H1 always rendered in DOM so Googlebot can read it.
                On image slides, we show it as a visible overlay with location keyword.
                Source: https://developers.google.com/search/docs/fundamentals/seo-starter-guide */}
            <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
              {activeSlide.tagline ? (
                <>
                  <h1 className="sr-only">Luxury Architects &amp; Interior Designers in Bhayandar East, Mumbai</h1>
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif-display text-white text-center leading-tight">
                    {activeSlide.tagline}
                  </h2>
                </>
              ) : (
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif-display text-white text-center leading-tight drop-shadow-2xl">
                  Luxury Architects &amp; Interior Designers<br />
                  <span className="font-light italic opacity-90">Bhayandar East, Mumbai</span>
                </h1>
              )}
            </div>
          </Link>
          </>
        )}
      </div>

      {/* Navigation Arrows - Visible on mobile now */}
      <button
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-2 md:left-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-20"
      >
        <ChevronLeft size={48} strokeWidth={1} />
      </button>
      <button
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-2 md:right-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-20"
      >
        <ChevronRight size={48} strokeWidth={1} />
      </button>

      {/* Progress Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex space-x-4 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${idx === currentSlide ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;