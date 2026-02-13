import React, { useState, useEffect } from 'react';
import { HERO_SLIDES, HERO_VIDEOS } from '../constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ViewProps } from '../types';

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
    // Keep header text black for contrast unless explicitly needed otherwise, 
    // but our image overlay is dark so white text on image works well.
    // The header itself can remain black or switch based on preference.
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
        ) : (
           <div className="absolute inset-0 w-full h-full animate-fade-in">
             <img 
               src={activeSlide.url} 
               alt="Hero Slide" 
               className="w-full h-full object-cover"
             />
             {/* Dark overlay to ensure White text is readable */}
             <div className="absolute inset-0 bg-black/30" />
           </div>
        )}
      </div>

      {/* Text Overlay - Only for Images */}
      {activeSlide.tagline && (
        <div className="absolute inset-0 flex items-center justify-center p-8 z-10 pointer-events-none">
          <div className="max-w-5xl text-center">
            {/* Changed text color to White */}
            <h2 className="text-3xl md:text-5xl lg:text-7xl text-white font-serif-display leading-tight tracking-wide animate-fade-in-up drop-shadow-md">
               {activeSlide.tagline.split("'").map((part, i) => 
                 i % 2 === 1 ? <span key={i} className="font-brand italic font-light text-gray-200">{part}</span> : part
               )}
            </h2>
          </div>
        </div>
      )}

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