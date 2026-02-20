# Shape N Shades — System Integration Overview

> **Purpose:** This document is the single source of truth for how the entire application works — data flow, integrations, admin panel logic, and how projects are managed. Keep this updated whenever system logic changes.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Sources — How Projects Work](#2-data-sources--how-projects-work)
3. [Firebase Integration](#3-firebase-integration)
4. [Image Hosting — Cloudinary & ImgBB](#4-image-hosting--cloudinary--imgbb)
5. [EmailJS Integration](#5-emailjs-integration)
6. [Admin Panel — Full Breakdown](#6-admin-panel--full-breakdown)
7. [Dev Mode (Local Bypass)](#7-dev-mode-local-bypass)
8. [Future Notes & Known Decisions](#8-future-notes--known-decisions)

---

## 1. Architecture Overview

The app is a **React + Vite** SPA (Single Page Application). There is no traditional backend server. All data lives in:

- **`constants.ts`** — hardcoded project data (the "source of truth" for existing projects)
- **Firebase Firestore** — overrides + new projects created from Admin
- **Cloudinary / ImgBB** — image hosting (returns public URLs saved into Firestore)
- **EmailJS** — email notifications for contact form submissions

```
User visits site
      ↓
React app loads
      ↓
Firestore real-time listener starts
      ↓
constants.ts (base) + Firestore (overrides) → merged → shown on site
```

---

## 2. Data Sources — How Projects Work

This is the **most important section** to understand. Projects come from two sources that get merged together.

### 2.1 `constants.ts` — The Base Data

All original projects (Villa, Thane, Matunga, Bandra, etc.) are hardcoded in `constants.ts` as an array called `PROJECTS`. Each project has:

- `id` — a simple string like `"1"`, `"2"`, `"5"` etc.
- `title`, `location`, `category`, `type`, `subCategory`
- `imageUrl` — the thumbnail shown on the grid
- `galleries.finished` — array of image/video URLs for the finished gallery
- `galleries.development` — array of image/video URLs for on-site progress
- `published` — whether it shows publicly
- `displayOrder` — controls the order on the grid

These are called **canonical projects**. Their IDs (`"1"` through `"8"` currently) are the "known" list.

### 2.2 Firestore — Overrides + New Projects

Firestore stores a `projects` collection. Documents in this collection either:

**A) Override a canonical project** — same ID as one in `constants.ts`
- Firestore data wins over constants data
- Images added from Admin, title edits, publish toggles all live here

**B) Are brand new projects created from Admin**
- Get a UUID like `"8f3a2b-..."` — not in `constants.ts`
- Fully defined by Firestore, no fallback to constants

### 2.3 The Merge Logic (How `Projects.tsx` and `Admin.tsx` Read Data)

Both `Projects.tsx` (the public-facing page) and `Admin.tsx` use a Firestore `onSnapshot` listener. Here's exactly what happens when a Firestore document arrives:

```
For each Firestore document:
  ↓
  Is it marked isDeleted: true?
    YES → Remove it from display. (Ghost protection — blocks old Pune/Delhi projects) ✅
    NO  ↓
  Is its ID in constants.ts (canonicalIds)?
    NO  → It's a new Admin-created project. Build entirely from Firestore data. Show it. ✅
    YES → It's an existing project. Merge Firestore data ON TOP of constants.ts base.
          (Firestore wins for any field it has; constants.ts is fallback.) ✅
```

**Key rule:** `isDeleted: true` is the only thing that hides a project. Not "is it in constants.ts" — that was the old logic, now removed.

### 2.4 Project Visibility Rules

A project shows on the **public site** only if ALL of these are true:
- `isDeleted` is NOT `true`
- `published` is `true`
- `archived` is NOT `true`

A project shows in the **Admin panel** if:
- It exists in Firestore OR in `constants.ts`
- `isDeleted` deleted projects appear in the "Archived" tab

### 2.5 Current Projects in `constants.ts`

| ID | Title | Type | Published |
|----|-------|------|-----------|
| 1 | VILLA | ARCHITECTURE | ✅ |
| 2 | THANE | INTERIOR DESIGN | ✅ |
| 3 | SHOP | INTERIOR DESIGN | ✅ |
| 4 | MILIND MODI GHATKOPAR | INTERIOR DESIGN | ✅ |
| 5 | MATUNGA | INTERIOR DESIGN | ✅ |
| 6 | LOTUS | INTERIOR DESIGN | ✅ |
| 7 | BANDRA | INTERIOR DESIGN | ✅ |
| 8 | ASHRAY KANDIIVALI WEST | INTERIOR DESIGN | ✅ |

Any **new project** created from Admin will have a UUID as ID and won't be in this table — that's fine and fully supported now.

---

## 3. Firebase Integration

### 3.1 Services Used

| Service | Purpose |
|---------|---------|
| Firebase Auth | Admin login/logout |
| Firebase Firestore | Project data storage & real-time sync |
| Firebase Storage | (Configured but not actively used for uploads — Cloudinary/ImgBB used instead) |

### 3.2 Configuration (`src/firebase.ts`)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "shapenshades-...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const isFirebaseConfigured = true; // set to false to trigger dev bypass
```

### 3.3 Authentication Flow

```
Admin navigates to /admin
  ↓
onAuthStateChanged listener fires
  ↓
If no user → show Login form
  ↓
signInWithEmailAndPassword(auth, email, password)
  ↓
If success → Admin dashboard shown
  ↓
signOut(auth) → back to login screen
```

### 3.4 Firestore Data Structure

**Collection:** `projects`
**Document ID:** either `"1"`–`"8"` (canonical) or UUID (admin-created)

```js
{
  title: "MATUNGA",
  location: "Mumbai",
  category: "Residential",
  type: "INTERIOR DESIGN",          // "ARCHITECTURE" | "INTERIOR DESIGN" | "LANDSCAPE"
  subCategory: "RESIDENTIAL",       // "RESIDENTIAL" | "COMMERCIAL" | "HOSPITALITY"
  imageUrl: "https://...",          // Cover image URL
  galleries: {
    finished: ["https://...", ...], // Public-ready images/videos
    development: ["https://...", ...]// On-site progress images/videos
  },
  published: true,                  // Shows on public site if true
  description: "...",               // Optional project description
  displayOrder: 5,                  // Sort order on grid (lower = first)
  isDeleted: false,                 // true = archived/hidden everywhere
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3.5 Writing to Firestore

All writes use `setDoc(..., { merge: true })` — this means only the fields you specify are updated. Other fields are left untouched. This is safe and prevents accidental data loss.

---

## 4. Image Hosting — Cloudinary & ImgBB

Images are NOT stored in Firebase Storage in practice. Instead, files are uploaded to external services that return a public URL. That URL is then saved in Firestore.

### 4.1 Cloudinary (Primary — for images AND videos)

- **Cloud name:** `shapenshades`
- **Upload preset:** `shapenshades_unsigned` (unsigned = no auth required)
- **Max file size:** 100 MB
- **Supports:** JPG, PNG, WebP, MP4, MOV, WebM, etc.

```typescript
// Upload flow
const formData = new FormData();
formData.append('file', file);
formData.append('upload_preset', 'shapenshades_unsigned');

const res = await fetch(
  `https://api.cloudinary.com/v1_1/shapenshades/image/upload`,
  { method: 'POST', body: formData }
);
const { secure_url } = await res.json();
// secure_url is then saved to Firestore
```

### 4.2 ImgBB (Fallback — for images only, used in some paths)

- **API Key:** stored in `VITE_IMGBB_API_KEY` environment variable
- **Max file size:** 32 MB
- **Supports:** Images only (no video)

```typescript
const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
  method: 'POST',
  body: formData  // formData with 'image' field
});
const { data: { url } } = await res.json();
// url is then saved to Firestore
```

### 4.3 Upload Decision Flow (in Admin)

```
Admin uploads a file
  ↓
Is it a video?
  YES → Upload to Cloudinary (supports video) → get URL → save to Firestore
  NO (image):
    devBypass ON  → convert to base64 locally (session only, not saved to Firestore)
    devBypass OFF → upload to ImgBB → get URL → save to Firestore
```

### 4.4 Local/Public Folder Images (Existing Projects)

The original 8 projects use images stored in the `public/` folder of the repo (e.g., `/villa/SR1.jpg`, `/matunga/IMG_7696.JPG`). These are served as static files by the Vite dev server and the deployed host. They are **not uploaded anywhere** — they live in the codebase.

---

## 5. EmailJS Integration

EmailJS sends automated email notifications when someone submits a contact form.

### 5.1 Configuration (`constants.ts`)

```typescript
export const EMAILJS_PUBLIC_KEY = "vhtnkdG3JFSo0HTob";
export const EMAILJS_SERVICE_ID = "service_zq0hu7t";
export const EMAILJS_CONTACT_TEMPLATE_ID = "template_517hpcs";
export const EMAILJS_OFFER_TEMPLATE_ID = "template_517hpcs";
```

### 5.2 Initialization

EmailJS is initialized once in `index.tsx`:
```typescript
emailjs.init(EMAILJS_PUBLIC_KEY);
```

### 5.3 Submission Flow

Every form submission does **two things in parallel:**

```
User submits contact form
  ↓
  ├── Save lead to Firestore (permanent record)
  └── Send email via EmailJS (instant notification)
```

### 5.4 Email Variables Sent

| Variable | Value |
|----------|-------|
| `from_name` | User's full name |
| `reply_to` | User's email |
| `phone` | User's phone number |
| `message` | Project details / message |
| `source` | `"Contact Page"` or `"Popup"` |

---

## 6. Admin Panel — Full Breakdown

### 6.1 Access

- Navigate to the Admin section from the nav
- Requires Firebase Auth login (email + password)
- In Dev Mode, login is bypassed automatically

### 6.2 What You Can Do

| Action | What Happens |
|--------|-------------|
| **Create new project** | New doc with UUID saved to Firestore → appears on site when published |
| **Edit project title/location/type** | Saved to Firestore via `setDoc merge` |
| **Upload images** | File → Cloudinary/ImgBB → URL → saved to Firestore gallery array |
| **Add image by URL** | URL pasted directly → saved to Firestore gallery array |
| **Set cover image** | Updates `imageUrl` field in Firestore |
| **Publish / Unpublish** | Toggles `published` field in Firestore |
| **Reorder projects** | Updates `displayOrder` field for all affected projects |
| **Archive project** | Sets `isDeleted: true` → hidden from site and grid |
| **Restore archived** | Sets `isDeleted: false` → project reappears |
| **Duplicate project** | Creates a new doc (UUID) with same data, `published: false` |
| **Bulk publish/unpublish** | Same as above but for multiple selected projects |
| **Export JSON** | Downloads all project data as a backup `.json` file |

### 6.3 Auto-Save

The admin has a **4-second debounce auto-save**. Every time you edit metadata fields (title, description, type, etc.), a 4-second timer starts. If you stop editing, it saves automatically. No save button needed.

### 6.4 Creating a New Project (Step by Step)

1. Click **"+ New Project"** button in Admin
2. Fill in: Title, Location, Category, Type, SubCategory
3. Click Create → project is saved to Firestore with a UUID as ID
4. The project card opens automatically
5. Upload images via drag-drop or URL
6. Toggle **Publish** to make it visible on the public site

> ⚠️ New projects are `published: false` by default — they won't show on the site until you toggle publish ON.

---

## 7. Dev Mode (Local Bypass)

### 7.1 What Triggers Dev Mode

Dev mode activates when **either** of these is true:
- `isFirebaseConfigured` is `false` in `src/firebase.ts`
- `VITE_DEV_ADMIN_BYPASS=true` in your `.env` file

```typescript
const devBypass = !isFirebaseConfigured || import.meta.env.VITE_DEV_ADMIN_BYPASS === 'true';
```

### 7.2 What Changes in Dev Mode

| Feature | Normal Mode | Dev Mode |
|---------|------------|---------|
| Auth | Firebase login required | Auto-logged in as `dev@shapes.local` |
| Data source | Firestore real-time | `localStorage` |
| Image uploads | Cloudinary / ImgBB | Base64 in memory (session only) |
| Saves | Written to Firestore | Written to `localStorage` |
| Key used | `shape_n_shades_dev_projects_v5` | Same |

### 7.3 localStorage Cache Logic

The app maintains a versioned localStorage cache. On load:
1. Old/stale cache keys are purged automatically
2. Firestore data is merged with `constants.ts` and written to cache
3. On next load, cache is read and merged again with constants

This cache is a **mirror**, not a source of truth — Firestore always wins on next sync.

---

## 8. Future Notes & Known Decisions

### 8.1 Adding More Images to Existing Projects

You can add images to any existing project (Thane, Matunga, etc.) directly from the Admin panel. Images uploaded via Admin go to Cloudinary/ImgBB, the URLs are saved to Firestore, and the Firestore data overrides the `constants.ts` gallery arrays. **`constants.ts` does not need to be touched.**

### 8.2 Adding New Projects

Create from Admin. Once created and published, it will appear on the site. You **never** need to edit `constants.ts` for new projects anymore.

### 8.3 Ghost Project Protection

Old projects like **Pune** and **Delhi** were previously deleted but kept reappearing because their Firestore docs had stale data. The fix: any Firestore document with `isDeleted: true` is permanently blocked from displaying — on the site AND in Admin. This protection is still fully active.

### 8.4 Sumit Kalle (Future)

There is a potential future requirement to re-integrate **Sumit Kalle** as a Director/Founder. Currently the firm is listed as being led solely by **Sohan Suthar**. When requested, update:
1. `index.html` — `<meta name="description">` and JSON-LD `founder` array
2. `constants.ts` — `ABOUT_TEXT` to include Sumit Kalle in the founding story
3. `views/About.tsx` — add a second leadership profile/image if provided
4. `README.md` — the About section

### 8.5 Image Storage Strategy

Currently images split across:
- **`public/` folder** → original 8 project images (local, served as static files)
- **Cloudinary** → videos and new uploads from Admin
- **ImgBB** → image uploads from Admin (some paths)

In future, consider consolidating all new uploads to **Cloudinary only** for consistency.
