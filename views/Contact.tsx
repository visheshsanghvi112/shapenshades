import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { ViewProps } from '../types';

const Contact: React.FC<ViewProps> = ({ setIsDarkMode }) => {
  useEffect(() => {
    setIsDarkMode(false);
  }, [setIsDarkMode]);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col pt-32 px-6 md:px-12 lg:px-24 pb-20">
      
      {/* Header Statement */}
      <div className="max-w-5xl mx-auto w-full mb-20 text-center animate-fade-in-up">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif-display leading-tight text-black mb-6">
          Start a conversation about <br/>
          <span className="italic text-gray-500">your new space.</span>
        </h2>
        <div className="w-px h-20 bg-black mx-auto mt-8 opacity-20"></div>
      </div>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 animate-fade-in-up animation-delay-200">
        
        {/* Contact Details */}
        <div className="flex flex-col justify-between space-y-12">
            <div>
                <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 mb-8">Studio</h3>
                <address className="not-italic text-xl md:text-2xl font-light leading-relaxed text-gray-800">
                  Shapes & Shades <br/>
                  705, Prathvi Sadan, B.P. Road,<br/>
                  Bhayandar East, Thane<br/>
                  Maharashtra 401105
                </address>
            </div>

            <div>
                <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 mb-8">Connect</h3>
                <div className="flex flex-col space-y-4">
                  <a href="mailto:design.shapenshades@gmail.com" className="text-xl md:text-2xl hover:text-gray-500 transition-colors border-b border-black pb-1 self-start">
                    design.shapenshades@gmail.com
                  </a>
                  <a href="tel:+918097241237" className="text-xl md:text-2xl hover:text-gray-500 transition-colors border-b border-black pb-1 self-start">
                    +91 80972 41237
                  </a>
                </div>
            </div>

            <div className="hidden lg:block pt-12">
                <p className="text-xs text-gray-400 uppercase tracking-widest">
                   Follow our journey on social media
                </p>
            </div>
        </div>

        {/* Minimal Form */}
        <div className="bg-[#fcfcfc] p-8 md:p-12 border border-gray-100">
          <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
            <div className="relative group">
              <input 
                type="text" 
                required
                className="w-full bg-transparent border-b border-gray-300 py-3 text-lg outline-none focus:border-black transition-all" 
                placeholder=" "
              />
              <label className="absolute left-0 top-3 text-gray-400 pointer-events-none transition-all duration-300 group-focus-within:-top-4 group-focus-within:text-xs group-focus-within:text-black">
                Name
              </label>
            </div>

            <div className="relative group">
              <input 
                type="email" 
                required
                className="w-full bg-transparent border-b border-gray-300 py-3 text-lg outline-none focus:border-black transition-all" 
                placeholder=" "
              />
              <label className="absolute left-0 top-3 text-gray-400 pointer-events-none transition-all duration-300 group-focus-within:-top-4 group-focus-within:text-xs group-focus-within:text-black">
                Email Address
              </label>
            </div>

            <div className="relative group">
              <input 
                type="tel" 
                className="w-full bg-transparent border-b border-gray-300 py-3 text-lg outline-none focus:border-black transition-all" 
                placeholder=" "
              />
              <label className="absolute left-0 top-3 text-gray-400 pointer-events-none transition-all duration-300 group-focus-within:-top-4 group-focus-within:text-xs group-focus-within:text-black">
                Phone Number
              </label>
            </div>

            <div className="relative group pt-4">
              <textarea 
                rows={3} 
                className="w-full bg-transparent border-b border-gray-300 py-3 text-lg outline-none focus:border-black transition-all resize-none" 
                placeholder=" "
              ></textarea>
              <label className="absolute left-0 top-7 text-gray-400 pointer-events-none transition-all duration-300 group-focus-within:top-0 group-focus-within:text-xs group-focus-within:text-black">
                Tell us about your project
              </label>
            </div>

            <button className="group flex items-center justify-between w-full bg-black text-white py-5 px-6 text-sm font-bold tracking-[0.2em] uppercase hover:bg-gray-800 transition-all mt-8">
              <span>Send Message</span>
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Contact;