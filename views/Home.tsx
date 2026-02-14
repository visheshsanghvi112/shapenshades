import React, { useState, useEffect, useCallback } from 'react';
import { HERO_SLIDES, HERO_VIDEOS } from '../constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ViewProps } from '../types';

// Preload all hero images on module load so they're cached before first render
const preloadedImages: HTMLImageElement[] = [];
HERO_SLIDES.forEach(slide => {
  const img = new Image();
  img.src = slide.imageUrl;
  preloadedImages.push(img);
});

const Home: React.FC<ViewProps> = ({ setIsDarkMode }) => {
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
           <>
             <video 
               key={activeSlide.url} // Key ensures React remounts/updates correctly for different videos
               autoPlay 
               muted 
               loop // Video now loops instead of going to next slide
               playsInline
               onError={handleVideoError} // Fallback if video fails
               className="absolute min-w-full min-h-full object-cover animate-fade-in"
             >
               <source src={activeSlide.url} type="video/mp4" />
             </video>
             {/* Dark overlay for video */}
             <div className="absolute inset-0 bg-black/30"></div>
             {/* Text overlay for video */}
             <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
               <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif-display text-white text-center leading-tight">
                 Design beyond<br />imagination
               </h2>
             </div>
           </>
        ) : (
           <>
             <div 
               className="absolute inset-0 w-full h-full animate-fade-in cursor-pointer"
               onClick={() => { window.location.hash = 'projects'; }}
             >
               <img 
                 src={activeSlide.url} 
                 alt="Shapes & Shades — Architecture & Interior Design" 
                 className="w-full h-full object-cover"
                 loading="eager"
                 decoding="async"
                 fetchPriority="high"
               />
             </div>
             {/* Dark overlay for images */}
             <div className="absolute inset-0 bg-black/30 cursor-pointer" onClick={() => { window.location.hash = 'projects'; }}></div>
             {/* Text overlay for images */}
             {activeSlide.tagline && (
               <div className="absolute inset-0 flex items-center justify-center z-10 px-6 cursor-pointer" onClick={() => { window.location.hash = 'projects'; }}>
                 <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif-display text-white text-center leading-tight">
                   {activeSlide.tagline}
                 </h2>
               </div>
             )}
           </>
        )}
      </div>

      {/* Navigation Arrows - Visible on mobile now */}
      <button 
        onClick={prevSlide}
        className="absolute left-2 md:left-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-20"
      >
        <ChevronLeft size={48} strokeWidth={1} />
      </button>
      <button 
        onClick={nextSlide}
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
            className={`w-2 h-2 rounded-full transition-all duration-500 ${idx === currentSlide ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;