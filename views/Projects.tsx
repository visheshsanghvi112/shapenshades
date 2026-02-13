import React, { useState, useEffect, useRef } from 'react';
import { PROJECTS } from '../constants';
import { Project, ViewProps } from '../types';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

const CATEGORIES = ['SHOW ALL', 'VILLAS', 'LUXE INTERIORS', 'ARCHITECTURE (R)', 'ARCHITECTURE (C)', 'CLUB HOUSES', 'EXPERIENCE CENTERS', 'WORKSPACES'];

const HEADER_QUOTES = [
  { text: "Committed to delivering", highlight: "'bespoke and contemporary'", suffix: "projects of the highest standard." },
  { text: "Where", highlight: "'form meets function'", suffix: "in every space we create." },
  { text: "Designing spaces that", highlight: "'inspire and endure'", suffix: "for generations to come." },
  { text: "Crafting environments with", highlight: "'precision and soul'", suffix: "at every scale." },
  { text: "Transforming visions into", highlight: "'timeless realities'", suffix: "one detail at a time." },
  { text: "Architecture rooted in", highlight: "'purpose and elegance'", suffix: "that speaks for itself." },
  { text: "Every project is a", highlight: "'dialogue between light and space'", suffix: "shaped with intent." },
  { text: "We believe in", highlight: "'thoughtful design'", suffix: "that balances beauty with practicality." },
  { text: "Shaping the future through", highlight: "'innovative design thinking'", suffix: "and meticulous execution." },
  { text: "Building legacies with", highlight: "'creative integrity'", suffix: "and lasting impact." },
];

// Fallback image in case Unsplash links expire or fail
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000';

const Projects: React.FC<ViewProps> = ({ setIsDarkMode }) => {
  const [activeFilter, setActiveFilter] = useState('SHOW ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteFading, setQuoteFading] = useState(false);

  // Rotate quotes every 5 seconds with fade
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFading(true);
      setTimeout(() => {
        setQuoteIndex(prev => (prev + 1) % HEADER_QUOTES.length);
        setQuoteFading(false);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // When selectedProject changes, update the dark mode state
  useEffect(() => {
    if (selectedProject) {
      console.log(`[Projects] Opening detail view for: ${selectedProject.title}`);
      setIsDarkMode(true);
      window.scrollTo(0, 0);
    } else {
      console.log('[Projects] Returning to grid view');
      setIsDarkMode(false);
    }
    // Cleanup on unmount or change
    return () => setIsDarkMode(false);
  }, [selectedProject, setIsDarkMode]);

  // Debugging logs for filters
  useEffect(() => {
    console.log(`[Projects] Active Filter changed to: ${activeFilter}`);
  }, [activeFilter]);

  // Intersection Observer for Scroll Animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Animate in: Remove hidden state, add visible state
          entry.target.classList.remove('opacity-0', 'translate-y-16');
          entry.target.classList.add('opacity-100', 'translate-y-0');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll('.project-card');
    console.log(`[Projects] Observing ${cards.length} cards for animation.`);
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [activeFilter, selectedProject]); // Re-run whenever the DOM list changes (filter or view change)

  const filteredProjects = activeFilter === 'SHOW ALL' 
    ? PROJECTS 
    : PROJECTS.filter(p => p.category.toUpperCase() === activeFilter);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`[Projects] Image load failed: ${e.currentTarget.src}`);
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  // --- DETAIL VIEW ---
  if (selectedProject) {
    return (
      <div className="w-full min-h-screen bg-white animate-fade-in">
        
        {/* Project Hero Section - Dark Background */}
        <div className="w-full h-screen bg-black flex flex-col justify-center items-center text-white relative px-6">
          <div className="text-center space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-sans font-bold tracking-tight">
              {selectedProject.title}
            </h1>
            <p className="text-lg md:text-2xl font-light tracking-widest uppercase opacity-80">
              {selectedProject.location}
            </p>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-10 animate-bounce opacity-50">
             <div className="w-0.5 h-12 bg-white mx-auto"></div>
          </div>
        </div>

        {/* Navigation Back */}
        <button 
            onClick={() => setSelectedProject(null)}
            className="fixed top-24 left-6 z-40 text-white mix-blend-difference flex items-center space-x-2 text-sm font-bold tracking-widest uppercase hover:opacity-70 transition-opacity"
        >
            <ArrowLeft size={20} />
            <span>Back to Projects</span>
        </button>

        {/* Gallery Section */}
        <div className="w-full bg-white py-24 px-6 md:px-12 lg:px-24">
            <div className="max-w-7xl mx-auto space-y-12 md:space-y-24">
                {/* Project Brief */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                   <div className="md:col-span-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Project Brief</h3>
                      <p className="text-2xl font-serif-display text-black">A thoughtful exploration of space and light.</p>
                   </div>
                   <div className="md:col-span-8">
                      <p className="text-gray-600 leading-relaxed text-lg">
                        This project represents a dialogue between modern aesthetics and functional living. 
                        Every corner is designed to maximize natural light and air flow, creating a sanctuary 
                        within the urban environment. The materials palette consists of natural stones, 
                        warm woods, and exposed concrete.
                      </p>
                   </div>
                </div>

                {/* Images */}
                <div className="space-y-6 md:space-y-12">
                    {selectedProject.gallery.map((img, idx) => (
                        <div key={idx} className="w-full">
                            <img 
                                src={img} 
                                onError={handleImageError}
                                alt={`${selectedProject.title} - ${idx}`} 
                                className="w-full h-auto object-cover max-h-[90vh]"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    );
  }

  // --- GRID VIEW ---
  return (
    <div className="w-full min-h-screen bg-white pt-32 pb-20">
      
      {/* Header Section */}
      <div className="px-6 md:px-12 lg:px-24 text-center mb-16 animate-fade-in">
        <h2 className={`text-2xl md:text-4xl lg:text-5xl font-serif-display text-gray-900 leading-tight mb-8 transition-opacity duration-500 ${quoteFading ? 'opacity-0' : 'opacity-100'}`}>
          {HEADER_QUOTES[quoteIndex].text} <span className="font-bold italic">{HEADER_QUOTES[quoteIndex].highlight}</span><br className="hidden md:block"/> {HEADER_QUOTES[quoteIndex].suffix}
        </h2>
        
        {/* Filter Scrollable Area */}
        <div className="flex overflow-x-auto no-scrollbar justify-start md:justify-center items-center space-x-6 md:space-x-8 py-4 px-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`text-xs md:text-sm tracking-widest uppercase whitespace-nowrap transition-colors duration-300 ${
                activeFilter === cat 
                  ? 'text-black font-bold border-b-2 border-black pb-1' 
                  : 'text-gray-400 hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2 lg:gap-4 px-0 md:px-4">
          {filteredProjects.map((project: Project) => (
            <div 
                key={project.id} 
                onClick={() => setSelectedProject(project)}
                // Animation logic: Start invisible and translated down
                className="project-card group relative w-full aspect-[3/4] overflow-hidden cursor-pointer bg-gray-100 opacity-0 translate-y-16 transition-all duration-700 ease-out"
            >
              <img 
                src={project.imageUrl} 
                onError={handleImageError}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
              />
              {/* Overlay: subtle bottom gradient always, darker on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent group-hover:from-black/70 transition-colors duration-500" />
              
              {/* Content Container */}
              <div className="absolute bottom-0 left-0 w-full p-8 text-white">
                {/* Title: always visible, nudges up on hover */}
                <h3 className="text-2xl font-bold uppercase tracking-wider mb-1 drop-shadow-lg">
                    {project.title}
                </h3>
                {/* Location: always visible at reduced opacity, full on hover */}
                <p className="text-sm font-light tracking-wide drop-shadow-md uppercase opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                    {project.location}
                </p>
                
                {/* Arrow fades in on hover */}
                <div className="flex justify-end opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 mt-2">
                    <ArrowUpRight className="text-white w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Projects;