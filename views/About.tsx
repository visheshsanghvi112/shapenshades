import React, { useEffect } from 'react';
import { ABOUT_TEXT, FOUNDED_YEAR } from '../constants';
import { ViewProps } from '../types';
import { Ruler, PenTool, Home as HomeIcon } from 'lucide-react';

const About: React.FC<ViewProps> = ({ setIsDarkMode }) => {
  useEffect(() => {
    setIsDarkMode(false);
  }, [setIsDarkMode]);

  const stats = [
    { label: 'Years of Excellence', value: `${new Date().getFullYear() - FOUNDED_YEAR}+` },
    { label: 'Projects Completed', value: '45+' },
    { label: 'Cities Covered', value: '8' },
  ];

  const philosophy = [
    {
      icon: <PenTool size={32} strokeWidth={1} />,
      title: 'Conceptual Rigor',
      desc: 'Every line drawn on paper has a purpose. We believe in design that starts with a strong narrative and evolves into a tangible reality.'
    },
    {
      icon: <Ruler size={32} strokeWidth={1} />,
      title: 'Technical Precision',
      desc: 'Beauty requires structure. Our construction administration ensures that the vision is executed with millimeter-perfect accuracy.'
    },
    {
      icon: <HomeIcon size={32} strokeWidth={1} />,
      title: 'Timeless Living',
      desc: 'Trends fade, but style endures. We create spaces that age gracefully, focusing on natural materials and sustainable practices.'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-white pt-28 pb-20">
      
      {/* 1. Manifesto / Hero Statement */}
      <div className="px-6 md:px-12 lg:px-24 mb-24 animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-serif-display leading-[1.1] text-black mb-8">
          We don't just build spaces.<br />
          <span className="italic text-gray-400">We curate experiences.</span>
        </h1>
        <div className="w-full h-px bg-gray-200 mt-12"></div>
      </div>

      {/* 2. Split Layout: Image & Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 px-6 md:px-12 lg:px-24 mb-32 items-center">
        {/* Studio Image */}
        <div className="w-full h-[600px] bg-gray-100 relative overflow-hidden group">
           <img 
             src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop" 
             alt="The Studio Workspace" 
             className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
           />
           <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm p-4 max-w-xs">
              <p className="text-xs font-bold tracking-widest uppercase">The Studio</p>
              <p className="text-xs text-gray-500 mt-1">Where ideas take shape.</p>
           </div>
        </div>

        {/* Text Content */}
        <div className="space-y-8">
            <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">Our Story</h3>
            <div className="text-lg md:text-xl font-light leading-relaxed text-gray-800 space-y-6 text-justify">
              {ABOUT_TEXT.slice(0, 2).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-8 border-t border-gray-100 pt-8 mt-8">
              {stats.map((stat, idx) => (
                <div key={idx}>
                  <p className="text-3xl md:text-4xl font-serif-display mb-1">{stat.value}</p>
                  <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
        </div>
      </div>

      {/* 3. Philosophy Section (Gray BG) */}
      <div className="w-full bg-[#f9f9f9] py-24 px-6 md:px-12 lg:px-24 mb-32">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
             <h2 className="text-3xl font-serif-display mb-4">Our Approach</h2>
             <p className="text-gray-500 font-light max-w-2xl mx-auto">
               Design is a non-linear process, but our philosophy remains constant. We bridge the gap between the creative abstract and the concrete reality.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {philosophy.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-4 group">
                <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-black mb-2 transition-colors group-hover:bg-black group-hover:text-white">
                  {item.icon}
                </div>
                <h3 className="text-xl font-brand font-bold uppercase tracking-wider">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-light px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Leadership Section */}
      <div className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-gray-200 pb-6">
              <h2 className="text-4xl md:text-5xl font-serif-display text-gray-900">Leadership</h2>
              <p className="text-sm font-bold tracking-widest uppercase text-gray-400 mt-4 md:mt-0">The minds behind the design</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
              {/* Director 1 */}
              <div className="group">
                  <div className="w-full aspect-[4/5] bg-gray-100 mb-6 overflow-hidden relative">
                      <img 
                          src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1000&auto=format&fit=crop" 
                          alt="Ar. Sohan Suthar" 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      />
                      <div className="absolute inset-0 border-[1px] border-transparent group-hover:border-white/20 m-4 transition-all duration-500"></div>
                  </div>
                  <h3 className="text-2xl font-brand font-bold uppercase tracking-widest mb-1">Ar. Sohan Suthar</h3>
                  <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-4">Principal Architect & Founder</p>
                  <p className="text-gray-600 font-light text-sm leading-relaxed">
                    "Architecture is the learned game, correct and magnificent, of forms assembled in the light."
                  </p>
              </div>

              {/* Director 2 */}
              <div className="group md:mt-16">
                  <div className="w-full aspect-[4/5] bg-gray-100 mb-6 overflow-hidden relative">
                       <img 
                          src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1000&auto=format&fit=crop" 
                          alt="Ar. Sumit Kalle" 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      />
                      <div className="absolute inset-0 border-[1px] border-transparent group-hover:border-white/20 m-4 transition-all duration-500"></div>
                  </div>
                  <h3 className="text-2xl font-brand font-bold uppercase tracking-widest mb-1">Ar. Sumit Kalle</h3>
                  <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-4">Principal Architect & Director</p>
                  <p className="text-gray-600 font-light text-sm leading-relaxed">
                    "We strive to create environments that not only look beautiful but feel right to the soul."
                  </p>
              </div>
          </div>
      </div>

    </div>
  );
};

export default About;