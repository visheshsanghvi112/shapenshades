import React, { useEffect } from 'react';
import { ViewProps } from '../types';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const MumbaiSEO: React.FC<ViewProps> = ({ setIsDarkMode }) => {
    useEffect(() => {
        setIsDarkMode(false);
    }, [setIsDarkMode]);

    return (
        <div className="bg-[#f8f8f8] min-h-screen pt-32 pb-20 px-6 md:px-12 lg:px-24">
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto mb-20 text-center">
                <h1 className="text-4xl md:text-6xl font-serif-display font-semibold text-black mb-6 leading-tight">
                    Top Interior Designers in Mumbai
                </h1>
                <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                    Shape N Shades is a premium architecture and interior design studio offering luxury
                    residential, villa, and commercial interior solutions across Mumbai. We specialize
                    in transforming spaces with elegance, functionality, and timeless design.
                </p>
                <button
                    onClick={() => { window.location.hash = 'contact'; }}
                    className="mt-8 bg-black text-white px-8 py-4 rounded-none hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm inline-flex items-center gap-3"
                >
                    Book a Consultation <ArrowRight size={16} />
                </button>
            </section>

            {/* Services Section */}
            <section className="max-w-7xl mx-auto mb-20 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="bg-white p-10 shadow-sm border border-gray-100">
                    <h3 className="font-serif-display text-2xl font-semibold mb-4 text-black">Luxury Residential Interiors</h3>
                    <p className="text-gray-600 leading-relaxed">
                        Elevate your lifestyle with bespoke interior design for high-end apartments and residences in Mumbai. We blend
                        aesthetics with comfort to create your dream home.
                    </p>
                </div>
                <div className="bg-white p-10 shadow-sm border border-gray-100">
                    <h3 className="font-serif-display text-2xl font-semibold mb-4 text-black">Villa Design & Architecture</h3>
                    <p className="text-gray-600 leading-relaxed">
                        From architectural planning to interior execution, we craft grand and expansive villas that reflect
                        sophistication and personal style.
                    </p>
                </div>
                <div className="bg-white p-10 shadow-sm border border-gray-100">
                    <h3 className="font-serif-display text-2xl font-semibold mb-4 text-black">Commercial Workspaces</h3>
                    <p className="text-gray-600 leading-relaxed">
                        Design modern, productivity-enhancing office spaces and corporate interiors tailored to your brand identity
                        and operational needs.
                    </p>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="bg-white p-12 md:p-20 shadow-sm border border-gray-100 max-w-5xl mx-auto mb-20">
                <h2 className="text-3xl font-serif-display font-semibold text-center mb-10 text-black">
                    Why Choose Shape N Shades in Mumbai?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700">
                    <ul className="space-y-4 list-disc pl-5">
                        <li><strong>Expertise & Experience:</strong> Years of delivering premium residential and commercial projects.</li>
                        <li><strong>End-to-End Solutions:</strong> From concept and 3D visualization to turnkey execution.</li>
                        <li><strong>Personalized Approach:</strong> Designs tailored strictly to your lifestyle and preferences.</li>
                    </ul>
                    <ul className="space-y-4 list-disc pl-5">
                        <li><strong>Quality Craftsmanship:</strong> Partnering with top vendors to ensure impeccable finishes.</li>
                        <li><strong>Timely Delivery:</strong> Structured project management adhering to strict timelines.</li>
                        <li><strong>Strategic Location:</strong> Based in Bhayandar East, we actively serve clients across the Mumbai metropolitan region.</li>
                    </ul>
                </div>
            </section>

            {/* Contact Section */}
            <section className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-serif-display font-semibold text-black mb-8">
                    Ready to Start Your Project in Mumbai?
                </h2>
                <div className="flex flex-col md:flex-row justify-center gap-8 mb-10 text-gray-700">
                    <a href="mailto:design.shapenshades@gmail.com" className="flex items-center justify-center gap-2 hover:text-black transition-colors">
                        <Mail size={20} /> design.shapenshades@gmail.com
                    </a>
                    <a href="tel:+918097241237" className="flex items-center justify-center gap-2 hover:text-black transition-colors">
                        <Phone size={20} /> +91 80972 41237
                    </a>
                    <div className="flex items-center justify-center gap-2">
                        <MapPin size={20} /> Bhayandar East, Mumbai
                    </div>
                </div>
                <button
                    onClick={() => { window.location.hash = 'projects'; }}
                    className="bg-transparent border border-black text-black px-8 py-4 rounded-none hover:bg-black hover:text-white transition-colors uppercase tracking-widest text-sm"
                >
                    View Our Portfolio
                </button>
            </section>
        </div>
    );
};

export default MumbaiSEO;
