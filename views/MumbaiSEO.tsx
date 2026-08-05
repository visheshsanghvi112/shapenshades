import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ViewProps } from '../types';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

// ─── FAQPage Structured Data ────────────────────────────────────────────────
// Source: https://developers.google.com/search/docs/appearance/structured-data/faqpage
// Rules: Questions and answers must appear VISIBLY on the page.
// Each FAQ must be accessible to users without JavaScript interaction.
const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does interior design cost in Mumbai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Interior design costs in Mumbai typically range from ₹800 to ₹3,500+ per square foot depending on the scope, materials, and finish level. At Shape N Shades, we offer tailored packages for luxury residential and commercial projects. Contact us for a detailed consultation and quote.'
      }
    },
    {
      '@type': 'Question',
      name: 'Which areas of Mumbai does Shape N Shades serve?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Shape N Shades is headquartered in Dadar East and serves clients across Mumbai, Thane, Bandra, Matunga, Ghatkopar, Kandivali, Mira-Bhayandar, Nashik, and beyond. We travel for the right project — contact us to discuss your location.'
      }
    },
    {
      '@type': 'Question',
      name: 'How long does a full interior design project take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A typical residential interior design project in Mumbai takes 3 to 6 months from concept approval to handover, depending on the size and scope. Larger commercial or villa projects may take 6–12 months. We provide a detailed timeline at the start of every project.'
      }
    },
    {
      '@type': 'Question',
      name: 'Does Shape N Shades handle architecture and construction too?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Shape N Shades is a full-service firm offering architecture, interior design, landscape design, and construction administration. We provide end-to-end solutions from concept drawings and 3D visualization to on-site supervision and final handover.'
      }
    }
  ]
};

// ─── BreadcrumbList for this page ───────────────────────────────────────────
// Source: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://shapenshades.com/' },
    { '@type': 'ListItem', position: 2, name: 'Interior Designers Mumbai', item: 'https://shapenshades.com/interior-designers-mumbai' }
  ]
};

const MumbaiSEO: React.FC<ViewProps> = ({ setIsDarkMode }) => {
  useEffect(() => {
    setIsDarkMode(false);

    // Inject FAQPage + BreadcrumbList schema into <head>
    // These are page-specific and must only live on this route.
    // Source: https://developers.google.com/search/docs/appearance/structured-data/faqpage
    const injectSchema = (id: string, data: object) => {
      let el = document.getElementById(id) as HTMLScriptElement | null;
      if (!el) {
        el = document.createElement('script');
        el.id = id;
        el.type = 'application/ld+json';
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    };

    injectSchema('schema-faq', FAQ_SCHEMA);
    injectSchema('schema-breadcrumb-mumbai', BREADCRUMB_SCHEMA);

    // Cleanup on unmount — remove page-specific schema so it doesn't bleed onto other pages
    return () => {
      document.getElementById('schema-faq')?.remove();
      document.getElementById('schema-breadcrumb-mumbai')?.remove();
    };
  }, [setIsDarkMode]);

  return (
    <div className="bg-[#f8f8f8] min-h-screen pt-32 pb-20 px-6 md:px-12 lg:px-24">

      {/* ── Hero Section ── */}
      <section className="max-w-7xl mx-auto mb-20 text-center">
        {/* H1 must use the primary keyword.
            Source: https://developers.google.com/search/docs/fundamentals/seo-starter-guide */}
        <h1 className="text-4xl md:text-6xl font-serif-display font-semibold text-black mb-6 leading-tight">
          Top Interior Designers in Mumbai
        </h1>
        <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
          Shape N Shades is a premium architecture and interior design studio offering luxury
          residential, villa, and commercial interior solutions across Mumbai. We specialize
          in transforming spaces with elegance, functionality, and timeless design.
        </p>
        {/* Use react-router Link for internal navigation — crawlable by Googlebot */}
        <Link
          to="/contact"
          className="mt-8 bg-black text-white px-8 py-4 rounded-none hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm inline-flex items-center gap-3"
        >
          Book a Consultation <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── Services Section ── */}
      <section className="max-w-7xl mx-auto mb-20 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="bg-white p-10 shadow-sm border border-gray-100">
          <h2 className="font-serif-display text-2xl font-semibold mb-4 text-black">Luxury Residential Interiors</h2>
          <p className="text-gray-600 leading-relaxed">
            Elevate your lifestyle with bespoke interior design for high-end apartments and residences in Mumbai. We blend
            aesthetics with comfort to create your dream home.
          </p>
        </div>
        <div className="bg-white p-10 shadow-sm border border-gray-100">
          <h2 className="font-serif-display text-2xl font-semibold mb-4 text-black">Villa Design &amp; Architecture</h2>
          <p className="text-gray-600 leading-relaxed">
            From architectural planning to interior execution, we craft grand and expansive villas that reflect
            sophistication and personal style.
          </p>
        </div>
        <div className="bg-white p-10 shadow-sm border border-gray-100">
          <h2 className="font-serif-display text-2xl font-semibold mb-4 text-black">Commercial Workspaces</h2>
          <p className="text-gray-600 leading-relaxed">
            Design modern, productivity-enhancing office spaces and corporate interiors tailored to your brand identity
            and operational needs.
          </p>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="bg-white p-12 md:p-20 shadow-sm border border-gray-100 max-w-5xl mx-auto mb-20">
        <h2 className="text-3xl font-serif-display font-semibold text-center mb-10 text-black">
          Why Choose Shape N Shades in Mumbai?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700">
          <ul className="space-y-4 list-disc pl-5">
            <li><strong>Expertise &amp; Experience:</strong> Years of delivering premium residential and commercial projects.</li>
            <li><strong>End-to-End Solutions:</strong> From concept and 3D visualization to turnkey execution.</li>
            <li><strong>Personalized Approach:</strong> Designs tailored strictly to your lifestyle and preferences.</li>
          </ul>
          <ul className="space-y-4 list-disc pl-5">
            <li><strong>Quality Craftsmanship:</strong> Partnering with top vendors to ensure impeccable finishes.</li>
            <li><strong>Timely Delivery:</strong> Structured project management adhering to strict timelines.</li>
            <li><strong>Strategic Location:</strong> Based in Dadar East, we actively serve clients across the Mumbai metropolitan region.</li>
          </ul>
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────────────────────
           These FAQs must be VISIBLE on the page to qualify for rich results.
           Source: https://developers.google.com/search/docs/appearance/structured-data/faqpage
           ─────────────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto mb-20">
        <h2 className="text-3xl font-serif-display font-semibold text-center mb-12 text-black">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {FAQ_SCHEMA.mainEntity.map((item, idx) => (
            <details
              key={idx}
              className="bg-white border border-gray-100 shadow-sm p-6 group cursor-pointer"
              open={idx === 0}
            >
              <summary className="font-semibold text-lg text-black list-none flex justify-between items-center gap-4 select-none">
                {item.name}
                <span className="text-gray-400 group-open:rotate-45 transition-transform duration-300 text-2xl flex-shrink-0">+</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {item.acceptedAnswer.text}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Contact CTA ── */}
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
            <MapPin size={20} /> Dadar East, Mumbai
          </div>
        </div>
        {/* Internal link — use react-router Link so Googlebot crawls it */}
        <Link
          to="/projects"
          className="bg-transparent border border-black text-black px-8 py-4 rounded-none hover:bg-black hover:text-white transition-colors uppercase tracking-widest text-sm inline-block"
        >
          View Our Portfolio
        </Link>
      </section>
    </div>
  );
};

export default MumbaiSEO;
