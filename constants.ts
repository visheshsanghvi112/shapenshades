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

// Project gallery images from real shoots
const GALLERY_MATUNGA = [
  '/matunga/A1.jpg', '/matunga/A3.jpg', '/matunga/A4.jpg', '/matunga/A6.jpg',
  '/matunga/b1.jpg', '/matunga/b2.jpg', '/matunga/b3.jpg', '/matunga/b4.jpg',
  '/matunga/b5.jpg', '/matunga/b6.jpg', '/matunga/b8.jpg', '/matunga/B11.jpg',
  '/matunga/B13.jpg', '/matunga/B14.jpg', '/matunga/B16.jpg', '/matunga/B19.jpg',
  '/matunga/B21.jpg', '/matunga/B26.jpg', '/matunga/B28.jpg', '/matunga/B29.jpg'
];

const GALLERY_JUHU = [
  '/juhu/IMG_6992.JPG', '/juhu/IMG_6998.JPG', '/juhu/IMG_6999.JPG',
  '/juhu/IMG_7001.JPG', '/juhu/IMG_7002.JPG', '/juhu/IMG_7005.JPG',
  '/juhu/IMG_7007.JPG', '/juhu/IMG_7008.JPG', '/juhu/IMG_7010.JPG',
  '/juhu/IMG_7014.JPG', '/juhu/IMG_7015.JPG', '/juhu/IMG_7016.JPG',
  '/juhu/IMG_7018.JPG', '/juhu/IMG_7020.JPG', '/juhu/IMG_7028.JPG'
];

const GALLERY_BANDRA = [
  '/bandra/IMG_7696.JPG', '/bandra/IMG_7699.JPG', '/bandra/IMG_7701.JPG',
  '/bandra/IMG_7702.JPG', '/bandra/IMG_7706.JPG', '/bandra/IMG_7708.JPG',
  '/bandra/IMG_7709.JPG', '/bandra/IMG_7714.JPG', '/bandra/IMG_7715.JPG',
  '/bandra/IMG_7719.JPG', '/bandra/IMG_7720.JPG', '/bandra/IMG_7722.JPG',
  '/bandra/IMG_7724.JPG', '/bandra/IMG_7726.JPG', '/bandra/IMG_7728.JPG'
];

export const PROJECTS: Project[] = [
  // --- Real Projects ---
  {
    id: '1',
    title: 'MATUNGA RESIDENCE',
    location: 'Mumbai',
    category: 'Luxe Interiors',
    imageUrl: '/matunga/LR3.jpg',
    gallery: GALLERY_MATUNGA
  },
  {
    id: '2',
    title: 'JUHU VILLA',
    location: 'Mumbai',
    category: 'Villas',
    imageUrl: '/juhu/IMG_6992.JPG',
    gallery: GALLERY_JUHU
  },
  {
    id: '3',
    title: 'BANDRA PENTHOUSE',
    location: 'Mumbai',
    category: 'Luxe Interiors',
    imageUrl: '/bandra/IMG_7696.JPG',
    gallery: GALLERY_BANDRA
  },
  // --- Portfolio Projects (using real images) ---
  {
    id: '4',
    title: 'JREDDY VILLA',
    location: 'Hyderabad',
    category: 'Villas',
    imageUrl: '/matunga/GH2.jpg',
    gallery: ['/matunga/GH2.jpg', '/matunga/GH6.jpg', '/matunga/GH7.jpg', '/matunga/GH20.jpg', '/matunga/GH22.jpg', '/matunga/GH26.jpg']
  },
  {
    id: '5',
    title: 'CIVIL LINES VILLA',
    location: 'Jaipur',
    category: 'Villas',
    imageUrl: '/matunga/BV1.jpg',
    gallery: ['/matunga/BV1.jpg', '/matunga/bv3.jpg', '/matunga/bv4.jpg', '/matunga/bv10.jpg', '/matunga/bv14.jpg', '/matunga/bv16.jpg']
  },
  {
    id: '6',
    title: 'SKYLINE PENTHOUSE',
    location: 'Mumbai',
    category: 'Luxe Interiors',
    imageUrl: '/matunga/S4.jpg',
    gallery: ['/matunga/s1.jpg', '/matunga/s3.jpg', '/matunga/S4.jpg', '/matunga/s5.jpg', '/matunga/S7.jpg', '/matunga/S8.jpg']
  },
  {
    id: '7',
    title: 'AURORA WORKSPACE',
    location: 'Bangalore',
    category: 'Workspaces',
    imageUrl: '/matunga/NO1.jpg',
    gallery: ['/matunga/NO1.jpg', '/matunga/NO6.jpg', '/matunga/NO9.jpg', '/matunga/NO20.jpg', '/matunga/c1.jpg', '/matunga/C13.jpg']
  },
  {
    id: '8',
    title: 'ZENITH CLUB HOUSE',
    location: 'Pune',
    category: 'Club Houses',
    imageUrl: '/matunga/SR1.jpg',
    gallery: ['/matunga/SR1.jpg', '/matunga/SR3.jpg', '/matunga/SR4.jpg', '/matunga/DT1.jpg', '/matunga/tb1.jpg', '/matunga/tb2.jpg']
  },
  {
    id: '9',
    title: 'OPUS EXPERIENCE',
    location: 'Delhi',
    category: 'Experience Centers',
    imageUrl: '/matunga/GHF3.jpg',
    gallery: ['/matunga/GHF3.jpg', '/matunga/GHF5.jpg', '/matunga/GHF18.jpg', '/matunga/GHF21.jpg', '/matunga/T5.jpg', '/matunga/t11.jpg']
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