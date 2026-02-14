/**
 * Seed Firestore with default projects from constants.ts
 * Run: node seed-firestore.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBSULRps4GYC8XRi-tqKUMhYzfWPe9VNFc",
  authDomain: "shapenshades-74d41.firebaseapp.com",
  projectId: "shapenshades-74d41",
  storageBucket: "shapenshades-74d41.firebasestorage.app",
  messagingSenderId: "1025632982903",
  appId: "1:1025632982903:web:ba6ba67575316b3cae3372",
  measurementId: "G-QY0X7QKVYE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PROJECTS = [
  {
    id: '1',
    title: 'JUHU VILLA',
    location: 'Mumbai',
    category: 'Villas',
    type: 'ARCHITECTURE',
    subCategory: 'RESIDENTIAL',
    imageUrl: '/juhu/IMG_6992.JPG',
    galleries: {
      finished: ['/juhu/IMG_6998.JPG', '/juhu/IMG_6999.JPG', '/juhu/IMG_7001.JPG', '/juhu/IMG_7005.JPG', '/juhu/IMG_7007.JPG', '/juhu/IMG_7010.JPG'],
      development: []
    },
    published: true,
    displayOrder: 0,
    archived: false
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
    published: true,
    displayOrder: 1,
    archived: false
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
    published: true,
    displayOrder: 2,
    archived: false
  },
  {
    id: '4',
    title: 'MATUNGA RESIDENCE',
    location: 'Mumbai',
    category: 'Luxe Interiors',
    type: 'INTERIOR DESIGN',
    subCategory: 'RESIDENTIAL',
    imageUrl: '/matunga/LR3.jpg',
    galleries: {
      finished: ['/matunga/A1.jpg', '/matunga/A3.jpg', '/matunga/A4.jpg', '/matunga/A6.jpg', '/matunga/b1.jpg', '/matunga/b2.jpg'],
      development: []
    },
    published: true,
    displayOrder: 3,
    archived: false
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
      finished: ['/bandra/IMG_7699.JPG', '/bandra/IMG_7701.JPG', '/bandra/IMG_7706.JPG', '/bandra/IMG_7709.JPG', '/bandra/IMG_7715.JPG', '/bandra/IMG_7722.JPG'],
      development: []
    },
    published: true,
    displayOrder: 4,
    archived: false
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
    published: true,
    displayOrder: 5,
    archived: false
  },
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
    published: true,
    displayOrder: 6,
    archived: false
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
    published: true,
    displayOrder: 7,
    archived: false
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
    published: true,
    displayOrder: 8,
    archived: false
  }
];

async function seedFirestore() {
  console.log('🌱 Starting Firestore seed...');
  console.log(`📍 Project ID: shapenshades-74d41`);
  console.log(`📦 Collection: projects`);
  console.log(`📊 Documents to create: ${PROJECTS.length}\n`);

  try {
    let created = 0;
    for (const project of PROJECTS) {
      const docRef = doc(db, 'projects', project.id);
      const payload = {
        ...project,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false
      };

      await setDoc(docRef, payload);
      created++;
      console.log(`✅ [${created}/${PROJECTS.length}] Created: "${project.title}" (${project.location})`);
    }

    console.log(`\n🎉 Firestore seeding complete!`);
    console.log(`✨ ${created} projects added to 'projects' collection`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seedFirestore();
