import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { PROJECTS } from '../constants';
import { Project, ViewProps } from '../types';
import { Trash2, Plus, Upload, Image, X, ChevronDown, ChevronUp, Star, LogIn, Loader2 } from 'lucide-react';
import { auth, db, storage, isFirebaseConfigured } from '../src/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, orderBy, query, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const FIRESTORE_COLLECTION = 'projects';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000';
const DEV_STORAGE_KEY = 'shapes_shades_dev_projects_v2';
const STOCK_COVER_POOL: string[] = [
  'https://images.unsplash.com/photo-1505693415763-3ed5e04ba4cd?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1465805139202-a644e217f00b?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1473181488821-2d23949a045a?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1505692069463-5e3405e01f4b?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1505692270181-d6cb0f3c52f1?auto=format&fit=crop&w=1800&q=80',
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

const suggestCovers = (projectId: string): string[] => {
  if (STOCK_COVER_POOL.length < 3) return STOCK_COVER_POOL;
  const hash = projectId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const picks: string[] = [];
  let idx = hash % STOCK_COVER_POOL.length;
  while (picks.length < 3) {
    const candidate = STOCK_COVER_POOL[idx % STOCK_COVER_POOL.length];
    if (!picks.includes(candidate)) picks.push(candidate);
    idx = (idx + 5) % STOCK_COVER_POOL.length;
  }
  return picks;
};

const ensureDefaultProjects = (entries: Project[]): Project[] => {
  const map = new Map(entries.map((project) => [project.id, normalizeProject(project)]));
  PROJECTS.forEach((defaultProject) => {
    if (!map.has(defaultProject.id)) {
      map.set(defaultProject.id, normalizeProject({ ...defaultProject, archived: false }));
    }
  });
  return sortProjects([...map.values()]);
};

const readDevProjects = (): Project[] => {
  if (typeof window === 'undefined') return PROJECTS;
  const raw = window.localStorage.getItem(DEV_STORAGE_KEY);
  if (!raw) {
    const seeded = ensureDefaultProjects(normalizeProjects(PROJECTS));
    window.localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      const seeded = ensureDefaultProjects(normalizeProjects(PROJECTS));
      window.localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return ensureDefaultProjects(normalizeProjects(parsed as Project[]));
  } catch (err) {
    console.warn('[Admin] Failed to parse local dev projects, resetting store', err);
    const seeded = ensureDefaultProjects(normalizeProjects(PROJECTS));
    window.localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

const writeDevProjects = (projects: Project[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(normalizeProjects(projects)));
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

  const [projects, setProjects] = useState<Project[]>(ensureDefaultProjects(normalizeProjects(PROJECTS)));
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Project>>({});
  const [activeGalleryTab, setActiveGalleryTab] = useState<Record<string, GalleryKey>>({});
  const [uploadTarget, setUploadTarget] = useState<{ projectId: string; gallery: GalleryKey } | null>(null);
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ projectId: string; url: string } | null>(null);
  const [projectConfirm, setProjectConfirm] = useState<string | null>(null);
  const [bulkRestoreConfirm, setBulkRestoreConfirm] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{ context: string; detail: string; time: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState<NewProjectDraft>(createNewProjectDraft(PROJECTS.length + 1));
  const [showArchived, setShowArchived] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const devBypass = !isFirebaseConfigured || import.meta.env.VITE_DEV_ADMIN_BYPASS === 'true';

  const archiveCount = useMemo(() => projects.filter((p) => p.archived).length, [projects]);
  const visibleProjects = useMemo(() => projects.filter((p) => (showArchived ? p.archived : !p.archived)), [projects, showArchived]);

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
      if (snap.empty) {
        const empty = ensureDefaultProjects(normalizeProjects(PROJECTS));
        setProjects(empty);
        setExistingIds(empty.filter((p) => !p.archived).map((p) => p.id));
        setLoadingProjects(false);
        writeDevProjects(empty);
        return;
      }

      const baseMap = new Map<string, Project>(PROJECTS.map((p) => [p.id, normalizeProject(p)]));
      const additions: Project[] = [];
      const ids: string[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const archived = Boolean(data.isDeleted);
        if (!archived) ids.push(docSnap.id);
        const base = baseMap.get(docSnap.id);
        const finished = Array.isArray(data.galleries?.finished) ? data.galleries.finished : base?.galleries.finished ?? [];
        const development = Array.isArray(data.galleries?.development) ? data.galleries.development : base?.galleries.development ?? [];

        const coverImage = typeof data.imageUrl === 'string' && data.imageUrl.trim().length > 0
          ? data.imageUrl
          : base?.imageUrl ?? finished[0] ?? development[0] ?? FALLBACK_IMAGE;

        const merged: Project = {
          id: docSnap.id,
          title: data.title ?? base?.title ?? 'Untitled Project',
          location: data.location ?? base?.location ?? 'Location coming soon',
          category: data.category ?? base?.category ?? 'Projects',
          type: data.type ?? base?.type ?? 'ARCHITECTURE',
          subCategory: data.subCategory ?? base?.subCategory ?? 'RESIDENTIAL',
          imageUrl: coverImage,
          galleries: {
            finished,
            development,
          },
          published: archived ? false : (data.published ?? base?.published ?? false),
          description: data.description ?? base?.description,
          displayOrder: data.displayOrder ?? base?.displayOrder,
          createdAt: data.createdAt ?? base?.createdAt,
          updatedAt: data.updatedAt ?? base?.updatedAt,
          archived,
        };

        if (base) {
          baseMap.set(docSnap.id, merged);
        } else {
          additions.push(merged);
        }
      });

      const mergedProjects = normalizeProjects([...baseMap.values(), ...additions]);
      setProjects(mergedProjects);
      setExistingIds([...new Set([...ids, ...mergedProjects.filter((p) => p.archived).map((p) => p.id)])]);
      setLoadingProjects(false);
      writeDevProjects(mergedProjects);
    }, (error) => {
      reportError('Firestore listener failed', error, 'Live sync unavailable, using defaults');
      const fallback = ensureDefaultProjects(normalizeProjects(PROJECTS));
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
      updateDraft(projectId, (draft) => {
        (draft as any)[field] = value;
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
    const galleries = {
      finished: [...draft.galleries.finished],
      development: [...draft.galleries.development],
    };
    const cover = draft.imageUrl || galleries.finished[0] || galleries.development[0] || '';

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

  const addImageToGallery = useCallback(async (projectId: string, gallery: GalleryKey, url: string): Promise<boolean> => {
    if (!url) return false;
    if (allImages.has(url)) {
      flash('err', 'Image already used elsewhere');
      return false;
    }

    const project = drafts[projectId] ?? projects.find((p) => p.id === projectId);
    if (!project) return false;

    const nextGalleries: Project['galleries'] = {
      finished: [...project.galleries.finished],
      development: [...project.galleries.development],
    };

    if (nextGalleries[gallery].includes(url)) {
      flash('err', 'Image already in this gallery');
      return false;
    }

    nextGalleries[gallery].push(url);
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
      reportError('Failed to add image', err, 'Could not add image');
      return false;
    }
  }, [allImages, applyDevProjects, devBypass, drafts, flash, projects, reportError, updateDraft]);

  const handleAddImageUrl = useCallback(async (projectId: string) => {
    const gallery = getActiveGallery(projectId);
    const url = (urlDrafts[projectId] ?? '').trim();
    if (!url) return;

    const success = await addImageToGallery(projectId, gallery, url);
    if (success) {
      setUrlDrafts((prev) => ({ ...prev, [projectId]: '' }));
      flash('ok', 'Image added');
    }
  }, [addImageToGallery, flash, getActiveGallery, urlDrafts]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !uploadTarget) return;
    debugInfo('Upload start', `${files.length} file(s) to ${uploadTarget.projectId}/${uploadTarget.gallery}`);
    setUploading(true);
    let added = 0;

    if (devBypass) {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        try {
          const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          const success = await addImageToGallery(uploadTarget.projectId, uploadTarget.gallery, dataUrl);
          if (success) added++;
        } catch (err) {
          reportError('Dev upload failed', err);
        }
      }

      setUploading(false);
      setUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (added > 0) {
        flash('ok', `${added} image${added === 1 ? '' : 's'} uploaded`);
      }
      return;
    }

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageRef = ref(storage, `projects/${uploadTarget.projectId}/${uploadTarget.gallery}/${timestamp}_${safeName}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        const success = await addImageToGallery(uploadTarget.projectId, uploadTarget.gallery, downloadUrl);
        if (success) added++;
      } catch (err) {
        reportError('Upload failed', err);
      }
    }

    setUploading(false);
    setUploadTarget(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (added > 0) {
      flash('ok', `${added} image${added === 1 ? '' : 's'} uploaded`);
    }
  }, [addImageToGallery, debugInfo, devBypass, flash, reportError, uploadTarget]);

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

    if (!devBypass && url.includes('firebasestorage.googleapis.com')) {
      try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
      } catch (err) {
        console.warn('[Admin] Storage delete failed', err);
      }
    }

    const cover = project.imageUrl === url
      ? nextGalleries.finished[0] ?? nextGalleries.development[0] ?? ''
      : project.imageUrl;

    updateDraft(projectId, (draft) => {
      draft.galleries = nextGalleries;
      draft.imageUrl = cover;
    });

    if (devBypass) {
      applyDevProjects((prev) => prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          galleries: nextGalleries,
          imageUrl: cover,
          updatedAt: Date.now(),
        };
      }));
      flash('ok', 'Image removed');
      setDeleteConfirm(null);
      return;
    }

    try {
      await setDoc(doc(db, FIRESTORE_COLLECTION, projectId), {
        galleries: nextGalleries,
        imageUrl: cover,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      flash('ok', 'Image removed');
    } catch (err) {
      reportError('Failed to remove image', err, 'Could not remove image');
    }

    setDeleteConfirm(null);
  }, [applyDevProjects, devBypass, drafts, flash, projects, reportError, updateDraft]);

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
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      reportError('Login failed', err);
      setLoginError(err.message || 'Login failed');
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
      <div className="relative w-full min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #ffffff 0, transparent 25%), radial-gradient(circle at 80% 10%, #ffffff 0, transparent 20%), radial-gradient(circle at 40% 80%, #ffffff 0, transparent 20%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs uppercase tracking-[0.25em]">
              <span>{devBypass ? 'Local demo (no Firebase)' : 'Live Firebase'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif-display leading-tight">Admin Console</h1>
            <p className="text-sm md:text-base text-white/70 max-w-xl">Manage projects, galleries, and visibility. Use your authorized email to sign in.</p>
            <div className="hidden lg:block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-sm text-white/80">
              <div className="flex items-center gap-2 text-white"><LogIn size={16} /> Tips</div>
              <ul className="mt-2 space-y-1 list-disc list-inside text-white/70">
                <li>Use your Firebase auth email and password.</li>
                <li>Publish toggles control what appears on the live site.</li>
                <li>Archived projects stay hidden until restored.</li>
              </ul>
            </div>
          </div>

          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-8 space-y-6 border border-gray-100">
            <div className="space-y-2 text-center">
              <LogIn size={32} className="mx-auto text-gray-400" />
              <h2 className="text-2xl font-semibold">Sign in</h2>
              <p className="text-sm text-gray-500">Enter your admin credentials</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
                />
              </div>
              {loginError && <p className="text-sm text-red-600">{loginError}</p>}
              <button
                type="submit"
                className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium hover:opacity-90"
              >
                Sign In
              </button>
            </form>
            <div className="text-xs text-gray-500 text-center">
              Need access? Ask an admin to add your email in Firebase Auth.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 pt-28 pb-20 px-4 md:px-8 lg:px-16">
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold">Delete this image?</h3>
            <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
              <img src={deleteConfirm.url} alt="" className="w-full h-full object-cover" />
            </div>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveImage(deleteConfirm.projectId, deleteConfirm.url)}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {projectConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold">Archive this project?</h3>
            <p className="text-sm text-gray-500">
              The project will disappear from the live site. Switch to the archived view to bring it back later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setProjectConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkRestoreConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold">Restore all archived projects?</h3>
            <p className="text-sm text-gray-500">
              Every archived project will be restored and moved back to the active list.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkRestoreConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreAllArchived}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
              >
                Restore all
              </button>
            </div>
          </div>
        </div>
      )}

      {newProjectOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleCreateProject} className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create New Project</h2>
              <button type="button" onClick={() => setNewProjectOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Project Title</label>
              <input
                value={newProject.title}
                onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
              />
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Location</label>
              <input
                value={newProject.location}
                onChange={(e) => setNewProject((prev) => ({ ...prev, location: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
              />
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Category Label</label>
              <input
                value={newProject.category}
                onChange={(e) => setNewProject((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Type</label>
                <select
                  value={newProject.type}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, type: e.target.value as Project['type'] }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Subcategory</label>
                <select
                  value={newProject.subCategory}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, subCategory: e.target.value as Project['subCategory'] }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
                >
                  {SUBCATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Display Order</label>
              <input
                type="number"
                value={newProject.displayOrder ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const parsed = value === '' ? null : Number(value);
                  setNewProject((prev) => ({
                    ...prev,
                    displayOrder: parsed === null || Number.isNaN(parsed) ? null : parsed,
                  }));
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
              />
              <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                <input
                  type="checkbox"
                  checked={newProject.published}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, published: e.target.checked }))}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                Publish immediately
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Optional description"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNewProjectOpen(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-medium hover:opacity-90"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm font-medium">Uploading...</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFileUpload(e.target.files);
          if (e.target) e.target.value = '';
        }}
      />

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-2xl border border-gray-200 bg-white/90 shadow-sm px-4 py-3 sticky top-0 z-30 backdrop-blur">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-serif-display">Manage Projects</h1>
            <p className="text-sm text-gray-500">Add new work, curate galleries, and control what is live.</p>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-400">{loadingProjects ? 'Syncing…' : 'Up to date'}</span>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${devBypass ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}>
                {devBypass ? 'Local demo (no Firebase)' : 'Live Firebase'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setExpandedId(null);
                setShowArchived((prev) => !prev);
              }}
              disabled={!showArchived && archiveCount === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border ${
                showArchived
                  ? 'border-black bg-black text-white hover:opacity-90'
                  : archiveCount === 0
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {showArchived ? 'Show active' : `Archived (${archiveCount})`}
            </button>
            {showArchived && archiveCount > 0 && (
              <button
                onClick={() => setBulkRestoreConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Restore all archived
              </button>
            )}
            <button
              onClick={openNewProjectModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-medium rounded-xl hover:opacity-90"
            >
              <Plus size={14} />
              New Project
            </button>
            <span className="text-xs text-gray-400 truncate max-w-[160px]">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>

        {diagnostics && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-700">Debug</div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{diagnostics.context}</p>
                <p className="text-xs text-amber-700/80">{new Date(diagnostics.time).toLocaleTimeString()} — {diagnostics.detail}</p>
                <p className="text-[11px] text-amber-700/70">See browser console for stack traces and more detail.</p>
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

        {visibleProjects.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center space-y-2">
            <p className="text-sm text-gray-500">
              {showArchived ? 'No archived projects at the moment.' : 'No projects yet. Create one to get started.'}
            </p>
            {!showArchived && (
              <button
                onClick={openNewProjectModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-medium rounded-xl hover:opacity-90"
              >
                <Plus size={14} />
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleProjects.map((project) => {
              const isOpen = expandedId === project.id;
              const draft = drafts[project.id] ?? project;
              const activeTab = getActiveGallery(project.id);
              const galleryImages = draft.galleries[activeTab];
              const finishedCount = draft.galleries.finished.length;
              const developmentCount = draft.galleries.development.length;
              const metadataDirty = hasMetadataChanges(project.id);
              const isArchived = project.archived ?? false;
              const statusLabel = isArchived ? 'Archived' : draft.published ? 'Published' : 'Hidden';
              const statusClass = isArchived
                ? 'bg-red-100 text-red-600'
                : draft.published
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500';

              return (
                <div key={project.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => {
                      const next = isOpen ? null : project.id;
                      setExpandedId(next);
                      if (!isOpen) {
                        updateDraft(project.id, (d) => d);
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    <img src={draft.imageUrl || FALLBACK_IMAGE} alt="" className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400">{draft.type} — {draft.subCategory}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-semibold truncate">{draft.location}</h3>
                      <p className="text-xs text-gray-400">{finishedCount + developmentCount} total images</p>
                    </div>
                    {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 p-4 md:p-6 space-y-6 animate-fade-in">
                      {isArchived && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                          This project is archived. Restore it before publishing or showing it on the site.
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Project Title</label>
                          <input
                            value={draft.title}
                            onChange={(e) => updateDraftField(project.id, 'title', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
                          />
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Location</label>
                          <input
                            value={draft.location}
                            onChange={(e) => updateDraftField(project.id, 'location', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
                          />
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Category Label</label>
                          <input
                            value={draft.category}
                            onChange={(e) => updateDraftField(project.id, 'category', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Type</label>
                          <select
                            value={draft.type}
                            onChange={(e) => updateDraftField(project.id, 'type', e.target.value as Project['type'])}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
                          >
                            {TYPE_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Subcategory</label>
                          <select
                            value={draft.subCategory}
                            onChange={(e) => updateDraftField(project.id, 'subCategory', e.target.value as Project['subCategory'])}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
                          >
                            {SUBCATEGORY_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Display Order</label>
                          <input
                            type="number"
                            value={draft.displayOrder ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              const parsed = value === '' ? null : Number(value);
                              updateDraftField(project.id, 'displayOrder', parsed === null || Number.isNaN(parsed) ? null : parsed);
                            }}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
                          />
                          <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            <input
                              type="checkbox"
                              checked={draft.published}
                              onChange={(e) => updateDraftField(project.id, 'published', e.target.checked)}
                              className="rounded border-gray-300 text-black focus:ring-black"
                            />
                            Visible on site
                          </label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Project Notes</label>
                        <textarea
                          value={draft.description ?? ''}
                          onChange={(e) => updateDraftField(project.id, 'description', e.target.value)}
                          rows={4}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 resize-none"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={!metadataDirty}
                          onClick={() => handleSaveProject(project.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-medium ${metadataDirty ? 'bg-black text-white hover:opacity-90' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                        >
                          Save details
                        </button>
                        <button
                          disabled={!metadataDirty}
                          onClick={() => handleDiscardProject(project.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-medium border ${metadataDirty ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
                        >
                          Discard changes
                        </button>
                        {isArchived ? (
                          <button
                            onClick={() => handleRestoreProject(project.id)}
                            className="ml-auto px-4 py-2 rounded-xl text-xs font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            Restore project
                          </button>
                        ) : (
                          <button
                            onClick={() => setProjectConfirm(project.id)}
                            className="ml-auto px-4 py-2 rounded-xl text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Archive project
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {GALLERY_TABS.map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveGalleryTab((prev) => ({ ...prev, [project.id]: tab }))}
                              className={`px-3 py-1.5 text-xs font-medium rounded-xl border ${activeTab === tab ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              {tab === 'finished' ? `Finished (${finishedCount})` : `Development (${developmentCount})`}
                            </button>
                          ))}
                          <span className="ml-auto text-xs uppercase tracking-[0.3em] text-gray-400">
                            {activeTab === 'finished' ? 'Client-ready visuals' : 'On-site progress'}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              setUploadTarget({ projectId: project.id, gallery: activeTab });
                              fileInputRef.current?.click();
                            }}
                            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-black hover:text-black transition-colors active:bg-gray-50"
                          >
                            <Upload size={20} />
                            <span>Upload to {activeTab === 'finished' ? 'Finished' : 'Development'} gallery</span>
                          </button>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={urlDrafts[project.id] ?? ''}
                              onChange={(e) => setUrlDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))}
                              placeholder="Or paste image URL"
                              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/40"
                            />
                            <button
                              onClick={() => handleAddImageUrl(project.id)}
                              className="px-4 py-3 bg-black text-white rounded-xl text-sm flex items-center gap-1 hover:opacity-90 active:opacity-70"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleResetCover(project.id)}
                            className="px-3 py-2 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100"
                          >
                            Reset cover
                          </button>

                          <div className="space-y-2 w-full">
                            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-500">Suggested covers</p>
                            <div className="grid grid-cols-3 gap-2">
                              {suggestCovers(project.id).map((coverUrl, idx) => {
                                const isCurrent = draft.imageUrl === coverUrl;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleSetCover(project.id, coverUrl)}
                                    className={`relative rounded-lg overflow-hidden border ${isCurrent ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-black'}`}
                                    type="button"
                                  >
                                    <img src={coverUrl} alt="Suggested cover" className="w-full h-20 object-cover" />
                                    {isCurrent && (
                                      <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">Active</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-500">
                          {activeTab === 'finished' ? 'Finished Gallery' : 'Development Gallery'} ({galleryImages.length})
                        </p>
                        {galleryImages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                            <Image size={32} />
                            <p className="text-sm mt-2">No images yet</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {galleryImages.map((url, idx) => (
                              <div key={idx} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                  <button
                                    onClick={() => handleSetCover(project.id, url)}
                                    className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                    title="Set as cover"
                                  >
                                    <Star size={14} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ projectId: project.id, url })}
                                    className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <button
                                  onClick={() => setDeleteConfirm({ projectId: project.id, url })}
                                  className="md:hidden absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
                                >
                                  <X size={12} />
                                </button>
                                {draft.imageUrl === url && (
                                  <div className="absolute top-1 left-1 bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded">
                                    COVER
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
