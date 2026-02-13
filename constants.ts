import { Project } from './types';

export const FIRM_NAME = "SHAPES & SHADES";
export const FOUNDED_YEAR = 2019;

// Array of video backgrounds for the Home carousel
export const HERO_VIDEOS = [
  "https://videos.pexels.com/video-files/7578544/7578544-uhd_3840_2160_30fps.mp4", // Aesthetic Interior (Beige tones)
  "https://videos.pexels.com/video-files/3773487/3773487-uhd_3840_2160_25fps.mp4", // Modern Living Room (High Quality)
  "https://videos.pexels.com/video-files/6774649/6774649-uhd_3840_2160_25fps.mp4"  // Office/Interior Pan
];

export const ABOUT_TEXT = [
  "Founded on 9th September 2019 by Architects Sohan Suthar and Sumit Kalle, Shapes & Shades is a full-service design and consulting firm rooted in thoughtful design, technical precision, and timeless aesthetics.",
  "We specialize in architecture, interior design, and construction administration, offering truly end-to-end solutions—from concept development and detailed design to execution support and on-site coordination. Every project is approached as a unique story, where form, function, and feeling come together seamlessly.",
  "At Shapes & Shades, we believe great design is not just seen—it is experienced. Our process is collaborative, detail-driven, and client-centric, ensuring that each space reflects purpose, personality, and long-term value. Whether it’s a residence, commercial space, or large-scale development, we balance creativity with practicality to deliver spaces that are elegant, efficient, and enduring.",
  "With a strong foundation in design excellence and construction understanding, we transform ideas into well-crafted realities—shaping spaces, defining shades, and creating environments that inspire."
];

// Helper to generate gallery images (mocking with random Unsplash arch/interior images)
const GALLERY_MOCK = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1280&q=75&auto=format&fit=crop&fm=webp',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1280&q=75&auto=format&fit=crop&fm=webp',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1280&q=75&auto=format&fit=crop&fm=webp',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1280&q=75&auto=format&fit=crop&fm=webp',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1280&q=75&auto=format&fit=crop&fm=webp'
];

export const PROJECTS: Project[] = [
  {
    id: '1',
    title: 'JREDDY VILLA',
    location: 'Hyderabad',
    category: 'Villas',
    imageUrl: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800&q=75&auto=format&fit=crop&fm=webp',
    gallery: GALLERY_MOCK
  },
  {
    id: '2',
    title: 'CIVIL LINES VILLA',
    location: 'Jaipur',
    category: 'Villas',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=75&auto=format&fit=crop&fm=webp',
    gallery: GALLERY_MOCK
  },
  {
    id: '3',
    title: 'SKYLINE PENTHOUSE',
    location: 'Mumbai',
    category: 'Luxe Interiors',
    imageUrl: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=800&q=75&auto=format&fit=crop&fm=webp',
    gallery: GALLERY_MOCK
  },
  {
    id: '4',
    title: 'AURORA WORKSPACE',
    location: 'Bangalore',
    category: 'Workspaces',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=75&auto=format&fit=crop&fm=webp',
    gallery: GALLERY_MOCK
  },
  {
    id: '5',
    title: 'ZENITH CLUB HOUSE',
    location: 'Pune',
    category: 'Club Houses',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=75&auto=format&fit=crop&fm=webp',
    gallery: GALLERY_MOCK
  },
  {
    id: '6',
    title: 'OPUS EXPERIENCE',
    location: 'Delhi',
    category: 'Experience Centers',
    imageUrl: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800&q=75&auto=format&fit=crop&fm=webp',
    gallery: GALLERY_MOCK
  }
];

export const HERO_SLIDES = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1280&q=75&auto=format&fit=crop&fm=webp',
    tagline: "We focus on quality, and excellent 'design service', as being the cornerstone of our practice."
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1280&q=75&auto=format&fit=crop&fm=webp',
    tagline: "Shaping spaces, defining shades, and creating environments that inspire."
  }
];