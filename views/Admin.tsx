import React, { useEffect, useMemo, useState, useRef, useCallback, useTransition } from 'react';
import { PROJECTS } from '../constants';
import { Project, ViewProps } from '../types';
import { Trash2, Plus, Upload, Image, X, ChevronDown, ChevronUp, Star, LogIn, Loader2, Eye, EyeOff, ShieldCheck, Lock, Mail, GripVertical, Copy, ArrowRightLeft, Search, Maximize2, Download, CheckSquare, ChevronLeft, ChevronRight, Clock, HelpCircle, LayoutGrid, Edit3, Settings, ImageIcon, MapPin, RefreshCw, Archive as ArchiveIcon, FilePlus, Globe } from 'lucide-react';
import { auth, db, storage, isFirebaseConfigured } from '../src/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, orderBy, query, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

import { DEV_STORAGE_KEY } from './Projects';

const FIRESTORE_COLLECTION = 'projects';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000';
// DEV_STORAGE_KEY imported from Projects
const DEV_STORAGE_PREFIX = 'shape_n_shades_dev_projects_';

const TOUR_STEPS: { target: string; title: string; description: string }[] = [
  { target: 'dashboard-stats', title: 'Dashboard Overview', description: 'Your portfolio health at a glance — total projects, published count, archived, and image stats.' },
  { target: 'search-bar', title: 'Search & Filter', description: 'Type here to instantly filter projects by name, location, or category.' },
  { target: 'archive-toggle', title: 'Archive Toggle', description: 'Switch between active and archived views. Archived projects are hidden from your live site.' },
  { target: 'export-btn', title: 'Export Backup', description: 'Download all project data as a JSON file — handy for backups or migrations.' },
  { target: 'new-project-btn', title: 'Create Project', description: 'Start a new project from scratch. Give it a name, location, and category.' },
  { target: 'project-card-0', title: 'Project Card', description: 'Each card shows a project at a glance. Click it to expand and edit details, galleries, and covers.' },
  { target: 'drag-handle-0', title: 'Drag to Reorder', description: 'Grab this handle and drag up/down to change the display order on your site.' },
  { target: 'publish-toggle-0', title: 'Quick Publish', description: 'Toggle the eye icon to instantly publish or unpublish — no need to open the card.' },
  { target: 'select-checkbox-0', title: 'Bulk Select', description: 'Check multiple projects then use the action bar to publish or hide them all at once.' },
  // Steps inside expanded project (auto-expands first project)
  { target: 'gallery-tabs', title: 'Gallery Tabs', description: 'Switch between Finished (client-ready) and Development (work-in-progress) galleries.' },
  { target: 'upload-area', title: 'Upload Images', description: 'Click here or paste a URL below to add images to the active gallery. Everything auto-saves!' },
  { target: 'cover-section', title: 'Cover Image', description: 'Your project cover shown on the portfolio. Pick from your gallery images or upload a new one.' },
  { target: 'autosave-indicator', title: 'Auto-Save', description: 'All edits save automatically — no need to press any save button. Just edit and go!' },
  { target: 'tour-btn', title: 'That\'s It!', description: 'You can re-open this tour anytime by clicking the Tour button. Enjoy managing your portfolio!' },
];
// Tour steps that require the first project to be expanded
const TOUR_EXPANDED_TARGETS = new Set(['gallery-tabs', 'upload-area', 'cover-section', 'autosave-indicator']);
const TOUR_SPOTLIGHT_PAD = 8;
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const IMGBB_MAX_SIZE = 32 * 1024 * 1024; // 32 MB free-tier limit

// Cloudinary — free tier, no billing required, supports images + videos
// Cloud name: shapenshades | Upload preset: shapenshades_unsigned (unsigned, no auth needed)
const CLOUDINARY_CLOUD_NAME = 'shapenshades';
const CLOUDINARY_UPLOAD_PRESET = 'shapenshades_unsigned';
const CLOUDINARY_MAX_SIZE = 100 * 1024 * 1024; // 100 MB

const uploadToCloudinary = async (file: File): Promise<string> => {
  if (file.size > CLOUDINARY_MAX_SIZE) {
    throw new Error(`File "${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — max allowed is 100 MB.`);
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[Cloudinary] Upload Error:', res.status, errorText);
    throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (!json.secure_url) {
    console.error('[Cloudinary] Invalid Response:', json);
    throw new Error('Cloudinary response missing URL');
  }

  return json.secure_url as string;
};

const uploadToImgBB = async (file: File): Promise<string> => {
  if (file.size > IMGBB_MAX_SIZE) {
    throw new Error(`File "${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — ImgBB limit is 32 MB. Please compress or resize before uploading.`);
  }
  const formData = new FormData();
  formData.append('image', file);

  // Pass key in URL as per standard API usage
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[ImgBB] Upload Error:', res.status, errorText);
    throw new Error(`ImgBB upload failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (!json.data?.url) {
    console.error('[ImgBB] Invalid Response:', json);
    throw new Error('ImgBB response missing image URL');
  }

  return json.data.url as string;
};
const STOCK_COVER_POOL: string[] = [
  'https://images.unsplash.com/photo-1586023492125-27b46c719b13?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1618221195710-dd9bfa6f3241?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1629373146475-6868f0a44f6e?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1582321886083-a1a7707b6dbf?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1630519147263-d38edc983f25?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1616594039964-ae9021539b6b?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1567818735868-e71b99932e29?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1800&q=80',
];

const sortProjects = (entries: Project[]): Project[] => {
  return [...entries].sort((a, b) => {
    if (!!a.archived !== !!b.archived) {
      return a.archived ? 1 : -1;
    }
    const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });
};

const normalizeProject = (project: Project): Project => ({
  ...project,
  archived: project.archived ?? false,
});

const normalizeProjects = (entries: Project[]): Project[] => {
  return sortProjects(entries.map(normalizeProject));
};

const suggestCovers = (projectId: string, galleries?: { finished: string[]; development: string[] }): string[] => {
  // Prefer the project's own gallery images as cover suggestions (they're already uploaded & reliable)
  const ownImages: string[] = [];
  if (galleries) {
    galleries.finished.forEach((u) => { if (!ownImages.includes(u)) ownImages.push(u); });
    galleries.development.forEach((u) => { if (!ownImages.includes(u)) ownImages.push(u); });
  }
  if (ownImages.length >= 3) return ownImages.slice(0, 6); // show up to 6 own images

  // Fill remaining with stock photos
  const picks = [...ownImages];
  const hash = projectId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  let idx = hash % STOCK_COVER_POOL.length;
  while (picks.length < 3 && STOCK_COVER_POOL.length > 0) {
    const candidate = STOCK_COVER_POOL[idx % STOCK_COVER_POOL.length];
    if (!picks.includes(candidate)) picks.push(candidate);
    idx = (idx + 5) % STOCK_COVER_POOL.length;
  }
  return picks;
};

// Purge all old versioned keys so stale projects never resurface
const purgeOldProjectKeys = (): void => {
  if (typeof window === 'undefined') return;
  const toDelete: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(DEV_STORAGE_PREFIX) && key !== DEV_STORAGE_KEY) {
      toDelete.push(key);
    }
  }
  toDelete.forEach((k) => {
    window.localStorage.removeItem(k);
    console.log(`[Admin] Purged stale cache key: ${k}`);
  });
};

const seedFreshProjects = (): Project[] => {
  const seeded = sortProjects(normalizeProjects(PROJECTS));
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(seeded));
  }
  return seeded;
};

const readDevProjects = (): Project[] => {
  if (typeof window === 'undefined') return sortProjects(normalizeProjects(PROJECTS));
  purgeOldProjectKeys();
  const raw = window.localStorage.getItem(DEV_STORAGE_KEY);
  if (!raw) return seedFreshProjects();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return seedFreshProjects();

    const canonicalIds = new Set(PROJECTS.map((p) => p.id));
    const baseMap = new Map<string, Project>(normalizeProjects(PROJECTS).map((p) => [p.id, p]));
    const additions: Project[] = [];

    (parsed as Project[]).forEach((p) => {
      if (canonicalIds.has(p.id)) {
        // Merge cached edits into the canonical base
        const base = baseMap.get(p.id)!;
        baseMap.set(p.id, { ...base, ...p });
      } else {
        additions.push(normalizeProject(p));
      }
    });

    return sortProjects([...baseMap.values(), ...additions]);
  } catch (err) {
    console.warn('[Admin] Failed to parse local dev projects, resetting store', err);
    return seedFreshProjects();
  }
};

const writeDevProjects = (projects: Project[]) => {
  if (typeof window === 'undefined') return;
  // Strip data URLs before saving — they're too large for localStorage (5MB limit).
  // Videos/images uploaded as data URLs stay in React state for the session only.
  // Use a real hosted URL (ImgBB, Pexels, etc.) for permanent storage.
  const sanitized = normalizeProjects(projects).map((p) => ({
    ...p,
    imageUrl: p.imageUrl?.startsWith('data:') ? '' : p.imageUrl,
    galleries: {
      finished: p.galleries.finished.filter((u) => !u.startsWith('data:')),
      development: p.galleries.development.filter((u) => !u.startsWith('data:')),
    },
  }));
  try {
    window.localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.warn('[Admin] localStorage write failed even after stripping data URLs:', err);
  }
};

type GalleryKey = 'finished' | 'development';

const GALLERY_TABS: GalleryKey[] = ['finished', 'development'];
const TYPE_OPTIONS: Project['type'][] = ['ARCHITECTURE', 'INTERIOR DESIGN', 'LANDSCAPE'];
const SUBCATEGORY_OPTIONS: Project['subCategory'][] = ['RESIDENTIAL', 'COMMERCIAL', 'HOSPITALITY'];

interface NewProjectDraft {
  title: string;
  location: string;
  category: string;
  type: Project['type'];
  subCategory: Project['subCategory'];
  description: string;
  published: boolean;
  displayOrder: number | null;
}

const createNewProjectDraft = (order: number): NewProjectDraft => ({
  title: '',
  location: '',
  category: '',
  type: 'ARCHITECTURE',
  subCategory: 'RESIDENTIAL',
  description: '',
  published: false,
  displayOrder: order,
});

const Admin: React.FC<ViewProps> = ({ setIsDarkMode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [projects, setProjects] = useState<Project[]>(sortProjects(normalizeProjects(PROJECTS)));
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Project>>({});
  const [activeGalleryTab, setActiveGalleryTab] = useState<Record<string, GalleryKey>>({});
  const [uploadTarget, setUploadTarget] = useState<{ projectId: string; gallery: GalleryKey } | null>(null);
  const uploadTargetRef = useRef<{ projectId: string; gallery: GalleryKey } | null>(null);
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ projectId: string; url: string } | null>(null);
  const [projectConfirm, setProjectConfirm] = useState<string | null>(null);
  const [bulkRestoreConfirm, setBulkRestoreConfirm] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{ projectId: string; gallery: GalleryKey; count: number } | null>(null);
  const [fadingImages, setFadingImages] = useState<Set<string>>(new Set());
  const [diagnostics, setDiagnostics] = useState<{ context: string; detail: string; time: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState<NewProjectDraft>(createNewProjectDraft(PROJECTS.length + 1));
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ projectId: string; gallery: GalleryKey; fromIndex: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Feature 1: Project-level drag reorder
  const [projectDragIdx, setProjectDragIdx] = useState<number | null>(null);
  const [projectDragOverIdx, setProjectDragOverIdx] = useState<number | null>(null);
  // Feature 5: Bulk image selection
  const [selectedImages, setSelectedImages] = useState<Record<string, Set<string>>>({});
  // Feature 10: Bulk project selection
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [tourStep, setTourStep] = useState<number | null>(null);
  // Auto-save timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverUploadTarget = useRef<string | null>(null);
  // ImgBB Library
  const [imgbbLibraryOpen, setImgbbLibraryOpen] = useState(false);
  const [imgbbLibraryTarget, setImgbbLibraryTarget] = useState<{ projectId: string; gallery: GalleryKey } | null>(null);
  const [imgbbImages, setImgbbImages] = useState<{ id: string; url: string; thumb: string; title: string }[]>([]);
  const [imgbbLoading, setImgbbLoading] = useState(false);
  const [imgbbError, setImgbbError] = useState<string | null>(null);
  const devBypass = !isFirebaseConfigured || import.meta.env.VITE_DEV_ADMIN_BYPASS === 'true';

  const archiveCount = useMemo(() => projects.filter((p) => p.archived).length, [projects]);
  const visibleProjects = useMemo(() => {
    const filtered = projects.filter((p) => (showArchived ? p.archived : !p.archived));
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase();
    return filtered.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }, [projects, showArchived, searchQuery]);

  // Feature 4: Dashboard stats
  const dashboardStats = useMemo(() => {
    const active = projects.filter((p) => !p.archived);
    const published = active.filter((p) => p.published).length;
    const totalImages = projects.reduce((sum, p) => sum + p.galleries.finished.length + p.galleries.development.length, 0);
    return { total: projects.length, active: active.length, published, archived: archiveCount, totalImages };
  }, [projects, archiveCount]);

  const flash = useCallback((type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2000);
  }, []);

  const reportError = useCallback((context: string, err: unknown, toastMsg?: string) => {
    const detail = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
    console.error(`[Admin] ${context}`, err);
    setDiagnostics({ context, detail, time: Date.now() });
    if (toastMsg) flash('err', toastMsg);
  }, [flash]);

  const debugInfo = useCallback((context: string, extra?: string) => {
    if (!import.meta.env.DEV) return;
    console.debug(`[Admin] ${context}${extra ? ': ' + extra : ''}`);
  }, []);

  useEffect(() => { setIsDarkMode(false); }, [setIsDarkMode]);

  // Firebase Auth listener (skips when running in dev bypass)
  useEffect(() => {
    if (devBypass) {
      setUser({ email: 'dev@shapes.local' } as User);
      setAuthLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (account) => {
      setUser(account);
      setAuthLoading(false);
    });

    return unsub;
  }, [devBypass, reportError]);

  // Firestore real-time listener for project documents (or local fallback in dev mode)
  useEffect(() => {
    if (devBypass) {
      const applyLocal = () => {
        const localProjects = readDevProjects();
        setProjects(localProjects);
        setExistingIds(localProjects.map((p) => p.id));
        setLoadingProjects(false);
      };

      applyLocal();

      if (typeof window !== 'undefined') {
        const handleStorage = (event: StorageEvent) => {
          if (event.key === DEV_STORAGE_KEY) {
            applyLocal();
          }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
      }
      return;
    }

    const colRef = collection(db, FIRESTORE_COLLECTION);
    const projectQuery = query(colRef, orderBy('displayOrder', 'asc'));

    const unsub = onSnapshot(projectQuery, (snap) => {
      // Protection: Only projects with these canonical IDs appear for base work
      const canonicalIds = new Set(PROJECTS.map((p) => p.id));
      const baseMap = new Map<string, Project>(PROJECTS.map((p) => [p.id, normalizeProject(p)]));
      const ids: string[] = [];

      if (!snap.empty) {
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const archived = Boolean(data.isDeleted);

          // Skip any document explicitly marked as deleted — this blocks old ghost projects (Pune/Delhi etc.)
          // Still track their IDs so they can appear in the archived view
          if (archived) {
            if (canonicalIds.has(docSnap.id)) {
              // Canonical projects that are deleted → show in archived view
              const base = baseMap.get(docSnap.id);
              baseMap.set(docSnap.id, {
                ...base!,
                published: false,
                archived: true,
              });
            }
            // Non-canonical deleted projects are fully ignored (true ghost cleanup)
            return;
          }

          // If this project is NOT in constants.ts, it was created from the Admin panel.
          // Build it purely from Firestore data and add it to the map.
          if (!canonicalIds.has(docSnap.id)) {
            const finished = Array.isArray(data.galleries?.finished) ? data.galleries.finished : [];
            const development = Array.isArray(data.galleries?.development) ? data.galleries.development : [];
            ids.push(docSnap.id);
            baseMap.set(docSnap.id, {
              id: docSnap.id,
              title: data.title ?? 'Untitled Project',
              location: data.location ?? 'Mumbai',
              category: data.category ?? 'Projects',
              type: data.type ?? 'INTERIOR DESIGN',
              subCategory: data.subCategory ?? 'RESIDENTIAL',
              imageUrl: data.imageUrl ?? finished[0] ?? '',
              galleries: { finished, development },
              published: data.published ?? false,
              description: data.description,
              displayOrder: data.displayOrder,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              archived: false,
            });
            return;
          }

          // Canonical project — merge Firestore overrides on top of constants.ts base
          ids.push(docSnap.id);
          const base = baseMap.get(docSnap.id);
          const finished = Array.isArray(data.galleries?.finished) ? data.galleries.finished : (base?.galleries.finished ?? []);
          const development = Array.isArray(data.galleries?.development) ? data.galleries.development : (base?.galleries.development ?? []);

          baseMap.set(docSnap.id, {
            id: docSnap.id,
            title: data.title ?? base?.title ?? 'Untitled Project',
            location: data.location ?? base?.location ?? 'Mumbai',
            category: data.category ?? base?.category ?? 'Residential',
            type: data.type ?? base?.type ?? 'INTERIOR DESIGN',
            subCategory: data.subCategory ?? base?.subCategory ?? 'RESIDENTIAL',
            imageUrl: data.imageUrl ?? base?.imageUrl ?? (finished[0] || ''),
            galleries: { finished, development },
            published: data.published ?? base?.published ?? false,
            description: data.description ?? base?.description,
            displayOrder: data.displayOrder ?? base?.displayOrder,
            createdAt: data.createdAt ?? base?.createdAt,
            updatedAt: data.updatedAt ?? base?.updatedAt,
            archived: false,
          });
        });
      }

      const mergedProjects = normalizeProjects([...baseMap.values()]);
      setProjects(mergedProjects);
      setExistingIds([...new Set([...ids, ...mergedProjects.filter((p) => p.archived).map((p) => p.id)])]);
      setLoadingProjects(false);
      writeDevProjects(mergedProjects);
    }, (error) => {
      reportError('Firestore listener failed', error, 'Live sync unavailable, using defaults');
      const fallback = sortProjects(normalizeProjects(PROJECTS));
      setProjects(fallback);
      setExistingIds(fallback.filter((p) => !p.archived).map((p) => p.id));
      setLoadingProjects(false);
    });

    return unsub;
  }, [devBypass, reportError]);

  useEffect(() => {
    setActiveGalleryTab((prev) => {
      const next = { ...prev };
      const ids = new Set(projects.map((p) => p.id));
      Object.keys(next).forEach((id) => {
        if (!ids.has(id)) delete next[id];
      });
      projects.forEach((project) => {
        if (!next[project.id]) next[project.id] = 'finished';
      });
      return next;
    });

    setDrafts((prev) => {
      const ids = new Set(projects.map((p) => p.id));
      const next: Record<string, Project> = {};
      Object.entries(prev as Record<string, Project>).forEach(([id, draft]) => {
        if (ids.has(id)) next[id] = draft;
      });
      return next;
    });
  }, [projects]);

  const allImages = useMemo(() => {
    const set = new Set<string>();
    const push = (value?: string) => {
      if (value) set.add(value);
    };

    projects.forEach((project) => {
      push(project.imageUrl);
      project.galleries.finished.forEach(push);
      project.galleries.development.forEach(push);
    });

    (Object.values(drafts) as Project[]).forEach((draft) => {
      push(draft.imageUrl);
      draft.galleries.finished.forEach(push);
      draft.galleries.development.forEach(push);
    });

    return set;
  }, [projects, drafts]);

  const getActiveGallery = useCallback(
    (projectId: string): GalleryKey => activeGalleryTab[projectId] ?? 'finished',
    [activeGalleryTab]
  );

  const [, startTransition] = useTransition();

  const updateDraft = useCallback((projectId: string, mutator: (draft: Project) => void) => {
    setDrafts((prev) => {
      const existing = prev[projectId];
      const source = existing ?? projects.find((p) => p.id === projectId);
      if (!source) return prev;

      const draft: Project = {
        ...(existing ?? source),
        galleries: {
          finished: [...(existing?.galleries.finished ?? source.galleries.finished)],
          development: [...(existing?.galleries.development ?? source.galleries.development)],
        },
      };

      mutator(draft);
      return { ...prev, [projectId]: draft };
    });
  }, [projects]);

  const updateDraftField = useCallback(
    (projectId: string, field: keyof Project, value: unknown) => {
      startTransition(() => {
        updateDraft(projectId, (draft) => {
          (draft as any)[field] = value;
        });
      });
    },
    [updateDraft]
  );

  const hasMetadataChanges = useCallback(
    (projectId: string) => {
      const draft = drafts[projectId];
      if (!draft) return false;
      const base = projects.find((p) => p.id === projectId);
      if (!base) return true;
      return (
        draft.title !== base.title ||
        draft.location !== base.location ||
        draft.category !== base.category ||
        draft.type !== base.type ||
        draft.subCategory !== base.subCategory ||
        (draft.description ?? '') !== (base.description ?? '') ||
        (draft.displayOrder ?? null) !== (base.displayOrder ?? null) ||
        draft.published !== base.published
      );
    },
    [drafts, projects]
  );

  const applyDevProjects = useCallback((updater: (current: Project[]) => Project[]) => {
    if (!devBypass) return;
    setProjects((prev) => {
      const next = normalizeProjects(updater(prev));
      writeDevProjects(next);
      setExistingIds(next.map((p) => p.id));
      return next;
    });
  }, [devBypass]);

  const handleSaveProject = useCallback(async (projectId: string) => {
    const draft = drafts[projectId];
    if (!draft) return;
    const title = draft.title.trim();
    const location = draft.location.trim();

    if (!title || !location) {
      flash('err', 'Title and location are required');
      return;
    }

    const category = draft.category.trim() || 'Projects';
    const description = (draft.description ?? '').trim();
    // Strip data URLs — they're too large for Firestore (1MB doc limit)
    const galleries = {
      finished: draft.galleries.finished.filter((u) => !u.startsWith('data:')),
      development: draft.galleries.development.filter((u) => !u.startsWith('data:')),
    };
    const cover = (draft.imageUrl?.startsWith('data:') ? '' : draft.imageUrl) || galleries.finished[0] || galleries.development[0] || '';

    if (devBypass) {
      applyDevProjects((prev) => {
        const existing = prev.find((p) => p.id === projectId);
        const filtered = prev.filter((p) => p.id !== projectId);
        const nextProject: Project = {
          id: projectId,
          title,
          location,
          category,
          type: draft.type,
          subCategory: draft.subCategory,
          imageUrl: cover,
          galleries,
          published: draft.published,
          description,
          displayOrder: draft.displayOrder ?? null,
          createdAt: existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
          archived: existing?.archived ?? false,
        };
        return [...filtered, nextProject];
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
      flash('ok', 'Project saved');
      return;
    }

    const docRef = doc(db, FIRESTORE_COLLECTION, projectId);
    const payload: Record<string, unknown> = {
      title,
      location,
      category,
      type: draft.type,
      subCategory: draft.subCategory,
      imageUrl: cover,
      galleries,
      published: draft.published,
      description,
      displayOrder: draft.displayOrder ?? null,
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };

    if (!existingIds.includes(projectId)) {
      payload.createdAt = serverTimestamp();
    }

    try {
      await setDoc(docRef, payload, { merge: true });
      flash('ok', 'Project saved');
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
    } catch (err) {
      reportError('Failed to save project', err, 'Could not save project');
    }
  }, [applyDevProjects, devBypass, drafts, existingIds, flash, reportError]);

  const handleDiscardProject = useCallback((projectId: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  }, []);

  const addImagesToGallery = useCallback(async (projectId: string, gallery: GalleryKey, urls: string[]): Promise<boolean> => {
    if (!urls || urls.length === 0) return false;

    // Filter out duplicates that might already exist in any gallery
    const project = drafts[projectId] ?? projects.find((p) => p.id === projectId);
    if (!project) {
      flash('err', 'Project not found');
      return false;
    }

    const existingUrls = new Set([...project.galleries.finished, ...project.galleries.development]);
    const uniqueNewUrls = urls.filter(u => !existingUrls.has(u));

    if (uniqueNewUrls.length === 0) return true;

    const nextGalleries: Project['galleries'] = {
      finished: [...project.galleries.finished],
      development: [...project.galleries.development],
    };

    uniqueNewUrls.forEach(u => nextGalleries[gallery].push(u));

    const cover = project.imageUrl || nextGalleries.finished[0] || nextGalleries.development[0] || '';

    updateDraft(projectId, (draft) => {
      draft.galleries = nextGalleries;
      if (!draft.imageUrl) {
        draft.imageUrl = cover;
      }
    });

    if (devBypass) {
      applyDevProjects((prev) => prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          galleries: nextGalleries,
          imageUrl: cover || p.imageUrl,
          updatedAt: Date.now(),
        };
      }));
      return true;
    }

    try {
      await setDoc(doc(db, FIRESTORE_COLLECTION, projectId), {
        galleries: nextGalleries,
        imageUrl: cover,
        updatedAt: serverTimestamp(),
        isDeleted: false,
      }, { merge: true });
      return true;
    } catch (err) {
      reportError('Failed to add images', err, 'Could not add images');
      return false;
    }
  }, [applyDevProjects, devBypass, drafts, flash, projects, reportError, updateDraft]);

  const addImageToGallery = useCallback(async (projectId: string, gallery: GalleryKey, url: string): Promise<boolean> => {
    return addImagesToGallery(projectId, gallery, [url]);
  }, [addImagesToGallery]);

  const handleAddImageUrl = useCallback(async (projectId: string) => {
    const gallery = getActiveGallery(projectId);
    const url = (urlDrafts[projectId] ?? '').trim();
    if (!url) return;

    // Allow local public/ paths like /my-video.mp4
    const isLocalPath = url.startsWith('/');

    if (!isLocalPath) {
      try {
        new URL(url);
      } catch {
        flash('err', 'Please enter a valid URL or a local path starting with /');
        return;
      }
    }

    // Duplicate check
    const project = drafts[projectId] ?? projects.find((p) => p.id === projectId);
    if (project) {
      const allUrls = [...project.galleries.finished, ...project.galleries.development];
      if (allUrls.includes(url)) {
        flash('err', 'This image/video is already in the gallery');
        return;
      }
    }

    const isVideo = /\.(mp4|mov|webm|ogv)/i.test(url) || url.includes('video');

    const success = await addImageToGallery(projectId, gallery, url);
    if (success) {
      setUrlDrafts((prev) => ({ ...prev, [projectId]: '' }));
      flash('ok', isVideo ? 'Video added' : 'Media added');
    } else {
      flash('err', 'Could not add — check the browser console for details');
    }
  }, [addImageToGallery, drafts, flash, getActiveGallery, projects, urlDrafts]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    const target = uploadTargetRef.current;
    if (!files || files.length === 0 || !target) return;
    debugInfo('Upload start', `${files.length} file(s) to ${target.projectId}/${target.gallery}`);
    const project = drafts[target.projectId] ?? projects.find((p) => p.id === target.projectId);
    // Extract "filenames" from existing URLs to detect duplicates
    const existingFilenames = new Set(
      [...(project?.galleries.finished ?? []), ...(project?.galleries.development ?? [])]
        .map(url => {
          if (url.startsWith('data:')) return '';
          return url.split('/').pop()?.split('?')[0]?.toLowerCase() ?? '';
        })
        .filter(Boolean)
    );

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    let skipped = 0;
    let duplicateCount = 0;
    const urlsToBatch: string[] = [];
    const fileArray = Array.from(files);

    const CHUNK_SIZE = 3;
    for (let i = 0; i < fileArray.length; i += CHUNK_SIZE) {
      const chunk = fileArray.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async (file) => {
        const fileName = file.name.toLowerCase();

        // 1. Check for filename duplicate
        if (existingFilenames.has(fileName)) {
          duplicateCount++;
          setUploadProgress(p => p ? { ...p, current: p.current + 1 } : null);
          return;
        }

        // 2. Check for valid file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          skipped++;
          setUploadProgress(p => p ? { ...p, current: p.current + 1 } : null);
          return;
        }

        try {
          if (file.type.startsWith('video/')) {
            if (file.size > 50 * 1024 * 1024) {
              flash('err', `"${file.name}" is too large (max 50MB).`);
              skipped++;
            } else {
              const dataUrl: string = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
              });
              if (devBypass) urlsToBatch.push(dataUrl);
              else { flash('err', `Video "${file.name}": Please paste a link.`); skipped++; }
            }
          } else {
            if (devBypass) {
              const dataUrl: string = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
              });
              urlsToBatch.push(dataUrl);
            } else {
              const downloadUrl = await uploadToImgBB(file);
              urlsToBatch.push(downloadUrl);
            }
          }
        } catch (err) {
          reportError('Upload failed for ' + file.name, err);
        } finally {
          setUploadProgress(p => p ? { ...p, current: p.current + 1 } : null);
        }
      }));
    }

    if (urlsToBatch.length > 0) {
      const success = await addImagesToGallery(target.projectId, target.gallery, urlsToBatch);
      if (success) {
        let msg = `${urlsToBatch.length} file${urlsToBatch.length === 1 ? '' : 's'} added`;
        if (duplicateCount > 0) msg += ` (${duplicateCount} skipped as duplicates)`;
        flash('ok', msg);
      }
    } else if (duplicateCount > 0) {
      flash('err', `${duplicateCount} files already exist in this project.`);
    }

    setUploading(false);
    setUploadProgress(null);
    uploadTargetRef.current = null;
    setUploadTarget(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (skipped > 0 && urlsToBatch.length === 0 && duplicateCount === 0) {
      flash('err', `Upload failed or skipped ${skipped} files.`);
    }
  }, [addImagesToGallery, debugInfo, devBypass, flash, reportError]);

  const handleRemoveImage = useCallback(async (projectId: string, url: string) => {
    const project = drafts[projectId] ?? projects.find((p) => p.id === projectId);
    if (!project) return;

    const nextGalleries: Project['galleries'] = {
      finished: project.galleries.finished.filter((img) => img !== url),
      development: project.galleries.development.filter((img) => img !== url),
    };

    if (
      nextGalleries.finished.length === project.galleries.finished.length &&
      nextGalleries.development.length === project.galleries.development.length
    ) {
      return;
    }

    const cover = project.imageUrl === url
      ? nextGalleries.finished[0] ?? nextGalleries.development[0] ?? ''
      : project.imageUrl;

    // Update local state FIRST (instant UI response)
    updateDraft(projectId, (draft) => {
      draft.galleries = nextGalleries;
      draft.imageUrl = cover;
    });
    flash('ok', 'Image removed');
    setDeleteConfirm(null);

    if (devBypass) {
      applyDevProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, galleries: nextGalleries, imageUrl: cover, updatedAt: Date.now() }));
      return;
    }

    // Fire-and-forget to Firestore (don't block UI)
    setDoc(doc(db, FIRESTORE_COLLECTION, projectId), {
      galleries: nextGalleries, imageUrl: cover, updatedAt: serverTimestamp(),
    }, { merge: true }).catch((err) => reportError('Failed to remove image', err));

    // Clean up storage in background
    if (url.includes('firebasestorage.googleapis.com')) {
      deleteObject(ref(storage, url)).catch(() => { });
    }
  }, [applyDevProjects, devBypass, drafts, flash, projects, reportError, updateDraft]);

  // ─── Move image between galleries ───
  const handleMoveImage = useCallback(async (projectId: string, url: string, fromGallery: GalleryKey) => {
    const toGallery: GalleryKey = fromGallery === 'finished' ? 'development' : 'finished';
    const project = drafts[projectId] ?? projects.find((p) => p.id === projectId);
    if (!project) return;

    const nextGalleries: Project['galleries'] = {
      finished: [...project.galleries.finished],
      development: [...project.galleries.development],
    };

    const idx = nextGalleries[fromGallery].indexOf(url);
    if (idx === -1) return;
    nextGalleries[fromGallery].splice(idx, 1);
    nextGalleries[toGallery].push(url);

    updateDraft(projectId, (draft) => { draft.galleries = nextGalleries; });
    flash('ok', `Moved to ${toGallery}`);

    if (devBypass) {
      applyDevProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, galleries: nextGalleries, updatedAt: Date.now() }));
      return;
    }

    // Fire-and-forget
    setDoc(doc(db, FIRESTORE_COLLECTION, projectId), {
      galleries: nextGalleries, updatedAt: serverTimestamp(),
    }, { merge: true }).catch((err) => reportError('Failed to move image', err));
  }, [applyDevProjects, devBypass, drafts, flash, projects, reportError, updateDraft]);

  // ─── Reorder images within a gallery via drag & drop ───
  const handleReorderImages = useCallback(async (projectId: string, gallery: GalleryKey, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const project = drafts[projectId] ?? projects.find((p) => p.id === projectId);
    if (!project) return;

    const nextGalleries: Project['galleries'] = {
      finished: [...project.galleries.finished],
      development: [...project.galleries.development],
    };

    const arr = nextGalleries[gallery];
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);

    updateDraft(projectId, (draft) => { draft.galleries = nextGalleries; });

    if (devBypass) {
      applyDevProjects((prev) => prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, galleries: nextGalleries, updatedAt: Date.now() };
      }));
      flash('ok', 'Image order updated');
      return;
    }

    try {
      await setDoc(doc(db, FIRESTORE_COLLECTION, projectId), {
        galleries: nextGalleries,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      flash('ok', 'Image order updated');
    } catch (err) {
      reportError('Failed to reorder images', err, 'Could not reorder images');
    }
  }, [applyDevProjects, devBypass, drafts, flash, projects, reportError, updateDraft]);

  // ─── Duplicate a project ───
  const handleDuplicateProject = useCallback(async (sourceProject: Project) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `project_${Date.now().toString(36)}`;
    const activeCount = projects.filter((p) => !p.archived).length;
    const cloned: Project = {
      ...sourceProject,
      id,
      title: `${sourceProject.title} (Copy)`,
      published: false,
      displayOrder: activeCount + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
      galleries: {
        finished: [...sourceProject.galleries.finished],
        development: [...sourceProject.galleries.development],
      },
    };

    if (devBypass) {
      applyDevProjects((prev) => [...prev, cloned]);
      flash('ok', 'Project duplicated');
      setExpandedId(id);
      return;
    }

    const docRef = doc(db, FIRESTORE_COLLECTION, id);
    try {
      await setDoc(docRef, {
        title: cloned.title,
        location: cloned.location,
        category: cloned.category,
        type: cloned.type,
        subCategory: cloned.subCategory,
        imageUrl: cloned.imageUrl,
        galleries: cloned.galleries,
        published: false,
        description: cloned.description ?? '',
        displayOrder: cloned.displayOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
      });
      flash('ok', 'Project duplicated');
      setExpandedId(id);
    } catch (err) {
      reportError('Failed to duplicate project', err, 'Could not duplicate project');
    }
  }, [applyDevProjects, devBypass, flash, projects, reportError]);

  // ─── Feature 1: Project drag-and-drop reorder ───
  const handleReorderProjects = useCallback(async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const reordered = [...visibleProjects];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const updates = reordered.map((p, i) => ({ id: p.id, displayOrder: i + 1 }));

    if (devBypass) {
      applyDevProjects((prev) => prev.map((p) => {
        const u = updates.find((x) => x.id === p.id);
        return u ? { ...p, displayOrder: u.displayOrder, updatedAt: Date.now() } : p;
      }));
      flash('ok', 'Project order updated');
      return;
    }
    try {
      await Promise.all(updates.map((u) =>
        setDoc(doc(db, FIRESTORE_COLLECTION, u.id), { displayOrder: u.displayOrder, updatedAt: serverTimestamp() }, { merge: true })
      ));
      flash('ok', 'Project order updated');
    } catch (err) {
      reportError('Failed to reorder projects', err, 'Could not reorder');
    }
  }, [applyDevProjects, devBypass, flash, reportError, visibleProjects]);

  // ─── Feature 2: Quick publish/unpublish toggle ───
  const handleQuickTogglePublish = useCallback(async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || project.archived) return;
    const nextPublished = !project.published;

    if (devBypass) {
      applyDevProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, published: nextPublished, updatedAt: Date.now() } : p));
      flash('ok', nextPublished ? 'Published' : 'Unpublished');
      return;
    }
    try {
      await setDoc(doc(db, FIRESTORE_COLLECTION, projectId), { published: nextPublished, updatedAt: serverTimestamp() }, { merge: true });
      flash('ok', nextPublished ? 'Published' : 'Unpublished');
    } catch (err) {
      reportError('Toggle publish failed', err, 'Could not toggle');
    }
  }, [applyDevProjects, devBypass, flash, projects, reportError]);

  // ─── Feature 5: Bulk image delete ───
  const toggleImageSelection = useCallback((projectId: string, url: string) => {
    setSelectedImages((prev) => {
      const set = new Set(prev[projectId] ?? []);
      if (set.has(url)) set.delete(url); else set.add(url);
      return { ...prev, [projectId]: set };
    });
  }, []);

  const handleBulkDeleteImages = useCallback(async (projectId: string, gallery: GalleryKey) => {
    const urls = selectedImages[projectId];
    if (!urls || urls.size === 0) return;
    const project = drafts[projectId] ?? projects.find((p) => p.id === projectId);
    if (!project) return;



    const nextGalleries: Project['galleries'] = {
      finished: project.galleries.finished.filter((u) => !urls.has(u)),
      development: project.galleries.development.filter((u) => !urls.has(u)),
    };
    const cover = urls.has(project.imageUrl) ? (nextGalleries.finished[0] ?? nextGalleries.development[0] ?? '') : project.imageUrl;
    updateDraft(projectId, (draft) => { draft.galleries = nextGalleries; draft.imageUrl = cover; });
    flash('ok', `${urls.size} image${urls.size > 1 ? 's' : ''} deleted`);
    setSelectedImages((prev) => { const next = { ...prev }; delete next[projectId]; return next; });
    setBulkDeleteConfirm(null);

    if (devBypass) {
      applyDevProjects((prev) => prev.map((p) => p.id !== projectId ? p : { ...p, galleries: nextGalleries, imageUrl: cover, updatedAt: Date.now() }));
    } else {
      // Fire-and-forget
      setDoc(doc(db, FIRESTORE_COLLECTION, projectId), { galleries: nextGalleries, imageUrl: cover, updatedAt: serverTimestamp() }, { merge: true })
        .catch((err) => reportError('Bulk delete failed', err));
    }
  }, [applyDevProjects, devBypass, drafts, flash, projects, reportError, selectedImages, updateDraft]);

  // ─── Feature 6: Export JSON backup ───
  const handleExportJSON = useCallback(() => {
    const data = JSON.stringify(projects, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shapenshades-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    flash('ok', 'Backup downloaded');
  }, [flash, projects]);

  // ─── Feature 10: Bulk publish/unpublish ───
  const handleBulkPublish = useCallback(async (published: boolean) => {
    const ids = [...selectedProjectIds];
    if (ids.length === 0) return;
    if (devBypass) {
      applyDevProjects((prev) => prev.map((p) => ids.includes(p.id) && !p.archived ? { ...p, published, updatedAt: Date.now() } : p));
    } else {
      try {
        await Promise.all(ids.map((id) => setDoc(doc(db, FIRESTORE_COLLECTION, id), { published, updatedAt: serverTimestamp() }, { merge: true })));
      } catch (err) { reportError('Bulk action failed', err, 'Could not update projects'); return; }
    }
    flash('ok', `${ids.length} project${ids.length > 1 ? 's' : ''} ${published ? 'published' : 'hidden'}`);
    setSelectedProjectIds(new Set());
  }, [applyDevProjects, devBypass, flash, reportError, selectedProjectIds]);

  // ─── Auto-save: debounced save on draft changes ───
  const hasDirtyDrafts = useMemo(() => Object.keys(drafts).length > 0, [drafts]);
  useEffect(() => {
    if (!hasDirtyDrafts) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      Object.keys(drafts).forEach((projectId) => {
        const d = drafts[projectId];
        if (d && d.title.trim() && d.location.trim()) {
          handleSaveProject(projectId);
        }
      });
    }, 4000); // 4 second debounce
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [drafts, hasDirtyDrafts, handleSaveProject]);

  // Auto-expand first project when tour reaches expanded-project steps
  useEffect(() => {
    if (tourStep === null) return;
    const step = TOUR_STEPS[tourStep];
    if (!step) return;
    if (TOUR_EXPANDED_TARGETS.has(step.target) && visibleProjects.length > 0) {
      const firstId = visibleProjects[0].id;
      if (expandedId !== firstId) {
        setExpandedId(firstId);
        updateDraft(firstId, (d) => d);
      }
    }
  }, [tourStep, visibleProjects, expandedId, updateDraft]);

  // ─── Feature 8: Keyboard shortcuts ───
  const allGalleryImages = useMemo(() => {
    const imgs: string[] = [];
    projects.forEach((p) => { imgs.push(...p.galleries.finished, ...p.galleries.development); });
    return imgs;
  }, [projects]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (tourStep !== null) { setTourStep(null); return; }
        if (imagePreview) { setImagePreview(null); return; }
        if (newProjectOpen) { setNewProjectOpen(false); return; }
        if (deleteConfirm) { setDeleteConfirm(null); return; }
        if (projectConfirm) { setProjectConfirm(null); return; }
        if (bulkRestoreConfirm) { setBulkRestoreConfirm(false); return; }
      }
      if (imagePreview && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const idx = allGalleryImages.indexOf(imagePreview);
        if (idx === -1) return;
        const next = e.key === 'ArrowRight'
          ? (idx + 1) % allGalleryImages.length
          : (idx - 1 + allGalleryImages.length) % allGalleryImages.length;
        setImagePreview(allGalleryImages[next]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tourStep, imagePreview, newProjectOpen, deleteConfirm, projectConfirm, bulkRestoreConfirm, allGalleryImages]);

  const handleSetCover = useCallback(async (projectId: string, url: string) => {
    updateDraft(projectId, (draft) => { draft.imageUrl = url; });

    if (devBypass) {
      applyDevProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, imageUrl: url, updatedAt: Date.now() } : p));
      flash('ok', 'Cover updated');
      return;
    }

    try {
      await setDoc(doc(db, FIRESTORE_COLLECTION, projectId), { imageUrl: url, updatedAt: serverTimestamp() }, { merge: true });
      flash('ok', 'Cover updated');
    } catch (err) {
      reportError('Failed to set cover', err, 'Could not update cover');
    }
  }, [applyDevProjects, devBypass, flash, reportError, updateDraft]);

  const handleResetCover = useCallback(async (projectId: string) => {
    const project = drafts[projectId] ?? projects.find((p) => p.id === projectId);
    if (!project) return;
    const cover = project.galleries.finished[0] ?? project.galleries.development[0] ?? '';
    updateDraft(projectId, (draft) => { draft.imageUrl = cover; });
    if (devBypass) {
      applyDevProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, imageUrl: cover, updatedAt: Date.now() } : p));
      flash('ok', 'Cover reset');
      return;
    }
    try {
      await setDoc(doc(db, FIRESTORE_COLLECTION, projectId), { imageUrl: cover, updatedAt: serverTimestamp() }, { merge: true });
      flash('ok', 'Cover reset');
    } catch (err) {
      reportError('Failed to reset cover', err, 'Could not reset cover');
    }
  }, [applyDevProjects, devBypass, drafts, flash, projects, reportError, updateDraft]);

  const handleCoverFileUpload = useCallback(async (files: FileList | null) => {
    const projectId = coverUploadTarget.current;
    if (!files || files.length === 0 || !projectId) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      flash('err', 'Please select an image file');
      return;
    }
    setUploading(true);
    try {
      if (devBypass) {
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        await handleSetCover(projectId, dataUrl);
      } else {
        const url = await uploadToImgBB(file);
        await handleSetCover(projectId, url);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cover upload failed';
      reportError('Cover upload failed', err, msg);
    } finally {
      setUploading(false);
      coverUploadTarget.current = null;
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  }, [devBypass, flash, handleSetCover, reportError]);

  const openNewProjectModal = useCallback(() => {
    const lastOrder = projects
      .filter((project) => !project.archived)
      .reduce((acc, project) => Math.max(acc, project.displayOrder ?? 0), 0);
    setNewProject(createNewProjectDraft(lastOrder + 1));
    setNewProjectOpen(true);
  }, [projects]);

  const handleCreateProject = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newProject.title.trim();
    const location = newProject.location.trim();
    const activeCount = projects.filter((p) => !p.archived).length;

    if (!title || !location) {
      flash('err', 'Title and location are required');
      return;
    }

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `project_${Date.now().toString(36)}`;
    if (devBypass) {
      const draftProject: Project = {
        id,
        title,
        location,
        category: newProject.category.trim() || 'Projects',
        type: newProject.type,
        subCategory: newProject.subCategory,
        imageUrl: '',
        galleries: { finished: [], development: [] },
        published: newProject.published,
        description: newProject.description.trim(),
        displayOrder: newProject.displayOrder ?? activeCount,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        archived: false,
      };

      applyDevProjects((prev) => {
        return [...prev, draftProject];
      });

      flash('ok', 'Project created');
      setNewProjectOpen(false);
      setExpandedId(id);
      setShowArchived(false);
      return;
    }

    const docRef = doc(db, FIRESTORE_COLLECTION, id);
    const payload: Record<string, unknown> = {
      title,
      location,
      category: newProject.category.trim() || 'Projects',
      type: newProject.type,
      subCategory: newProject.subCategory,
      imageUrl: '',
      galleries: { finished: [], development: [] },
      published: newProject.published,
      description: newProject.description.trim(),
      displayOrder: newProject.displayOrder ?? activeCount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };

    try {
      await setDoc(docRef, payload);
      flash('ok', 'Project created');
      setNewProjectOpen(false);
      setExpandedId(id);
      setShowArchived(false);
    } catch (err) {
      reportError('Failed to create project', err, 'Could not create project');
    }
  }, [applyDevProjects, devBypass, flash, newProject, projects, reportError, setShowArchived]);

  const handleDeleteProject = useCallback(async () => {
    if (!projectConfirm) return;

    if (devBypass) {
      applyDevProjects((prev) => prev.map((project) => (
        project.id === projectConfirm
          ? { ...project, archived: true, published: false, updatedAt: Date.now() }
          : project
      )));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[projectConfirm];
        return next;
      });
      flash('ok', 'Project archived');
      setShowArchived(true);
      setProjectConfirm(null);
      return;
    }

    try {
      await setDoc(doc(db, FIRESTORE_COLLECTION, projectConfirm), {
        isDeleted: true,
        published: false,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      flash('ok', 'Project archived');
      setShowArchived(true);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[projectConfirm];
        return next;
      });
    } catch (err) {
      reportError('Failed to archive project', err, 'Could not archive project');
    }
    setProjectConfirm(null);
  }, [applyDevProjects, devBypass, flash, projectConfirm, reportError, setShowArchived]);

  const handleRestoreProject = useCallback(async (projectId: string) => {
    if (devBypass) {
      applyDevProjects((prev) => prev.map((project) => (
        project.id === projectId
          ? { ...project, archived: false, updatedAt: Date.now() }
          : project
      )));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
      flash('ok', 'Project restored');
      setShowArchived(false);
      return;
    }

    try {
      await setDoc(doc(db, FIRESTORE_COLLECTION, projectId), {
        isDeleted: false,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
      flash('ok', 'Project restored');
      setShowArchived(false);
    } catch (err) {
      reportError('Failed to restore project', err, 'Could not restore project');
    }
  }, [applyDevProjects, devBypass, flash, reportError, setShowArchived]);

  const handleRestoreAllArchived = useCallback(async () => {
    const archivedIds = projects.filter((p) => p.archived).map((p) => p.id);
    if (archivedIds.length === 0) {
      setBulkRestoreConfirm(false);
      return;
    }

    if (devBypass) {
      applyDevProjects((prev) => prev.map((project) => project.archived ? { ...project, archived: false, updatedAt: Date.now() } : project));
      setDrafts((prev) => {
        const next = { ...prev };
        archivedIds.forEach((id) => delete next[id]);
        return next;
      });
      flash('ok', 'All archived projects restored');
      setShowArchived(false);
      setBulkRestoreConfirm(false);
      return;
    }

    try {
      await Promise.all(archivedIds.map((id) => setDoc(doc(db, FIRESTORE_COLLECTION, id), {
        isDeleted: false,
        updatedAt: serverTimestamp(),
      }, { merge: true })));
      setDrafts((prev) => {
        const next = { ...prev };
        archivedIds.forEach((id) => delete next[id]);
        return next;
      });
      flash('ok', 'All archived projects restored');
      setShowArchived(false);
    } catch (err) {
      reportError('Failed to restore all archived projects', err, 'Could not restore all');
    } finally {
      setBulkRestoreConfirm(false);
    }
  }, [applyDevProjects, devBypass, flash, projects, reportError, setShowArchived]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      reportError('Login failed', err);
      const code = err?.code ?? '';
      const friendlyMessages: Record<string, string> = {
        'auth/invalid-credential': 'Invalid email or password',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/invalid-email': 'Please enter a valid email address',
      };
      setLoginError(friendlyMessages[code] || 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (devBypass) {
      setUser(null);
      setDrafts({});
      setExpandedId(null);
      return;
    }
    try {
      await signOut(auth);
    } catch (err) {
      reportError('Logout failed', err, 'Could not sign out');
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="relative w-full min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden flex items-center justify-center">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
        {/* Soft radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />

        <div className="relative w-full max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left panel — brand + info */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <img src="/logo-web.png" alt="Shape N Shades" className="h-20 md:h-24 w-auto object-contain brightness-0 invert opacity-90" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif-display leading-tight tracking-tight">
                Admin Console
              </h1>
              <p className="text-sm md:text-base text-white/50 max-w-md mx-auto lg:mx-0 leading-relaxed">
                Manage your projects, curate galleries, and control what goes live on the website.
              </p>
            </div>

            <div className="hidden lg:flex flex-col gap-4">
              <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4">
                <div className="mt-0.5 p-2 rounded-lg bg-white/[0.06]"><ShieldCheck size={16} className="text-emerald-400" /></div>
                <div>
                  <p className="text-sm font-medium text-white/90">Secure access</p>
                  <p className="text-xs text-white/40 mt-0.5">Only authorized Firebase accounts can sign in.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4">
                <div className="mt-0.5 p-2 rounded-lg bg-white/[0.06]"><Upload size={16} className="text-blue-400" /></div>
                <div>
                  <p className="text-sm font-medium text-white/90">Upload & organize</p>
                  <p className="text-xs text-white/40 mt-0.5">Upload images, manage galleries, set covers — all from one place.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] px-3 py-1.5 rounded-full border ${devBypass ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${devBypass ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
                {devBypass ? 'Local demo' : 'Live'}
              </span>
            </div>
          </div>

          {/* Right panel — login form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white text-gray-900 rounded-3xl shadow-2xl shadow-black/40 p-8 md:p-10 space-y-7 border border-white/20">
              <div className="space-y-2 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Lock size={24} className="text-gray-600" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight mt-3">Welcome back</h2>
                <p className="text-sm text-gray-400">Sign in to manage your projects</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                      placeholder="admin@shapesandshades.com"
                      required
                      autoComplete="email"
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/30 focus:border-transparent transition-shadow placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/30 focus:border-transparent transition-shadow placeholder:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-fade-in">
                    <X size={14} className="flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading || !loginEmail || !loginPassword}
                  className="w-full py-3.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 active:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] text-gray-300 uppercase tracking-[0.2em]">Info</span></div>
              </div>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Need access? Contact an existing admin to add your email through Firebase Authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8F9FB] pt-28 pb-32 px-4 md:px-8 lg:px-12">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl  border text-sm font-semibold animate-fade-in-up flex items-center gap-3 ${toast.type === 'ok' ? 'bg-white/80 border-emerald-100 text-emerald-800' : 'bg-white/80 border-red-100 text-red-800'
          }`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {toast.msg}
        </div>
      )}

      {/* ──── Modals (Delete, Archive, Restore) ──── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 border border-white/20">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Delete this image?</h3>
              <p className="text-sm text-gray-500">This action cannot be undone. It will be permanently removed.</p>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shadow-inner">
              <img src={deleteConfirm.url} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveImage(deleteConfirm.projectId, deleteConfirm.url)}
                className="flex-1 py-3.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors "
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Bulk Delete Confirmation Modal ──── */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 border border-white/20">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-2">
              <Trash2 size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Delete {bulkDeleteConfirm.count} image{bulkDeleteConfirm.count > 1 ? 's' : ''}?</h3>
              <p className="text-sm text-gray-500">This will permanently remove the selected images from the <strong>{bulkDeleteConfirm.gallery}</strong> gallery. This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkDeleteConfirm(null)}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkDeleteImages(bulkDeleteConfirm.projectId, bulkDeleteConfirm.gallery)}
                className="flex-1 py-3.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors "
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {projectConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 border border-white/20">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-2">
              <ArchiveIcon size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Archive Project?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This project will be hidden from your live site. You can view and restore it anytime from the "Archived" filter.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setProjectConfirm(null)}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="flex-1 py-3.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors "
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkRestoreConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 border border-white/20">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-2">
              <RefreshCw size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Restore All?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This will move all archived projects back to your active list. They will be visible in your dashboard again.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBulkRestoreConfirm(false)}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreAllArchived}
                className="flex-1 py-3.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 shadow-lg transition-colors "
              >
                Restore All
              </button>
            </div>
          </div>
        </div>
      )}

      {newProjectOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateProject} className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl space-y-8 border border-white/20 relative overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h2 className="text-2xl font-bold font-serif-display text-gray-900">Create New Project</h2>
                <p className="text-sm text-gray-500 mt-1">Start fresh with a new portfolio entry</p>
              </div>
              <button type="button" onClick={() => setNewProjectOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Title</label>
                  <input
                    value={newProject.title}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
                    required
                    placeholder="e.g. Modern Villa"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors bg-gray-50/50 focus:bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Location</label>
                  <input
                    value={newProject.location}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, location: e.target.value }))}
                    required
                    placeholder="e.g. Beverly Hills, CA"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors bg-gray-50/50 focus:bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Category Tag</label>
                  <input
                    value={newProject.category}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. Residential"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors bg-gray-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Type</label>
                  <div className="relative">
                    <select
                      value={newProject.type}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, type: e.target.value as Project['type'] }))}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors bg-gray-50/50 focus:bg-white cursor-pointer"
                    >
                      {TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Subcategory</label>
                  <div className="relative">
                    <select
                      value={newProject.subCategory}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, subCategory: e.target.value as Project['subCategory'] }))}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors bg-gray-50/50 focus:bg-white cursor-pointer"
                    >
                      {SUBCATEGORY_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Visibility</label>
                  <label className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={newProject.published}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, published: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm font-medium text-gray-700">Publish immediately to live site</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3 relative z-10">
              <button
                type="button"
                onClick={() => setNewProjectOpen(false)}
                className="flex-1 py-4 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] py-4 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 shadow-xl shadow-black/10 transition-colors hover:scale-[1.01]"
              >
                Create Project
              </button>
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2" />
          </form>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl min-w-[280px]">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-black animate-spin" />
              {uploadProgress && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold">{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold tracking-wide">Uploading Assets...</p>
              {uploadProgress && (
                <p className="text-[10px] text-gray-500 font-medium mt-1">
                  Processing {uploadProgress.current} of {uploadProgress.total}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleCoverFileUpload(e.target.files)} />

      {/* ── ImgBB Library Modal ── */}
      {imgbbLibraryOpen && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setImgbbLibraryOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center">
                    <ImageIcon size={14} className="text-white" />
                  </span>
                  ImgBB Library
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">All images uploaded to your ImgBB account — click any to add to gallery</p>
              </div>
              <div className="flex items-center gap-3">
                {!imgbbLoading && imgbbImages.length > 0 && (
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{imgbbImages.length} images</span>
                )}
                <button
                  onClick={() => {
                    setImgbbLibraryOpen(false);
                    setImgbbImages([]);
                    setImgbbError(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {imgbbLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-gray-100 border-t-violet-600 animate-spin" />
                  <p className="text-sm font-medium text-gray-400">Fetching your ImgBB library…</p>
                </div>
              )}
              {imgbbError && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <p className="text-sm font-semibold text-red-500">Could not load library</p>
                  <p className="text-xs text-gray-400 max-w-sm">{imgbbError}</p>
                  <button
                    onClick={async () => {
                      setImgbbLoading(true);
                      setImgbbError(null);
                      try {
                        const res = await fetch(`https://api.imgbb.com/1/images?key=${IMGBB_API_KEY}&page=1&perpage=200`);
                        const json = await res.json();
                        if (!json.data) throw new Error(json.error?.message ?? 'Failed');
                        setImgbbImages((json.data as { id: string; url: string; thumb: { url: string }; title: string }[]).map((img) => ({ id: img.id, url: img.url, thumb: img.thumb?.url ?? img.url, title: img.title })));
                      } catch (err) {
                        setImgbbError(err instanceof Error ? err.message : 'Failed');
                      } finally {
                        setImgbbLoading(false);
                      }
                    }}
                    className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!imgbbLoading && !imgbbError && imgbbImages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <ImageIcon size={40} className="text-gray-200" />
                  <p className="text-sm font-medium text-gray-400">No images found in your ImgBB account</p>
                </div>
              )}
              {!imgbbLoading && imgbbImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {imgbbImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={async () => {
                        if (!imgbbLibraryTarget) return;
                        const { projectId, gallery } = imgbbLibraryTarget;
                        updateDraft(projectId, (d) => {
                          if (!d.galleries[gallery].includes(img.url)) {
                            d.galleries[gallery] = [...d.galleries[gallery], img.url];
                          }
                        });
                        if (!devBypass) {
                          const proj = projects.find((p) => p.id === projectId);
                          if (proj) {
                            const current = proj.galleries[gallery] ?? [];
                            if (!current.includes(img.url)) {
                              await setDoc(doc(db, FIRESTORE_COLLECTION, projectId), {
                                galleries: { ...proj.galleries, [gallery]: [...current, img.url] },
                                updatedAt: serverTimestamp(),
                              }, { merge: true });
                            }
                          }
                        }
                        flash('ok', 'Image added to gallery');
                        setImgbbLibraryOpen(false);
                      }}
                      className="relative aspect-square rounded-xl overflow-hidden group border-2 border-transparent hover:border-violet-500 transition-colors"
                      title={img.title}
                    >
                      <img src={img.thumb} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-bold uppercase tracking-wider bg-violet-600 px-2 py-1 rounded-lg transition-opacity">Add</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* ──── SECTION 1: Header & Controls ──── */}
        <div className="sticky top-4 z-[40] bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-black/20">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif-display tracking-tight text-gray-900">Admin Console</h1>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  <div className={`w-1.5 h-1.5 rounded-full ${loadingProjects ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`} />
                  {loadingProjects ? 'Syncing...' : 'Online'}
                </span>
                {devBypass && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Dev Mode
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            <button
              data-tour="tour-btn"
              onClick={() => setTourStep(0)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <HelpCircle size={14} /> Guide
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1" />
            <span className="text-xs font-medium text-gray-500 px-2 truncate max-w-[120px] hidden sm:block">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>
            <button
              data-tour="new-project-btn"
              onClick={openNewProjectModal}
              className="ml-2 px-5 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 shadow-lg shadow-black/20  transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={3} />
              <span className="hidden sm:inline">New Project</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* ──── SECTION 2: Dashboard Widgets ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Column */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4" data-tour="dashboard-stats">
            {[
              { label: 'Total Projects', value: dashboardStats.total, icon: LayoutGrid, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
              { label: 'Live & Active', value: dashboardStats.published, icon: Globe, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
              { label: 'Drafts', value: dashboardStats.active - dashboardStats.published, icon: Edit3, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
              { label: 'Total Images', value: dashboardStats.totalImages, icon: ImageIcon, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
            ].map((stat, i) => {
              const Icon = stat.icon || LayoutGrid; // Fallback
              return (
                <div key={i} className={`relative overflow-hidden rounded-3xl p-5 border ${stat.border} ${stat.bg} transition-colors duration-300 hover:shadow-lg `}>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className={`w-8 h-8 rounded-full bg-white/60 flex items-center justify-center mb-3 ${stat.text}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  </div>
                  {/* Decor */}
                  <Icon className={`absolute -right-4 -bottom-4 z-0 opacity-[0.07] ${stat.text}`} size={100} />
                </div>
              );
            })}
          </div>

          {/* Quick Find Widget */}
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Quick Actions</h3>
              <button
                data-tour="export-btn"
                onClick={handleExportJSON}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                title="Export Backup"
              >
                <Download size={16} />
              </button>
            </div>

            <div className="relative group" data-tour="search-bar">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a project..."
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white focus:border-gray-200 transition-colors placeholder:text-gray-400"
              />
            </div>

            <button
              data-tour="archive-toggle"
              onClick={() => {
                setExpandedId(null);
                setShowArchived((prev) => !prev);
              }}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-colors ${showArchived
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
            >
              {showArchived ? <RefreshCw size={14} className="animate-spin-slow" /> : <ArchiveIcon size={14} />}
              {showArchived ? 'View Active Projects' : `View Archive (${archiveCount})`}
            </button>
          </div>
        </div>



        {/* ──── Alerts (only visible when relevant) ──── */}

        {/* ──── Floating Bulk Actions ──── */}
        {selectedProjectIds.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-gray-900 text-white p-2 rounded-2xl shadow-2xl flex items-center gap-2 pr-4 border border-gray-700/50">
              <div className="bg-gray-800 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2">
                <CheckSquare size={14} className="text-blue-400" />
                {selectedProjectIds.size} Selected
              </div>
              <div className="h-4 w-px bg-gray-700 mx-1" />
              <button onClick={() => handleBulkPublish(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors">
                <Eye size={14} /> Publish
              </button>
              <button onClick={() => handleBulkPublish(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <EyeOff size={14} /> Hide
              </button>
              <div className="h-4 w-px bg-gray-700 mx-1" />
              <button onClick={() => setSelectedProjectIds(new Set())} className="text-xs font-medium text-gray-400 hover:text-white px-2">
                Cancel
              </button>
            </div>
          </div>
        )}

        {diagnostics && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 shadow-sm mx-auto max-w-2xl">
            <div className="flex items-start gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-700 mt-1">Debug</div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{diagnostics.context}</p>
                <p className="text-xs text-amber-700/80">{new Date(diagnostics.time).toLocaleTimeString()} — {diagnostics.detail}</p>
              </div>
              <button
                onClick={() => setDiagnostics(null)}
                className="px-3 py-1 text-[11px] font-semibold rounded-lg border border-amber-200 hover:bg-amber-100"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ──── SECTION 3: Projects List ──── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">
              {showArchived ? 'Archived Projects' : 'Project Portfolio'} ({visibleProjects.length})
            </h2>
            {!showArchived && visibleProjects.length > 1 && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium bg-gray-50 px-2 py-1 rounded-lg">
                <GripVertical size={12} /> Drag to reorder
              </span>
            )}
          </div>

          {visibleProjects.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center space-y-4 hover:border-gray-300 transition-colors">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <FilePlus size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {showArchived ? 'No archived projects' : 'Start Your Portfolio'}
                </h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                  {showArchived ? 'Archived projects will appear here.' : 'Create your first project to showcase your work to the world.'}
                </p>
              </div>
              {!showArchived && (
                <button
                  onClick={openNewProjectModal}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 shadow-xl shadow-black/10 transition-colors  mt-2"
                >
                  <Plus size={16} strokeWidth={3} />
                  Create Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleProjects.map((project, projectIndex) => {
                const isOpen = expandedId === project.id;
                const draft = drafts[project.id] ?? project;
                const activeTab = getActiveGallery(project.id);
                const galleryImages = draft.galleries[activeTab];
                const finishedCount = draft.galleries.finished.length;
                const developmentCount = draft.galleries.development.length;
                const metadataDirty = hasMetadataChanges(project.id);
                const isArchived = project.archived ?? false;
                const statusLabel = isArchived ? 'Archived' : draft.published ? 'Live' : 'Hidden';
                const statusClass = isArchived
                  ? 'bg-red-50 text-red-600 border-red-100'
                  : draft.published
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-gray-50 text-gray-500 border-gray-100';

                const isProjectDragging = projectDragIdx === projectIndex;
                const isProjectDragOver = projectDragOverIdx === projectIndex;
                const isSelected = selectedProjectIds.has(project.id);

                return (
                  <div
                    data-tour={projectIndex === 0 ? 'project-card-0' : undefined}
                    key={project.id}

                    onDragOver={(e) => {
                      if (projectDragIdx === null) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setProjectDragOverIdx(projectIndex);
                    }}
                    onDragLeave={() => { if (projectDragOverIdx === projectIndex) setProjectDragOverIdx(null); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (projectDragIdx !== null) handleReorderProjects(projectDragIdx, projectIndex);
                      setProjectDragIdx(null);
                      setProjectDragOverIdx(null);
                    }}
                    onDragEnd={() => { setProjectDragIdx(null); setProjectDragOverIdx(null); }}
                    className={`group bg-white rounded-3xl border transition-colors duration-300 will-change-transform ${isOpen
                      ? 'col-span-full shadow-2xl ring-1 ring-black/5 scale-[1.005] z-20'
                      : 'shadow-sm hover:shadow-xl  hover:border-gray-300'
                      } ${isProjectDragging ? 'opacity-40 scale-95 border-dashed border-gray-400 cursor-grabbing' : ''
                      } ${isProjectDragOver ? 'border-blue-500 ring-2 ring-blue-200 scale-[1.02] z-10' : 'border-gray-100'
                      } ${isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/10' : ''
                      }`}
                  >
                    {/* Collapsed Card View */}
                    <div className="relative">
                      {/* Project Image Header */}
                      <div className={`relative overflow-hidden ${isOpen ? 'h-48' : 'h-48'}`}>
                        {/* Image Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10 transition-opacity duration-300 group-hover:via-black/20" />

                        <img
                          src={draft.imageUrl || FALLBACK_IMAGE}
                          alt={draft.title || draft.location}
                          draggable={false}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 select-none"
                          loading="lazy"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/90 text-gray-900  shadow-sm">
                            {draft.type}
                          </span>
                        </div>

                        <div className="absolute top-4 right-4 z-20">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border  shadow-sm flex items-center gap-1.5 ${statusClass}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isArchived ? 'bg-red-500' : draft.published ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {statusLabel}
                          </span>
                        </div>

                        {/* Bottom Text */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 z-20 text-white">
                          <h3 className="text-xl font-bold font-serif-display leading-tight mb-1 text-shadow-sm truncate">{draft.location}</h3>
                          <p className="text-xs font-medium text-white/80 uppercase tracking-wider truncate">{draft.subCategory}</p>
                        </div>
                      </div>

                      {/* Card Content (Visible only when NOT expanded or always? Let's keep it minimal) */}
                      {!isOpen && (
                        <div className="p-5 flex flex-col gap-4">
                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center border border-gray-100">
                              <span className="text-lg font-bold text-gray-900">{finishedCount}</span>
                              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Finished</span>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center border border-gray-100">
                              <span className="text-lg font-bold text-gray-900">{developmentCount}</span>
                              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">WIP</span>
                            </div>
                          </div>

                          {/* Actions Footer */}
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-3">
                              {!showArchived && (
                                <>
                                  <label className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 cursor-pointer transition-colors" title="Select">
                                    <input
                                      data-tour={projectIndex === 0 ? 'select-checkbox-0' : undefined}
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        setSelectedProjectIds((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(project.id)) next.delete(project.id); else next.add(project.id);
                                          return next;
                                        });
                                      }}
                                      className="appearance-none w-5 h-5 rounded border-2 border-gray-300 checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer"
                                    />
                                    <CheckSquare size={14} className={`absolute pointer-events-none text-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                  </label>

                                  <div
                                    draggable={!showArchived}
                                    onDragStart={(e) => {
                                      if (showArchived) { e.preventDefault(); return; }
                                      e.dataTransfer.effectAllowed = 'move';
                                      setProjectDragIdx(projectIndex);
                                      const card = e.currentTarget.closest('.group');
                                      if (card) e.dataTransfer.setDragImage(card, 0, 0);
                                    }}
                                    data-tour={projectIndex === 0 ? 'drag-handle-0' : undefined}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-black transition-colors"
                                    title="Drag to reorder"
                                  >
                                    <GripVertical size={18} />
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {!isArchived && (
                                <button
                                  data-tour={projectIndex === 0 ? 'publish-toggle-0' : undefined}
                                  onClick={(e) => { e.stopPropagation(); handleQuickTogglePublish(project.id); }}
                                  className={`p-2 rounded-xl transition-colors border ${project.published ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100 hover:text-gray-600'}`}
                                  title={project.published ? 'Unpublish' : 'Publish'}
                                >
                                  {project.published ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setExpandedId(project.id);
                                  updateDraft(project.id, (d) => d); // Init draft
                                }}
                                className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 flex items-center gap-2"
                              >
                                Edit Project <Edit3 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-6 lg:p-10 space-y-10 animate-fade-in relative">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

                        {/* Close Button Top Right */}
                        <div className="absolute top-6 right-6 z-20">
                          <button
                            onClick={() => setExpandedId(null)}
                            className="p-2 rounded-full bg-white text-gray-400 hover:text-black hover:bg-gray-100 shadow-sm border border-gray-100 transition-colors "
                            title="Close Editor"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        {isArchived && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 flex items-center gap-3">
                            <ArchiveIcon size={18} />
                            This project is currently archived. Restore it to make it visible on your site.
                          </div>
                        )}

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 relative z-10">
                          {/* ──── Left Column: Essentials (Metadata) ──── */}
                          <div className="xl:col-span-4 space-y-8">
                            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-serif text-sm">1</div>
                              <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900">Project Essentials</h4>
                            </div>

                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Project Title</label>
                                  <input
                                    value={draft.title}
                                    onChange={(e) => updateDraftField(project.id, 'title', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors bg-gray-50 focus:bg-white"
                                    placeholder="Official Project Name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Location</label>
                                  <div className="relative">
                                    <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                      value={draft.location}
                                      onChange={(e) => updateDraftField(project.id, 'location', e.target.value)}
                                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors bg-gray-50 focus:bg-white"
                                      placeholder="City, Country"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Type</label>
                                    <div className="relative">
                                      <select
                                        value={draft.type}
                                        onChange={(e) => updateDraftField(project.id, 'type', e.target.value as Project['type'])}
                                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors bg-gray-50 focus:bg-white cursor-pointer"
                                      >
                                        {TYPE_OPTIONS.map((option) => (
                                          <option key={option} value={option}>{option}</option>
                                        ))}
                                      </select>
                                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Subcategory</label>
                                    <div className="relative">
                                      <select
                                        value={draft.subCategory}
                                        onChange={(e) => updateDraftField(project.id, 'subCategory', e.target.value as Project['subCategory'])}
                                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors bg-gray-50 focus:bg-white cursor-pointer"
                                      >
                                        {SUBCATEGORY_OPTIONS.map((option) => (
                                          <option key={option} value={option}>{option}</option>
                                        ))}
                                      </select>
                                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Category Tag</label>
                                  <input
                                    value={draft.category}
                                    onChange={(e) => updateDraftField(project.id, 'category', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors bg-gray-50 focus:bg-white"
                                    placeholder="e.g. Residential, Commercial"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Display Order</label>
                                  <input
                                    type="number"
                                    value={draft.displayOrder ?? ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const parsed = value === '' ? null : Number(value);
                                      updateDraftField(project.id, 'displayOrder', parsed === null || Number.isNaN(parsed) ? null : parsed);
                                    }}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors bg-gray-50 focus:bg-white"
                                    placeholder="Sort Order (e.g. 1, 2, 3)"
                                  />
                                </div>

                                <div className="pt-2">
                                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors">
                                    <span className="text-sm font-medium text-gray-900">Visible on Site</span>
                                    <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${draft.published ? 'bg-black' : 'bg-gray-300'}`}>
                                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${draft.published ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={draft.published}
                                      onChange={(e) => updateDraftField(project.id, 'published', e.target.checked)}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>

                              <div className="space-y-2 pt-2 border-t border-gray-100">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Description</label>
                                <textarea
                                  value={draft.description ?? ''}
                                  onChange={(e) => updateDraftField(project.id, 'description', e.target.value)}
                                  rows={4}
                                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors bg-gray-50 focus:bg-white resize-none"
                                  placeholder="Add a brief description of the project..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* ──── Right Column: Media Center ──── */}
                          <div className="xl:col-span-8 space-y-8">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-serif text-sm">2</div>
                                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900">Media Center</h4>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
                                <span className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${metadataDirty ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`} />
                                  {metadataDirty ? 'Saving changes...' : 'All changes saved'}
                                </span>
                              </div>
                            </div>

                            {/* Cover Image Section */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100" data-tour="cover-section">
                              <div className="flex items-center justify-between mb-4">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Cover Image</label>
                                <button onClick={() => handleResetCover(project.id)} className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors">Reset to Default</button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Current Cover Preview */}
                                <div className="md:col-span-2 aspect-video rounded-2xl overflow-hidden relative group bg-gray-100 border border-gray-200">
                                  {draft.imageUrl ? (
                                    <>
                                      <img src={draft.imageUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </>
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full text-gray-300">
                                      <Image size={40} />
                                    </div>
                                  )}
                                  <div className="absolute top-3 left-3 bg-black/80  text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-widest">
                                    Active Cover
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-3">
                                  <button
                                    onClick={() => {
                                      coverUploadTarget.current = project.id;
                                      coverInputRef.current?.click();
                                    }}
                                    className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-black hover:border-black hover:bg-gray-50 transition-colors group"
                                  >
                                    <Upload size={24} className="group-hover:-translate-y-1 transition-transform" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Upload New</span>
                                  </button>

                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={urlDrafts[`cover_${project.id}`] ?? ''}
                                      onChange={(e) => setUrlDrafts((prev) => ({ ...prev, [`cover_${project.id}`]: e.target.value }))}
                                      placeholder="Paste URL..."
                                      className="w-full border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors bg-gray-50 focus:bg-white"
                                    />
                                    <button
                                      onClick={async () => {
                                        const url = (urlDrafts[`cover_${project.id}`] ?? '').trim();
                                        if (!url) return;
                                        await handleSetCover(project.id, url);
                                        setUrlDrafts((prev) => ({ ...prev, [`cover_${project.id}`]: '' }));
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black text-white rounded-lg hover:bg-gray-800"
                                    >
                                      <CheckSquare size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Suggestions */}
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Quick Select Suggestions</p>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                  {suggestCovers(project.id, draft.galleries).map((coverUrl, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleSetCover(project.id, coverUrl)}
                                      className={`relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${draft.imageUrl === coverUrl ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'}`}
                                    >
                                      <img src={coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).closest('button')!.style.display = 'none'; }} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Galleries Section */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex p-1 bg-gray-100 rounded-xl" data-tour="gallery-tabs">
                                  {GALLERY_TABS.map((tab) => {
                                    const count = tab === 'finished' ? finishedCount : developmentCount;
                                    return (
                                      <button
                                        key={tab}
                                        onClick={() => setActiveGalleryTab((prev) => ({ ...prev, [project.id]: tab }))}
                                        className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                      >
                                        {tab === 'finished' ? 'Finished' : 'Development'} <span className="opacity-40 ml-1">({count})</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                                    onClick={() => {
                                      const current = selectedImages[project.id];
                                      if (current && current.size === galleryImages.length) {
                                        setSelectedImages((prev) => { const next = { ...prev }; delete next[project.id]; return next; });
                                      } else {
                                        setSelectedImages((prev) => ({ ...prev, [project.id]: new Set(galleryImages) }));
                                      }
                                    }}
                                  >
                                    {selectedImages[project.id]?.size === galleryImages.length ? 'Deselect All' : 'Select All'}
                                  </button>
                                  {(selectedImages[project.id]?.size ?? 0) > 0 && (
                                    <button
                                      className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                                      onClick={() => handleBulkDeleteImages(project.id, activeTab)}
                                    >
                                      <Trash2 size={14} /> Delete ({selectedImages[project.id]?.size})
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div data-tour="upload-area" className="relative group">
                                <div
                                  onClick={() => {
                                    uploadTargetRef.current = { projectId: project.id, gallery: activeTab };
                                    setUploadTarget({ projectId: project.id, gallery: activeTab });
                                    fileInputRef.current?.click();
                                  }}
                                  className="border-2 border-dashed border-gray-200 rounded-2xl h-24 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-black hover:border-black hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <Upload size={20} />
                                    <span className="text-sm font-bold">Drag & Drop or Click to Upload</span>
                                  </div>
                                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 group-hover:text-gray-500">
                                    Adding to {activeTab === 'finished' ? 'Finished Gallery' : 'Development Gallery'}
                                  </span>
                                </div>
                              </div>

                              {/* URL / Local Path Input */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={urlDrafts[project.id] ?? ''}
                                  onChange={(e) => setUrlDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddImageUrl(project.id); }}
                                  placeholder="Paste image or video URL here and click Add…"
                                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors bg-gray-50 focus:bg-white"
                                />
                                <button
                                  onClick={() => handleAddImageUrl(project.id)}
                                  className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap"
                                >
                                  Add
                                </button>
                                <button
                                  title="Browse your ImgBB image library"
                                  onClick={async () => {
                                    setImgbbLibraryTarget({ projectId: project.id, gallery: activeTab });
                                    setImgbbLibraryOpen(true);
                                    if (imgbbImages.length > 0) return; // already fetched
                                    setImgbbLoading(true);
                                    setImgbbError(null);
                                    try {
                                      const res = await fetch(`https://api.imgbb.com/1/images?key=${IMGBB_API_KEY}&page=1&perpage=200`);
                                      const json = await res.json();
                                      if (!json.data) throw new Error(json.error?.message ?? 'Failed to load ImgBB library');
                                      const imgs = (json.data as { id: string; url: string; thumb: { url: string }; title: string }[]).map((img) => ({
                                        id: img.id,
                                        url: img.url,
                                        thumb: img.thumb?.url ?? img.url,
                                        title: img.title,
                                      }));
                                      setImgbbImages(imgs);
                                    } catch (err) {
                                      setImgbbError(err instanceof Error ? err.message : 'Could not load ImgBB library');
                                    } finally {
                                      setImgbbLoading(false);
                                    }
                                  }}
                                  className="px-3 py-2.5 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors whitespace-nowrap flex items-center gap-1.5"
                                >
                                  <ImageIcon size={14} /> Library
                                </button>
                              </div>

                              {/* How to add videos — friendly guide for non-tech users */}
                              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                                  <span>🎬</span> How to Add a Video
                                </p>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                  Videos cannot be uploaded directly from your computer — they need to be hosted online first. Here's the easiest way:
                                </p>
                                <ol className="text-xs text-amber-800 space-y-1.5 list-none">
                                  <li className="flex gap-2"><span className="font-bold shrink-0">Option 1 —</span><span><strong>YouTube / Vimeo:</strong> Upload your video there, copy the video link, and paste it in the box above.</span></li>
                                  <li className="flex gap-2"><span className="font-bold shrink-0">Option 2 —</span><span><strong>Google Drive:</strong> Upload the video to Google Drive → right-click → "Get link" → set to "Anyone with the link" → paste that link above.</span></li>
                                  <li className="flex gap-2"><span className="font-bold shrink-0">Option 3 —</span><span><strong>Direct video link:</strong> If you already have a link ending in <code className="bg-amber-100 px-1 rounded">.mp4</code> from anywhere online, just paste it directly.</span></li>
                                </ol>
                                <p className="text-[10px] text-amber-600 pt-1">📸 Photos can be uploaded directly using the "Click to Upload" button above.</p>
                              </div>

                              {/* Force Restore Button - Always visible for Base Projects (1-8) to fix broken/stale data */}
                              {PROJECTS.some(p => p.id === project.id) && (
                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm(`Is this the canonical project "${project.title}"? \nThis will WIPE all current gallery data and RESTORE the original images from the code base (constants.ts).\n\nUse this if images are broken, missing, or just won't load.`)) return;

                                      const base = PROJECTS.find(p => p.id === project.id);
                                      if (!base) return;

                                      // Restore from constants
                                      const cleanGallery = base.galleries[activeTab] || [];

                                      // Update state immediately
                                      updateDraft(project.id, (d) => {
                                        d.galleries[activeTab] = cleanGallery;
                                      });

                                      // Persist to Firestore
                                      if (!devBypass) {
                                        try {
                                          await setDoc(doc(db, FIRESTORE_COLLECTION, project.id), {
                                            galleries: {
                                              ...project.galleries,
                                              [activeTab]: cleanGallery
                                            },
                                            updatedAt: serverTimestamp()
                                          }, { merge: true });
                                          flash('success', 'Project gallery restored to defaults!');
                                        } catch (e) {
                                          console.error(e);
                                          flash('err', 'Failed to restore in database.');
                                        }
                                      }
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-200"
                                  >
                                    <RefreshCw size={10} />
                                    <span>Reset to Default Gallery</span>
                                  </button>
                                </div>
                              )}

                              {galleryImages.length === 0 ? (
                                <div className="text-center py-12 opacity-60 flex flex-col items-center gap-4">
                                  <ImageIcon size={48} className="mx-auto mb-2 text-gray-300" />
                                  <p className="text-sm font-medium text-gray-500">No images in this gallery yet.</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                  {galleryImages.map((url, idx) => {
                                    const isDragging = dragState?.projectId === project.id && dragState?.gallery === activeTab && dragState?.fromIndex === idx;
                                    const isDragOver = dragState?.projectId === project.id && dragState?.gallery === activeTab && dragOverIndex === idx;
                                    const isImgSelected = selectedImages[project.id]?.has(url) ?? false;
                                    const isCover = draft.imageUrl === url;

                                    return (
                                      <div
                                        key={`${url}-${idx}`}
                                        draggable
                                        onDragStart={(e) => {
                                          e.dataTransfer.effectAllowed = 'move';
                                          setDragState({ projectId: project.id, gallery: activeTab, fromIndex: idx });
                                        }}
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          setDragOverIndex(idx);
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          if (dragState && dragState.projectId === project.id && dragState.gallery === activeTab) {
                                            handleReorderImages(project.id, activeTab, dragState.fromIndex, idx);
                                          }
                                          setDragState(null);
                                          setDragOverIndex(null);
                                        }}
                                        className={`relative aspect-square rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing border-2 transition-colors duration-300 ${isImgSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-200'
                                          } ${isDragging ? 'opacity-20' : ''} ${isDragOver ? 'scale-105 z-10 ring-2 ring-blue-500' : ''} ${fadingImages.has(url) ? 'opacity-0 scale-75 pointer-events-none' : ''}`}
                                      >
                                        {url.startsWith('data:video') || /\.(mp4|mov|webm|ogv|quicktime)$/i.test(url) || url.includes('drive.google.com') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('pexels.com/video') ? (
                                          <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center gap-1 pointer-events-none">
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M8 5v14l11-7z" /></svg>
                                            </div>
                                            <span className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Video</span>
                                          </div>
                                        ) : (
                                          <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" loading="lazy" />
                                        )}

                                        {/* Overlays */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                          <div className="flex justify-between items-start">
                                            <input
                                              type="checkbox"
                                              checked={isImgSelected}
                                              onChange={(e) => { e.stopPropagation(); toggleImageSelection(project.id, url); }}
                                              className="w-4 h-4 rounded border-white/50 bg-black/20 checked:bg-blue-500 cursor-pointer"
                                            />
                                            <button onClick={(e) => { e.stopPropagation(); handleRemoveImage(project.id, url); }} className="p-1 bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors">
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                          <div className="flex justify-center gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); setImagePreview(url); }} className="p-1.5 bg-white/20  rounded-full text-white hover:bg-white/40" title="View">
                                              <Maximize2 size={12} />
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleMoveImage(project.id, url, activeTab); }}
                                              className="p-1.5 bg-white/20  rounded-full text-white hover:bg-amber-500 transition-colors"
                                              title={`Move to ${activeTab === 'finished' ? 'Development' : 'Finished'}`}
                                            >
                                              <ArrowRightLeft size={12} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleSetCover(project.id, url); }} className={`p-1.5  rounded-full hover:bg-white/40 ${isCover ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white'}`} title="Set as Cover">
                                              <Star size={12} />
                                            </button>
                                          </div>
                                        </div>

                                        {isCover && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></div>}
                                        <div className="absolute bottom-1 left-1 bg-black/50 backdrop-blur-sm text-white text-[9px] px-1.5 rounded font-mono">{idx + 1}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ──── Footer Actions ──── */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-6 border-t border-gray-200 border-dashed gap-4 sm:gap-0">
                          <div className="w-full sm:w-auto">
                            <button
                              onClick={() => handleDuplicateProject(draft)}
                              className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                            >
                              <Copy size={16} /> Duplicate
                            </button>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                            {isArchived ? (
                              <button
                                onClick={() => handleRestoreProject(project.id)}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors  justify-center"
                              >
                                Restore Project
                              </button>
                            ) : (
                              <button
                                onClick={() => setProjectConfirm(project.id)}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100 justify-center"
                              >
                                Archive Project
                              </button>
                            )}

                            <div className="hidden sm:block h-8 w-px bg-gray-300 mx-2" />

                            <button
                              onClick={() => setExpandedId(null)}
                              className="w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/20 transition-colors  flex items-center justify-center gap-2"
                            >
                              <CheckSquare size={16} /> Done Editing
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
          }
        </div>

        {/* Image Preview Modal */}
        {
          imagePreview && (() => {
            const currentIdx = allGalleryImages.indexOf(imagePreview);
            const hasPrev = currentIdx > 0;
            const hasNext = currentIdx < allGalleryImages.length - 1;
            return (
              <div
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
                onClick={() => setImagePreview(null)}
              >
                {/* Close button */}
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                >
                  <X size={24} />
                </button>
                {/* Image counter + keyboard hint */}
                <div className="absolute top-6 left-6 text-white/60 text-xs z-10">
                  {currentIdx >= 0 ? `${currentIdx + 1} / ${allGalleryImages.length}` : ''}
                  <span className="ml-3 text-white/30">← → to navigate · Esc to close</span>
                </div>
                {/* Prev arrow */}
                {hasPrev && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setImagePreview(allGalleryImages[currentIdx - 1]); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                  >
                    <ChevronLeft size={28} />
                  </button>
                )}
                {/* Next arrow */}
                {hasNext && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setImagePreview(allGalleryImages[currentIdx + 1]); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                  >
                    <ChevronRight size={28} />
                  </button>
                )}
                <img
                  src={imagePreview}
                  alt="Full preview"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })()
        }

        {/* ──── Interactive Spotlight Tour ──── */}
        {tourStep !== null && tourStep >= 0 && tourStep < TOUR_STEPS.length && (() => {
          const step = TOUR_STEPS[tourStep];
          const isFirst = tourStep === 0;
          const isLast = tourStep === TOUR_STEPS.length - 1;
          const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;

          // Scroll target into view and compute its position
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          const rect = el?.getBoundingClientRect();

          // Decide tooltip position: below if element is in top half, above otherwise
          const placeBelow = rect ? rect.bottom < window.innerHeight * 0.6 : true;

          return (
            <>
              {/* Full-screen overlay with spotlight cutout */}
              <div className="fixed inset-0 z-[60]" onClick={() => setTourStep(null)}>
                <svg width="100%" height="100%" className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                  <defs>
                    <mask id="tour-spotlight">
                      <rect x="0" y="0" width="100%" height="100%" fill="white" />
                      {rect && (
                        <rect
                          x={rect.left - TOUR_SPOTLIGHT_PAD}
                          y={rect.top - TOUR_SPOTLIGHT_PAD}
                          width={rect.width + TOUR_SPOTLIGHT_PAD * 2}
                          height={rect.height + TOUR_SPOTLIGHT_PAD * 2}
                          rx="12"
                          fill="black"
                        />
                      )}
                    </mask>
                  </defs>
                  <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.60)" mask="url(#tour-spotlight)" />
                </svg>

                {/* Spotlight ring around target element */}
                {rect && (
                  <div
                    className="absolute border-2 border-blue-400 rounded-xl pointer-events-none animate-pulse"
                    style={{
                      top: rect.top - TOUR_SPOTLIGHT_PAD,
                      left: rect.left - TOUR_SPOTLIGHT_PAD,
                      width: rect.width + TOUR_SPOTLIGHT_PAD * 2,
                      height: rect.height + TOUR_SPOTLIGHT_PAD * 2,
                    }}
                  />
                )}
              </div>

              {/* Tooltip card positioned near the element */}
              <div
                className="fixed z-[61] max-w-sm w-[90vw] bg-white rounded-2xl shadow-2xl p-5 space-y-3 animate-fade-in"
                style={rect ? {
                  left: Math.max(12, Math.min(rect.left, window.innerWidth - 380)),
                  ...(placeBelow
                    ? { top: rect.bottom + TOUR_SPOTLIGHT_PAD + 12 }
                    : { bottom: window.innerHeight - rect.top + TOUR_SPOTLIGHT_PAD + 12 }
                  ),
                } : {
                  top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Step counter + progress */}
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-semibold">
                    Step {tourStep + 1} of {TOUR_STEPS.length}
                  </p>
                  <button onClick={() => setTourStep(null)} className="p-0.5 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-colors duration-300" style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%` }} />
                </div>
                <h3 className="text-base font-bold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                {/* Navigation */}
                <div className="flex items-center justify-between pt-1">
                  <button onClick={() => setTourStep(null)} className="text-[11px] text-gray-400 hover:text-gray-600 hover:underline">
                    Skip
                  </button>
                  <div className="flex items-center gap-2">
                    {!isFirst && (
                      <button
                        onClick={() => setTourStep(tourStep - 1)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <ChevronLeft size={12} /> Back
                      </button>
                    )}
                    {isLast ? (
                      <button
                        onClick={() => setTourStep(null)}
                        className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Done ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => setTourStep(tourStep + 1)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-black text-white hover:opacity-90"
                      >
                        Next <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          );
        })()
        }
      </div>
    </div >
  );
};

export default Admin;
