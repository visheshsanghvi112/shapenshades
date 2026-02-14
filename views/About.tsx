import React, { useEffect, useState, useRef } from 'react';
import { ABOUT_TEXT, FOUNDED_YEAR } from '../constants';
import { ViewProps } from '../types';
import { Ruler, PenTool, Home as HomeIcon, Search, Palette, Hammer, CheckCircle, Quote } from 'lucide-react';

const About: React.FC<ViewProps> = ({ setIsDarkMode }) => {
  useEffect(() => {
    setIsDarkMode(false);

    // Scroll-triggered animation for .about-animate elements
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-12');
            entry.target.classList.add('opacity-100', 'translate-y-0');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const animElements = document.querySelectorAll('.about-animate');
    animElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [setIsDarkMode]);

  // Animated counter hook
  const useCounter = (target: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            const startTime = Date.now();
            const animate = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
              setCount(Math.floor(eased * target));
              if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }
        },
        { threshold: 0.5 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, [target, duration]);

    return { count, ref };
  };

  const yearsCounter = useCounter(new Date().getFullYear() - FOUNDED_YEAR, 1500);
  const projectsCounter = useCounter(45, 2000);
  const citiesCounter = useCounter(8, 1200);

  // Testimonials carousel
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonials = [
    {
      quote: "Shapes & Shades transformed our vision into a space that feels like home and art at the same time. Their attention to detail is unmatched.",
      name: "Rajesh Mehta",
      title: "Villa Owner, Hyderabad"
    },
    {
      quote: "Working with them was seamless from concept to completion. They understood exactly what we needed before we even said it.",
      name: "Priya Sharma",
      title: "Homeowner, Jaipur"
    },
    {
      quote: "The team brought a level of creativity and professionalism that exceeded all our expectations. Our office space is now our competitive advantage.",
      name: "Amit Desai",
      title: "CEO, TechVentures"
    },
    {
      quote: "They don't just design spaces — they design feelings. Every room has a purpose and every corner tells a story.",
      name: "Neha Kapoor",
      title: "Interior Enthusiast, Mumbai"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

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

  const process = [
    { step: '01', icon: <Search size={28} strokeWidth={1.5} />, title: 'Discover', desc: 'Understanding your vision, lifestyle, and aspirations through in-depth consultations and site analysis.' },
    { step: '02', icon: <Palette size={28} strokeWidth={1.5} />, title: 'Design', desc: 'Translating ideas into detailed concepts, mood boards, 3D visualizations, and comprehensive drawings.' },
    { step: '03', icon: <Hammer size={28} strokeWidth={1.5} />, title: 'Develop', desc: 'Precision engineering of every detail — materials, structure, MEP coordination, and vendor management.' },
    { step: '04', icon: <CheckCircle size={28} strokeWidth={1.5} />, title: 'Deliver', desc: 'On-site execution with meticulous quality control, ensuring the built reality matches the designed vision.' },
  ];

  const clients = [
    'Lodha Group', 'Godrej Properties', 'Mahindra Lifespaces', 'Oberoi Realty',
    'Prestige Estates', 'Shapoorji Pallonji', 'Tata Housing', 'DLF Limited'
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

      {/* 2. Our Story Paragraph */}
      <div className="px-6 md:px-12 lg:px-24 mb-32">
        <div className="max-w-4xl mx-auto overflow-hidden">
          <div className="about-animate opacity-0 translate-y-12 transition-all duration-1000 ease-out delay-200">
            <h2 className="text-3xl font-serif-display mb-4 text-center">Our Story</h2>
            <div className="text-base md:text-2xl font-light leading-relaxed text-gray-800 space-y-6 text-justify">
              {ABOUT_TEXT.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Stats Row */}
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 border-t border-gray-100 pt-10 mt-12">
          <div ref={yearsCounter.ref}>
            <p className="text-3xl md:text-4xl font-serif-display mb-1">{yearsCounter.count}+</p>
            <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-gray-400">Years of Excellence</p>
          </div>
          <div ref={projectsCounter.ref}>
            <p className="text-3xl md:text-4xl font-serif-display mb-1">{projectsCounter.count}+</p>
            <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-gray-400">Projects Completed</p>
          </div>
          <div ref={citiesCounter.ref}>
            <p className="text-3xl md:text-4xl font-serif-display mb-1">{citiesCounter.count}</p>
            <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-gray-400">Cities Covered</p>
          </div>
        </div>
      </div>

      {/* 4. Our Process */}
      <div className="w-full py-24 px-6 md:px-12 lg:px-24 mb-32 hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-serif-display mb-4">Our Process</h2>
            <p className="text-gray-500 font-light max-w-2xl mx-auto">
              A structured journey from first conversation to final handover — every step intentional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gray-200 z-0"></div>

            {process.map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-black mb-6 transition-all duration-500 group-hover:bg-black group-hover:text-white group-hover:border-black">
                  {item.icon}
                </div>
                <span className="text-xs font-bold tracking-[0.3em] text-gray-300 uppercase mb-2">{item.step}</span>
                <h3 className="text-lg font-brand font-bold uppercase tracking-wider mb-3">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light px-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Philosophy Section (Gray BG) */}
      <div className="w-full bg-[#f9f9f9] py-24 px-6 md:px-12 lg:px-24 mb-0">
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

      {/* 5. Parallax Image Break */}
      <div className="w-full h-[50vh] md:h-[70vh] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-fixed bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=80&auto=format&fit=crop&fm=webp')" }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex items-center justify-center h-full px-6">
          <blockquote className="text-center max-w-4xl">
            <p className="text-2xl md:text-4xl lg:text-5xl font-serif-display text-white leading-snug italic">
              "Every great building once began as a conversation between a dreamer and a maker."
            </p>
          </blockquote>
        </div>
      </div>

      {/* 6. Leadership Section */}
      <div className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-gray-200 pb-6">
          <h2 className="text-4xl md:text-5xl font-serif-display text-gray-900 mb-2 md:mb-0">Leadership</h2>
          <p className="text-xs md:text-sm font-bold tracking-widest uppercase text-gray-400">The minds behind the design</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Director Image - Left */}
          <div className="group">
            <div className="w-full aspect-[4/5] bg-gray-100 overflow-hidden relative">
              <img
                src="/director1.png"
                alt="Ar. Sohan Suthar"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 border-[1px] border-transparent group-hover:border-white/20 m-4 transition-all duration-500"></div>
            </div>
          </div>

          {/* Director Info - Right */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h3 className="text-3xl md:text-4xl font-brand font-bold uppercase tracking-wider mb-2">Ar. Sohan Suthar</h3>
              <p className="text-sm font-bold tracking-[0.2em] text-gray-500 uppercase">Principal Architect & Founder</p>
            </div>

            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Sohan Suthar is the visionary force behind Shapes & Shades, bringing over a decade of experience in architecture and design.
                His approach combines technical precision with artistic sensibility, creating spaces that are both functional and inspiring.
              </p>
              <p>
                With a deep understanding of urban contexts and a commitment to sustainable design, Sohan has led projects ranging from
                intimate residential interiors to large-scale commercial developments across India.
              </p>
              <p>
                His design philosophy centers on timelessness, craftsmanship, and the belief that great architecture should enhance the
                quality of everyday life.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-gray-600 font-light text-sm italic">
                "Architecture should speak of its time and place, but yearn for timelessness."
              </p>
              <p className="text-xs text-gray-400 mt-1">— Frank Gehry</p>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Trusted By / Client Logos */}
      <div className="w-full bg-white py-24 px-6 md:px-12 lg:px-24 border-t border-gray-100 hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-16">
            <div className="h-px flex-1 bg-gray-200"></div>
            <p className="text-xl md:text-2xl font-bold tracking-[0.3em] uppercase text-black whitespace-nowrap">Trusted by leading names</p>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 md:gap-x-16">
            {clients.map((client, idx) => (
              <div key={idx} className="flex items-center justify-center py-5 group cursor-default relative">
                <span className="text-sm md:text-base font-brand tracking-[0.15em] uppercase text-gray-600 group-hover:text-black transition-colors duration-500">{client}</span>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-full h-px bg-black transition-all duration-500"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 8. Testimonials Carousel */}
      <div className="w-full py-12 md:py-16 px-6 md:px-12 lg:px-24 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <Quote size={40} strokeWidth={1} className="mx-auto text-gray-200 mb-8" />

          <div className="relative min-h-[200px] flex items-center justify-center">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ${idx === activeTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                  }`}
              >
                <p className="text-xl md:text-2xl lg:text-3xl font-serif-display text-gray-800 leading-relaxed italic mb-8">
                  "{t.quote}"
                </p>
                <div>
                  <p className="text-sm font-bold tracking-widest uppercase">{t.name}</p>
                  <p className="text-xs text-gray-400 tracking-wider mt-1">{t.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center space-x-3 mt-12">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTestimonial(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-500 ${idx === activeTestimonial ? 'bg-black w-8' : 'bg-gray-300 hover:bg-gray-500'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default About;