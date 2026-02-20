# System Integration Overview

This document explains specifically how the **Shape N Shades** application connects to external services: **Firebase** (for backend/database) and **ImgBB** (for image hosting).

---

## 1. Firebase Integration

Firebase is used as the primary backend for:
1.  **Authentication**: Secure admin login.
2.  **Database**: Storing project metadata (titles, galleries, descriptions) in Firestore.
3.  **Real-time Sync**: Automatically updating the UI when data changes.

### Configuration (`src/firebase.ts`)
The connection is established in `src/firebase.ts`. This file initializes the Firebase SDK with your project's credentials.

```typescript
// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIza...",          // Your API Key
  authDomain: "...",          // Auth Domain
  projectId: "shapenshades-...", // Project ID
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);       // Exports auth service
export const db = getFirestore(app);    // Exports database service
```

### Usage in Admin Panel (`views/Admin.tsx`)

#### Authentication
We use `firebase/auth` functions to manage user sessions.
*   **Login**: `signInWithEmailAndPassword(auth, email, password)`
*   **Session State**: `onAuthStateChanged(auth, (user) => { ... })` listens for login/logout events.

#### Database (Firestore)
Data is stored in a collection named `projects`.
*   **Real-time Listener**: We use `onSnapshot` to listen for ANY changes in the database. This means if you update a project in the Firebase Console, the Admin UI updates instantly without refreshing.
    ```typescript
    const unsub = onSnapshot(query(collection(db, 'projects')), (snap) => {
      // Maps document data to our project state
    });
    ```
*   **Updating Data**: Functions like `setDoc` are used to save changes. We use `{ merge: true }` to update specific fields without overwriting the entire document.

---

## 2. ImgBB Integration

ImgBB is used to host all project images (covers, finished galleries, development galleries). This avoids storing large binary files directly in our repository or database, keeping the app fast and lightweight.

### Implementation (`views/Admin.tsx`)

The integration assumes a direct API call from the browser to ImgBB's servers.

#### The Upload Function
We have a helper function `uploadToImgBB` that handles the API request:

```typescript
const IMGBB_API_KEY = '...'; 

const uploadToImgBB = async (file: File): Promise<string> => {
  // 1. Prepare the form data
  const formData = new FormData();
  formData.append('image', file);

  // 2. Make the POST request
  // The API Key is passed in the URL: ?key=YOUR_KEY
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });

  // 3. Parse and return the direct URL
  const json = await res.json();
  return json.data.url;
};
```

1.  **File Selection**: The admin selects a file via `<input type="file" />`.
2.  **API Call**: The file is sent to ImgBB.
3.  **Storage**: ImgBB returns a public URL (e.g., `https://i.ibb.co/...`).
4.  **Saving**: This URL is then saved to the Project's document in **Firebase Firestore**.

---

## 3. Interaction Flow Summary

1.  **User logs in** -> Firebase Auth verifies credentials.
2.  **Dashboard loads** -> Firebase Firestore `onSnapshot` downloads the list of `projects`.
3.  **User uploads image** ->
    *   App sends file to **ImgBB**.
    *   ImgBB returns a `url`.
    *   App saves this `url` into the project's data in **Firestore**.
4.  **User edits text** -> App saves text directly to **Firestore**.

## 4. Development Mode ("Dev Mode")

We have a fail-safe called `devBypass` (or "Dev Mode").
*   **If enabled**: The app disconnects from Firebase and ImgBB.
*   **Storage**: It saves changes to your browser's `localStorage`.
*   **Uploads**: It converts images to Base64 strings locally instead of uploading them.
*   **Purpose**: This allows you to test the UI logic without messing up your live database or using up your API limits.

---

## 5. EmailJS Integration

EmailJS is used to send automated notifications whenever a lead is submitted via the **Contact Page** or the **Free Consultation Popup**.

### Configuration (`constants.ts`)

We store the public configuration in `constants.ts`. Note that the **Public Key** is safe to expose in the frontend, but **Service/Template IDs** should be configured to match your EmailJS dashboard.

```typescript
export const EMAILJS_PUBLIC_KEY = "vhtnkdG3JFSo0HTob";
export const EMAILJS_SERVICE_ID = "service_zq0hu7t"; 
export const EMAILJS_CONTACT_TEMPLATE_ID = "template_517hpcs";
export const EMAILJS_OFFER_TEMPLATE_ID = "template_517hpcs";
```

### Implementation

1.  **Initialization**: The service is initialized globally in `index.tsx`.
2.  **Redundancy**: Every form submission triggers **two** actions:
    *   **Saving to Firebase**: Ensures a permanent record in the database.
    *   **Sending an Email**: Provides immediate notification to the team.

### Variables sent to EmailJS:
*   `from_name`: The user's full name.
*   `reply_to`: The user's email address.
*   `phone`: The user's contact number.
*   `message`: Their project details (for the contact page).
*   `source`: Indicates whether it came from the Contact Page or the Popup.

