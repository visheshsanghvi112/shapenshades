export type ViewState = 'HOME' | 'PROJECTS' | 'ABOUT' | 'CONTACT';

export interface Project {
  id: string;
  title: string;
  location: string;
  category: string;
  imageUrl: string;
  gallery: string[];
}

export interface NavItem {
  label: string;
  view: ViewState;
}

export interface ViewProps {
  setIsDarkMode: (isDark: boolean) => void;
}