import { Project } from './types';

export const FIRM_NAME = "SHAPES & SHADES";
export const FOUNDED_YEAR = 2019;

// Array of video backgrounds for the Home carousel
export const HERO_VIDEOS = [
  "https://videos.pexels.com/video-files/7578544/7578544-uhd_3840_2160_30fps.mp4" // Aesthetic Interior (Beige tones)
];

export const ABOUT_TEXT = [
  "Founded on 9th September 2019 by Architect Sohan Suthar, Shapes & Shades is a full-service design and consulting firm rooted in thoughtful design, technical precision, and timeless aesthetics.",
  "We specialize in architecture, interior design, and construction administration, offering truly end-to-end solutions from concept development and detailed design to execution support and on-site coordination. Every project is approached as a unique story, where form, function, and feeling come together seamlessly.",
  "At Shapes & Shades, we believe great design is not just seen—it is experienced. Our process is collaborative, detail-driven, and client-centric, ensuring that each space reflects purpose, personality, and long-term value. Whether it’s a residence, commercial space, or large scale development, we balance creativity with practicality to deliver spaces that are elegant, efficient, and enduring.",
  "With a strong foundation in design excellence and construction understanding, we transform ideas into well-crafted realities shaping spaces, defining shades, and creating environments that inspire."
];

// Project gallery images from real shoots (max 6 per project, no repeats)
const GALLERY_MATUNGA = [
  '/matunga/A1.jpg', '/matunga/A3.jpg', '/matunga/A4.jpg',
  '/matunga/A6.jpg', '/matunga/b1.jpg', '/matunga/b2.jpg'
];

const GALLERY_JUHU = [
  '/juhu/IMG_6998.JPG', '/juhu/IMG_6999.JPG', '/juhu/IMG_7001.JPG',
  '/juhu/IMG_7005.JPG', '/juhu/IMG_7007.JPG', '/juhu/IMG_7010.JPG'
];

const GALLERY_BANDRA = [
  '/bandra/IMG_7699.JPG', '/bandra/IMG_7701.JPG', '/bandra/IMG_7706.JPG',
  '/bandra/IMG_7709.JPG', '/bandra/IMG_7715.JPG', '/bandra/IMG_7722.JPG'
];

export const PROJECTS: Project[] = [
  // --- ARCHITECTURE (3 projects) ---
  {
    id: '1',
    title: 'JUHU VILLA',
    location: 'Mumbai',
    category: 'Villas',
    type: 'ARCHITECTURE',
    subCategory: 'RESIDENTIAL',
    imageUrl: '/juhu/IMG_6992.JPG',
    galleries: {
      finished: GALLERY_JUHU,
      development: []
    },
    published: true
  },
  {
    id: '2',
    title: 'JREDDY VILLA',
    location: 'Hyderabad',
    category: 'Villas',
    type: 'ARCHITECTURE',
    subCategory: 'RESIDENTIAL',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80&auto=format&fit=crop',
    galleries: {
      finished: ['/matunga/GH2.jpg', '/matunga/GH6.jpg', '/matunga/GH7.jpg', '/matunga/GH20.jpg', '/matunga/GH22.jpg', '/matunga/GH26.jpg'],
      development: []
    },
    published: true
  },
  {
    id: '3',
    title: 'ZENITH CLUB HOUSE',
    location: 'Pune',
    category: 'Club Houses',
    type: 'ARCHITECTURE',
    subCategory: 'HOSPITALITY',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80&auto=format&fit=crop',
    galleries: {
      finished: ['/matunga/SR1.jpg', '/matunga/SR3.jpg', '/matunga/SR4.jpg', '/matunga/DT1.jpg', '/matunga/tb1.jpg', '/matunga/tb2.jpg'],
      development: []
    },
    published: true
  },

  // --- INTERIOR DESIGN (3 projects) ---
  {
    id: '4',
    title: 'MATUNGA RESIDENCE',
    location: 'Mumbai',
    category: 'Luxe Interiors',
    type: 'INTERIOR DESIGN',
    subCategory: 'RESIDENTIAL',
    imageUrl: '/matunga/LR3.jpg',
    galleries: {
      finished: GALLERY_MATUNGA,
      development: []
    },
    published: true
  },
  {
    id: '5',
    title: 'BANDRA PENTHOUSE',
    location: 'Mumbai',
    category: 'Luxe Interiors',
    type: 'INTERIOR DESIGN',
    subCategory: 'RESIDENTIAL',
    imageUrl: '/bandra/IMG_7696.JPG',
    galleries: {
      finished: GALLERY_BANDRA,
      development: []
    },
    published: true
  },
  {
    id: '6',
    title: 'AURORA WORKSPACE',
    location: 'Bangalore',
    category: 'Workspaces',
    type: 'INTERIOR DESIGN',
    subCategory: 'COMMERCIAL',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80&auto=format&fit=crop',
    galleries: {
      finished: ['/matunga/NO1.jpg', '/matunga/NO6.jpg', '/matunga/NO9.jpg', '/matunga/NO20.jpg', '/matunga/c1.jpg', '/matunga/C13.jpg'],
      development: []
    },
    published: true
  },

  // --- LANDSCAPE (3 projects) ---
  {
    id: '7',
    title: 'CENTRAL PARK GARDENS',
    location: 'Delhi',
    category: 'Urban Gardens',
    type: 'LANDSCAPE',
    subCategory: 'COMMERCIAL',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80&auto=format&fit=crop',
    galleries: {
      finished: ['/matunga/s1.jpg', '/matunga/s3.jpg', '/matunga/S4.jpg', '/matunga/s5.jpg', '/matunga/S7.jpg', '/matunga/S8.jpg'],
      development: []
    },
    published: true
  },
  {
    id: '8',
    title: 'LOTUS COURTYARD',
    location: 'Jaipur',
    category: 'Residential Landscape',
    type: 'LANDSCAPE',
    subCategory: 'RESIDENTIAL',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1600&q=80&auto=format&fit=crop',
    galleries: {
      finished: ['/matunga/BV1.jpg', '/matunga/bv3.jpg', '/matunga/bv4.jpg', '/matunga/bv10.jpg', '/matunga/bv14.jpg', '/matunga/bv16.jpg'],
      development: []
    },
    published: true
  },
  {
    id: '9',
    title: 'ROOFTOP OASIS',
    location: 'Mumbai',
    category: 'Rooftop Gardens',
    type: 'LANDSCAPE',
    subCategory: 'HOSPITALITY',
    imageUrl: 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=1600&q=80&auto=format&fit=crop',
    galleries: {
      finished: ['/matunga/GHF3.jpg', '/matunga/GHF5.jpg', '/matunga/GHF18.jpg', '/matunga/GHF21.jpg', '/matunga/T5.jpg', '/matunga/t11.jpg'],
      development: []
    },
    published: true
  }
];

export const HERO_SLIDES = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80&auto=format&fit=crop',
    tagline: 'Crafting spaces that inspire'
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80&auto=format&fit=crop',
    tagline: 'Where design meets emotion'
  }
];