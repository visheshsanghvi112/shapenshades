/**
 * Seed Firestore via REST API (no auth needed)
 * Run: node seed-firestore-rest.js
 */

import fetch from 'node-fetch';

const PROJECT_ID = 'shapenshades-74d41';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

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

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) {
    return {
      arrayValue: { values: value.map(toFirestoreValue) }
    };
  }
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.entries(value).reduce((acc, [k, v]) => {
          acc[k] = toFirestoreValue(v);
          return acc;
        }, {})
      }
    };
  }
  return { stringValue: String(value) };
}

async function seedFirestore() {
  console.log('🌱 Starting Firestore seed via REST API...');
  console.log(`📍 Project ID: ${PROJECT_ID}`);
  console.log(`📦 Collection: projects`);
  console.log(`📊 Documents to create: ${PROJECTS.length}\n`);

  try {
    let created = 0;
    for (const project of PROJECTS) {
      const fields = {
        ...project,
        createdAt: { timestampValue: new Date().toISOString() },
        updatedAt: { timestampValue: new Date().toISOString() },
        isDeleted: { booleanValue: false }
      };

      // Convert all fields to Firestore format
      const firestoreDoc = Object.entries(fields).reduce((acc, [k, v]) => {
        acc[k] = typeof v === 'object' && v.timestampValue ? v : toFirestoreValue(v);
        return acc;
      }, {});

      const url = `${BASE_URL}/projects/${project.id}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: firestoreDoc })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create project ${project.id}: ${error}`);
      }

      created++;
      console.log(`✅ [${created}/${PROJECTS.length}] Created: "${project.title}" (${project.location})`);
    }

    console.log(`\n🎉 Firestore seeding complete!`);
    console.log(`✨ ${created} projects added to 'projects' collection`);
    console.log(`🔗 View at: https://console.firebase.google.com/project/${PROJECT_ID}/firestore/data/projects`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seedFirestore();
