export type ViewState = 'HOME' | 'PROJECTS' | 'ABOUT' | 'CONTACT' | 'ADMIN';

export interface ProjectGalleries {
  finished: string[];
  development: string[];
}

export interface Project {
  id: string;
  title: string;
  location: string;
  category: string;
  type: 'ARCHITECTURE' | 'INTERIOR DESIGN' | 'LANDSCAPE';
  subCategory: 'RESIDENTIAL' | 'COMMERCIAL' | 'HOSPITALITY';
  imageUrl: string;
  galleries: ProjectGalleries;
  published: boolean;
  description?: string;
  displayOrder?: number | null;
  createdAt?: number;
  updatedAt?: number;
  archived?: boolean;
}

export interface NavItem {
  label: string;
  view: ViewState;
}

export interface ViewProps {
  setIsDarkMode: (isDark: boolean) => void;
}