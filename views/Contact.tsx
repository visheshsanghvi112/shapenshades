import React, { useEffect, useState } from 'react';
import { ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { ViewProps } from '../types';
import { db } from '../src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { trackContactSubmission } from '../src/analytics';

const Contact: React.FC<ViewProps> = ({ setIsDarkMode }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    setIsDarkMode(false);
  }, [setIsDarkMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setStatus('sending');
    try {
      await addDoc(collection(db, 'contactSubmissions'), {
        ...formData,
        createdAt: serverTimestamp(),
        source: 'contact_page',
      });
      trackContactSubmission();
      setStatus('sent');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      console.error('[Contact] Firestore write failed', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

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
          <form className="space-y-10" onSubmit={handleSubmit}>
            <div className="relative group">
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
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
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-gray-300 py-3 text-lg outline-none focus:border-black transition-all" 
                placeholder=" "
              />
              <label className="absolute left-0 top-3 text-gray-400 pointer-events-none transition-all duration-300 group-focus-within:-top-4 group-focus-within:text-xs group-focus-within:text-black">
                Phone Number
              </label>
            </div>

            <div className="relative group pt-4">
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3} 
                className="w-full bg-transparent border-b border-gray-300 py-3 text-lg outline-none focus:border-black transition-all resize-none" 
                placeholder=" "
              ></textarea>
              <label className="absolute left-0 top-7 text-gray-400 pointer-events-none transition-all duration-300 group-focus-within:top-0 group-focus-within:text-xs group-focus-within:text-black">
                Tell us about your project
              </label>
            </div>

            {status === 'sent' && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Message sent! We'll get back to you soon.</span>
              </div>
            )}
            {status === 'error' && (
              <p className="text-red-500 text-sm">Something went wrong. Please try again or email us directly.</p>
            )}

            <button 
              type="submit"
              disabled={status === 'sending'}
              className="group flex items-center justify-between w-full bg-black text-white py-5 px-6 text-sm font-bold tracking-[0.2em] uppercase hover:bg-gray-800 transition-all mt-8 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{status === 'sending' ? 'Sending...' : status === 'sent' ? 'Sent!' : 'Send Message'}</span>
              {status === 'sending' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Google Map */}
      <div className="max-w-6xl w-full mx-auto mt-20 animate-fade-in-up animation-delay-400">
        <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 mb-6 text-center">Find Us</h3>
        <div className="w-full aspect-[16/9] md:aspect-[21/9] border border-gray-100 overflow-hidden">
          <iframe
            title="Shapes & Shades Studio Location"
            src="https://maps.google.com/maps?q=705+Prathvi+Sadan+BP+Road+Bhayandar+East+Thane+401105&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
};

export default Contact;