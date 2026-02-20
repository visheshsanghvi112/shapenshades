import React, { useState, useEffect, useMemo } from 'react';
import { PROJECTS } from '../constants';
import { Project, ViewProps } from '../types';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import { db, isFirebaseConfigured } from '../src/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// Two-tier filter categories
const TYPE_FILTERS = ['ALL', 'ARCHITECTURE', 'INTERIOR DESIGN', 'LANDSCAPE'] as const;

const SUBCATEGORY_CARDS: { key: 'RESIDENTIAL' | 'COMMERCIAL' | 'HOSPITALITY'; label: string; image: string; blurb: string }[] = [
  {
    key: 'RESIDENTIAL',
    label: 'Residential',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80&auto=format&fit=crop',
    blurb: 'Warm, livable interiors tailored to daily rituals.'
  },
  {
    key: 'COMMERCIAL',
    label: 'Commercial',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1600&q=80&auto=format&fit=crop',
    blurb: 'Workspaces that blend productivity with brand expression.'
  },
  {
    key: 'HOSPITALITY',
    label: 'Hospitality',
    image: 'https://images.unsplash.com/photo-1501117716987-c8e1ecb210af?w=1600&q=80&auto=format&fit=crop',
    blurb: 'Experiential environments crafted for comfort and delight.'
  }
];

const HEADER_QUOTES = [
  { text: "Committed to delivering", highlight: "'bespoke and contemporary'", suffix: "projects of the highest standard." },
  { text: "Where", highlight: "'form meets function'", suffix: "in every space we create." },
  { text: "Designing spaces that", highlight: "'inspire and endure'", suffix: "for generations to come." },
  { text: "Crafting environments with", highlight: "'precision and soul'", suffix: "at every scale." },
  { text: "Transforming visions into", highlight: "'timeless realities'", suffix: "one detail at a time." },
  { text: "Architecture rooted in", highlight: "'purpose and elegance'", suffix: "that speaks for itself." },
  { text: "Every project is a", highlight: "'dialogue between light and space'", suffix: "shaped with intent." },
  { text: "We believe in", highlight: "'thoughtful design'", suffix: "that balances beauty with practicality." },
  { text: "Shaping the future through", highlight: "'innovative design thinking'", suffix: "and meticulous execution." },
  { text: "Building legacies with", highlight: "'creative integrity'", suffix: "and lasting impact." },
];

// Fallback image in case Unsplash links expire or fail
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000';
export const DEV_STORAGE_KEY = 'shape_n_shades_dev_projects_v5';
const DEV_STORAGE_PREFIX = 'shape_n_shades_dev_projects_';

const sortProjects = (entries: Project[]): Project[] => {
  return [...entries].sort((a, b) => {
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
  return entries.map(normalizeProject);
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
    console.log(`[Projects] Purged stale cache key: ${k}`);
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
    console.warn('[Projects] Failed to parse local dev projects, resetting store', err);
    return seedFreshProjects();
  }
};

const Projects: React.FC<ViewProps> = ({ setIsDarkMode }) => {
  const [activeType, setActiveType] = useState<string>('ALL');
  const [activeSub, setActiveSub] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteFading, setQuoteFading] = useState(false);
  const [detailTab, setDetailTab] = useState<'finished' | 'development'>('finished');
  const [projects, setProjects] = useState<Project[]>(sortProjects(normalizeProjects(PROJECTS)));
  const devBypass = !isFirebaseConfigured || import.meta.env.VITE_DEV_ADMIN_BYPASS === 'true';

  // --- AUTO-FIX FOR MATUNGA (ID 5) & DELHI/RATNAGIRI (IDs 10 & 11) ---
  useEffect(() => {
    if (projects.length === 0) return;

    const autoHeal = async () => {
      const healQueue = [];

      const matunga = projects.find(p => p.id === '5');
      const canonical5 = PROJECTS.find(p => p.id === '5');
      if (matunga && canonical5 && matunga.galleries.finished.length < 5 && canonical5.galleries.finished.length > 10) {
        healQueue.push('5');
      }

      // Check if Delhi/Ratnagiri are corrupted (e.g. have wrong folder names in their gallery paths)
      const project10 = projects.find(p => p.id === '10');
      const canonical10 = PROJECTS.find(p => p.id === '10');
      // If project 10 doesn't have the correct first canonical image, it's corrupted
      if (project10 && canonical10 && project10.galleries.finished[0] !== canonical10.galleries.finished[0]) {
        healQueue.push('10');
      }

      const project11 = projects.find(p => p.id === '11');
      const canonical11 = PROJECTS.find(p => p.id === '11');
      if (project11 && canonical11 && project11.galleries.finished[0] !== canonical11.galleries.finished[0]) {
        healQueue.push('11');
      }

      if (healQueue.length > 0) {
        console.warn(`[AutoHeal] Projects ${healQueue.join(', ')} seem broken in DB. Restoring canonical images...`);
        if (!devBypass && isFirebaseConfigured) {
          try {
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../src/firebase');

            for (const id of healQueue) {
              const canonical = PROJECTS.find(p => p.id === id);
              if (canonical) {
                await setDoc(doc(db, 'projects', id), {
                  galleries: canonical.galleries,
                  imageUrl: canonical.imageUrl,
                  title: canonical.title, // Also force restore title to ensure consistency
                  location: canonical.location,
                  updatedAt: serverTimestamp(),
                  isDeleted: false
                }, { merge: true });
              }
            }
            console.log(`[AutoHeal] Restored ${healQueue.join(', ')} successfully.`);
          } catch (err) {
            console.error('[AutoHeal] Failed execution:', err);
          }
        }
      }
    };
    autoHeal();
  }, [projects, devBypass]);

  // Firestore listener merges cloud projects with defaults
  useEffect(() => {
    if (devBypass) {
      const applyLocal = () => {
        const localProjects = readDevProjects();
        setProjects(sortProjects(localProjects.filter((project) => !project.archived)));
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

    const colRef = collection(db, 'projects');
    const projectQuery = query(colRef, orderBy('displayOrder', 'asc'));

    const unsub = onSnapshot(projectQuery, (snap) => {
      const canonicalIds = new Set(PROJECTS.map((p) => p.id));
      const baseMap = new Map(PROJECTS.map((p) => [p.id, normalizeProject(p)]));

      if (!snap.empty) {
        snap.forEach((docSnap) => {
          const data = docSnap.data();

          // Skip any document explicitly marked as deleted — this blocks old ghost projects (Pune/Delhi etc.)
          if (data.isDeleted) {
            if (canonicalIds.has(docSnap.id)) {
              // If it's a canonical project, we don't delete it from the map.
              // We just ensure it's "un-archived" so the code version shows.
              const base = baseMap.get(docSnap.id);
              if (base) baseMap.set(docSnap.id, { ...base, archived: false, published: true });
            } else {
              baseMap.delete(docSnap.id);
            }
            return;
          }

          // If this project is NOT in constants.ts, it was created from the Admin panel.
          // Build it purely from Firestore data and add it to the map.
          if (!canonicalIds.has(docSnap.id)) {
            const finished = Array.isArray(data.galleries?.finished) ? data.galleries.finished : [];
            const development = Array.isArray(data.galleries?.development) ? data.galleries.development : [];
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

          // For canonical projects, we now allow Firestore to override galleries/imageUrl
          // so changes via Admin panel are reflected.
          const base = baseMap.get(docSnap.id);
          const finished = Array.isArray(data.galleries?.finished) ? data.galleries.finished : (base?.galleries.finished ?? []);
          const development = Array.isArray(data.galleries?.development) ? data.galleries.development : (base?.galleries.development ?? []);

          baseMap.set(docSnap.id, {
            id: docSnap.id,
            title: data.title ?? base?.title ?? 'Untitled Project',
            location: data.location ?? base?.location ?? 'Mumbai',
            category: data.category ?? base?.category ?? 'Projects',
            type: data.type ?? base?.type ?? 'ARCHITECTURE',
            subCategory: data.subCategory ?? base?.subCategory ?? 'RESIDENTIAL',
            imageUrl: data.imageUrl ?? base?.imageUrl ?? (finished[0] || ''),
            galleries: { finished, development },
            published: data.published ?? base?.published ?? false,
            description: data.description ?? base?.description,
            displayOrder: data.displayOrder ?? base?.displayOrder,
            createdAt: data.createdAt ?? base?.createdAt,
            updatedAt: data.updatedAt ?? base?.updatedAt,
          });
        });
      }

      const mergedProjects = sortProjects([...baseMap.values()]);
      setProjects(mergedProjects.filter((p) => !p.archived));
    });

    return unsub;
  }, [devBypass]);

  // Rotate quotes every 5 seconds with fade
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFading(true);
      setTimeout(() => {
        setQuoteIndex(prev => (prev + 1) % HEADER_QUOTES.length);
        setQuoteFading(false);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Browser History & Back Button Logic
  useEffect(() => {
    // 1. Handle Browser Back Button (PopState)
    const handlePopState = (event: PopStateEvent) => {
      // If user hits Back and we are in a project, close it
      if (selectedProject) {
        setSelectedProject(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProject]);

  // When selectedProject changes, update state and URL
  useEffect(() => {
    if (selectedProject) {
      console.log(`[Projects] Opening detail view for: ${selectedProject.title}`);
      setIsDarkMode(true);
      setDetailTab('finished');
      window.scrollTo(0, 0);

      // Push history state so Mobile Back Button works
      // Only push if we aren't already there (to avoid loops)
      const currentUrl = new URL(window.location.href);
      if (!currentUrl.searchParams.has('project')) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('project', selectedProject.id);
        window.history.pushState({ projectId: selectedProject.id }, '', newUrl.toString());
      }
    } else {
      console.log('[Projects] Returning to grid view');
      setIsDarkMode(false);

      // If we closed the project manually (by button), clear the URL history gently
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('project')) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('project');
        // Replace state so we don't accumulate junk history
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
    // Cleanup on unmount or change
    return () => setIsDarkMode(false);
  }, [selectedProject, setIsDarkMode]);

  // Refresh selected project when overrides change; close detail if archived
  const selectedProjectRef = React.useRef(selectedProject);
  selectedProjectRef.current = selectedProject;

  useEffect(() => {
    const current = selectedProjectRef.current;
    if (!current) return;
    const updated = projects.find((p) => p.id === current.id);
    if (updated && !updated.archived) {
      setSelectedProject(updated);
    } else if (!updated || updated.archived) {
      setSelectedProject(null);
    }
  }, [projects]); // ← only re-run when the projects list changes, NOT when selectedProject changes

  // Debugging logs for filters
  useEffect(() => {
    console.log(`[Projects] Active Type: ${activeType}, Active Sub: ${activeSub}`);
  }, [activeType, activeSub]);

  // Intersection Observer for Scroll Animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Animate in: Remove hidden state, add visible state
          entry.target.classList.remove('opacity-0', 'translate-y-16');
          entry.target.classList.add('opacity-100', 'translate-y-0');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll('.project-card');
    console.log(`[Projects] Observing ${cards.length} cards for animation.`);
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [activeType, activeSub, selectedProject]); // Re-run whenever the DOM list changes (filter or view change)

  const publishedProjects = useMemo(() => projects.filter((p) => p.published && !p.archived), [projects]);

  const filteredProjects = publishedProjects.filter(p => {
    const typeMatch = activeType === 'ALL' || p.type === activeType;
    const subMatch = activeSub === 'ALL' || p.subCategory === activeSub;
    return typeMatch && subMatch;
  });

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`[Projects] Image load failed: ${e.currentTarget.src}`);
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  // --- DETAIL VIEW ---
  if (selectedProject) {
    return (
      <>
        {/* Back to Projects - Robust Floating Sticky Pivot (Outside animated container) - DESKTOP ONLY */}
        <div className="hidden md:block fixed inset-0 pointer-events-none z-[999]">
          <div className="absolute top-32 left-6 md:left-12 lg:left-24 pointer-events-auto">
            <button
              onClick={() => setSelectedProject(null)}
              className="group flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase text-white bg-black/40 backdrop-blur-md hover:bg-black/70 transition-all duration-300 px-6 py-3 rounded-full border border-white/20 hover:border-white/50 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>
          </div>
        </div>

        <div className="w-full min-h-screen bg-white animate-fade-in relative z-10">
          {/* Project Hero Section - Dark Background */}
          <div className="w-full h-screen bg-black flex flex-col justify-center items-center text-white relative px-6">

            {/* Back Button - MOBILE ONLY (Scrolling) */}
            <div className="absolute top-40 left-6 block md:hidden z-50">
              <button
                onClick={() => setSelectedProject(null)}
                className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/80 hover:text-white border border-white/20 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            </div>

            <div className="text-center space-y-6 animate-fade-in-up">
              <h1 className="text-5xl md:text-7xl lg:text-9xl font-sans font-bold tracking-tight">
                {selectedProject.title}
              </h1>
              <p className="text-lg md:text-2xl font-light tracking-widest uppercase opacity-80">
                {selectedProject.location}
              </p>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 animate-bounce opacity-50">
              <div className="w-0.5 h-12 bg-white mx-auto"></div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="w-full bg-white py-24 px-6 md:px-12 lg:px-24">
            <div className="max-w-7xl mx-auto space-y-12 md:space-y-24">
              {/* Project Brief */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                <div className="md:col-span-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Project Brief</h3>
                  <p className="text-2xl font-serif-display text-black">A thoughtful exploration of space and light.</p>
                </div>
                <div className="md:col-span-8">
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {selectedProject.description ?? 'This project represents a dialogue between modern aesthetics and functional living. Every corner is designed to maximize natural light and air flow, creating a sanctuary within the urban environment.'}
                  </p>
                </div>
              </div>

              {/* Gallery Tabs Selector - Only show if both galleries have content */}
              {selectedProject.galleries.finished.length > 0 && selectedProject.galleries.development.length > 0 && (
                <div className="flex justify-center border-b border-gray-100 mb-12 md:mb-24">
                  <button
                    onClick={() => {
                      setDetailTab('finished');
                      // Optional: scroll back to top of gallery section
                    }}
                    className={`pb-4 px-4 md:px-8 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase transition-all duration-300 relative ${detailTab === 'finished' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    Finished Spaces
                    {detailTab === 'finished' && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black animate-scale-x" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setDetailTab('development');
                    }}
                    className={`pb-4 px-4 md:px-8 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase transition-all duration-300 relative ${detailTab === 'development' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    On-Site Progress
                    {detailTab === 'development' && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black animate-scale-x" />
                    )}
                  </button>
                </div>
              )}

              {/* Gallery Content */}
              {(detailTab === 'finished' || selectedProject.galleries.development.length === 0) && selectedProject.galleries.finished.length > 0 && (
                <section className="space-y-6 md:space-y-12 animate-fade-in">
                  <header className="flex items-baseline justify-between">
                    <h4 className="text-lg md:text-2xl font-semibold tracking-wide uppercase text-gray-900">Finished Spaces</h4>
                    <span className="text-xs uppercase tracking-[0.3em] text-gray-400">{selectedProject.galleries.finished.length} IMAGES</span>
                  </header>
                  {selectedProject.galleries.finished.map((url, idx) => {
                    // 1. Google Drive Embed
                    if (url.includes('drive.google.com')) {
                      const embed = url.replace(/\/view.*/, '/preview');
                      return (
                        <div key={`finished-${idx}`} className="w-full aspect-video bg-gray-50 rounded-lg overflow-hidden relative">
                          <iframe src={embed} className="absolute inset-0 w-full h-full" allowFullScreen title="Project Video" />
                        </div>
                      );
                    }
                    // 2. YouTube Embed
                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                      const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/.*v=)([^&]+)/)?.[1];
                      if (videoId) {
                        return (
                          <div key={`finished-${idx}`} className="w-full aspect-video bg-gray-50 rounded-lg overflow-hidden relative">
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              className="absolute inset-0 w-full h-full"
                              allowFullScreen
                              title="Project Video"
                            />
                          </div>
                        );
                      }
                    }
                    // 3. Pexels / Direct Video
                    if (/\.(mp4|mov|webm|ogv)(\?.*)?$/i.test(url) || url.includes('pexels.com/video')) {
                      return (
                        <div key={`finished-${idx}`} className="w-full bg-black rounded-lg overflow-hidden"
                          ref={(el) => {
                            // Hide wrapper if video fails (e.g. local file not uploaded to server)
                          }}
                        >
                          <video
                            controls
                            className="w-full h-auto max-h-[90vh]"
                            preload="metadata"
                            onError={(e) => {
                              const wrapper = e.currentTarget.closest('div') as HTMLElement | null;
                              if (wrapper) wrapper.style.display = 'none';
                            }}
                          >
                            <source src={url} />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      );
                    }
                    // 4. Default Image
                    return (
                      <div key={`finished-${idx}`} className="w-full">
                        <img
                          src={url}
                          onError={handleImageError}
                          alt={`${selectedProject.title} finished ${idx + 1}`}
                          className="w-full h-auto object-cover max-h-[90vh]"
                        />
                      </div>
                    );
                  })}
                </section>
              )}

              {(detailTab === 'development' || selectedProject.galleries.finished.length === 0) && selectedProject.galleries.development.length > 0 && (
                <section className="space-y-6 md:space-y-12 animate-fade-in">
                  <header className="flex items-baseline justify-between">
                    <h4 className="text-lg md:text-2xl font-semibold tracking-wide uppercase text-gray-900">On-Site Progress</h4>
                    <span className="text-xs uppercase tracking-[0.3em] text-gray-400">{selectedProject.galleries.development.length} IMAGES</span>
                  </header>
                  {selectedProject.galleries.development.map((url, idx) => {
                    // 1. Google Drive Embed
                    if (url.includes('drive.google.com')) {
                      const embed = url.replace(/\/view.*/, '/preview');
                      return (
                        <div key={`development-${idx}`} className="w-full aspect-video bg-gray-50 rounded-lg overflow-hidden relative">
                          <iframe src={embed} className="absolute inset-0 w-full h-full" allowFullScreen title="Project Video" />
                        </div>
                      );
                    }
                    // 2. YouTube Embed
                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                      const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/.*v=)([^&]+)/)?.[1];
                      if (videoId) {
                        return (
                          <div key={`development-${idx}`} className="w-full aspect-video bg-gray-50 rounded-lg overflow-hidden relative">
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              className="absolute inset-0 w-full h-full"
                              allowFullScreen
                              title="Project Video"
                            />
                          </div>
                        );
                      }
                    }
                    // 3. Pexels / Direct Video
                    if (/\.(mp4|mov|webm|ogv)(\?.*)?$/i.test(url) || url.includes('pexels.com/video')) {
                      return (
                        <div key={`development-${idx}`} className="w-full bg-black rounded-lg overflow-hidden">
                          <video
                            controls
                            className="w-full h-auto max-h-[90vh]"
                            preload="metadata"
                            onError={(e) => {
                              const wrapper = e.currentTarget.closest('div') as HTMLElement | null;
                              if (wrapper) wrapper.style.display = 'none';
                            }}
                          >
                            <source src={url} />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      );
                    }
                    // 4. Default Image
                    return (
                      <div key={`development-${idx}`} className="w-full">
                        <img
                          src={url}
                          onError={handleImageError}
                          alt={`${selectedProject.title} progress ${idx + 1}`}
                          className="w-full h-auto object-cover max-h-[90vh]"
                        />
                      </div>
                    );
                  })}
                </section>
              )}
            </div>
          </div>

          {/* Back to Projects - Bottom */}
          <div className="w-full px-6 md:px-12 lg:px-24 py-20 flex justify-center">
            <button
              onClick={() => setSelectedProject(null)}
              className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase border border-black px-8 py-4 hover:bg-black hover:text-white transition-all duration-300"
            >
              <ArrowLeft size={16} />
              <span>Back to Projects</span>
            </button>
          </div>

        </div>
      </>
    );
  }

  // --- GRID VIEW ---
  return (
    <div className="w-full min-h-screen bg-white pt-40 pb-20">

      {/* Header Section */}
      <div className="px-6 md:px-12 lg:px-24 text-center mb-16 animate-fade-in">
        <h2 className={`text-2xl md:text-4xl lg:text-5xl font-serif-display text-gray-900 leading-tight mb-8 transition-opacity duration-500 ${quoteFading ? 'opacity-0' : 'opacity-100'}`}>
          {HEADER_QUOTES[quoteIndex].text} <span className="font-bold italic">{HEADER_QUOTES[quoteIndex].highlight}</span><br className="hidden md:block" /> {HEADER_QUOTES[quoteIndex].suffix}
        </h2>

        {/* Filters */}
        <div className="space-y-8 py-4 px-2">
          {/* Row 1: Type Filters */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex overflow-x-auto no-scrollbar justify-center items-center space-x-6 md:space-x-10">
              {TYPE_FILTERS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveType(cat);
                    if (cat !== 'INTERIOR DESIGN') setActiveSub('ALL');
                  }}
                  className={`text-xs md:text-sm tracking-widest uppercase whitespace-nowrap transition-all duration-300 py-2 ${activeType === cat
                    ? 'text-black font-bold border-b-2 border-black'
                    : 'text-gray-400 hover:text-black'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Interior Subcategories as cards */}
          {activeType === 'INTERIOR DESIGN' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
              {SUBCATEGORY_CARDS.map((card) => (
                <button
                  key={card.key}
                  onClick={() => setActiveSub(card.key)}
                  className={`group relative w-full overflow-hidden rounded-xl border ${activeSub === card.key ? 'border-black shadow-lg' : 'border-gray-200 shadow-sm'
                    } transition-all duration-500 text-left`}
                >
                  <div className="absolute inset-0">
                    <img
                      src={card.image}
                      alt={card.label}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE; // Use universal fallback
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  </div>
                  <div className="relative z-10 p-6 flex flex-col gap-2 text-white">
                    <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/70">Interior Design</span>
                    <h3 className="text-2xl font-serif-display leading-tight">{card.label}</h3>
                    <p className="text-sm text-white/80 leading-snug">{card.blurb}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2 lg:gap-4 px-0 md:px-4">
          {filteredProjects.map((project: Project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              // Animation logic: Start invisible and translated down
              className="project-card group relative w-full aspect-[3/4] overflow-hidden cursor-pointer bg-gray-100 opacity-0 translate-y-16 transition-all duration-700 ease-out"
            >
              <img
                src={project.imageUrl}
                onError={handleImageError}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
              />
              {/* Overlay: subtle bottom gradient always, darker on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent group-hover:from-black/70 transition-colors duration-500" />

              {/* Content Container */}
              <div className="absolute bottom-0 left-0 w-full p-8 text-white">
                {/* Location: primary display */}
                <h3 className="text-2xl font-bold uppercase tracking-wider mb-1 drop-shadow-lg">
                  {project.location}
                </h3>
                {/* Category tag */}
                <p className="text-[10px] font-light tracking-[0.2em] drop-shadow-md uppercase opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  {project.type} &mdash; {project.subCategory}
                </p>

                {/* Arrow fades in on hover */}
                <div className="flex justify-end opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 mt-2">
                  <ArrowUpRight className="text-white w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};


export default Projects;

// -- TEMP FIXER
// Uncomment to run locally once if needed, then re-comment.
// import { doc, setDoc } from 'firebase/firestore';
// export const MatungaFixer = () => {
//  useEffect(() => {
//    // ...
//  }, []);
//  return <button>Reset Matunga</button>;
// }