<div align="center">
  <img src="LOGO.png" alt="Shapes & Shades Logo" width="240" />
  <h1>Shapes & Shades</h1>
  <p><strong>Architecture & Interior Design Studio</strong></p>
  <p>
    <a href="https://shapesandshades.com">Website</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

---

## About

**Shapes & Shades** is a full-service architecture, interior design, and construction consulting firm founded on 9th September 2019 by Architects **Sohan Suthar** and **Sumit Kalle**. This repository contains the source code for the official portfolio website — a modern, minimalist showcase of the firm's work and design philosophy.

> *"We believe great design is not just seen — it is experienced."*

Website developed by **[Vishesh Sanghvi](https://github.com/visheshsanghvi)**

---

## Features

- **Immersive Home Page** — Full-screen video carousel with smooth transitions
- **Project Showcase** — Filterable, animated project gallery with detail views
- **About Section** — Firm history, philosophy, and core capabilities
- **Contact Page** — Clean contact form and studio information
- **Smart Header** — Auto-hides on scroll down, reappears on scroll up
- **Responsive Design** — Fully optimized for mobile, tablet, and desktop
- **Dark/Light Mode** — Dynamic header/footer color adaptation per section
- **SEO Optimized** — Open Graph, Twitter Cards, JSON-LD structured data, sitemap

---

## Tech Stack

| Technology | Purpose |
| --- | --- |
| [React 19](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Google Fonts](https://fonts.google.com/) | Cinzel, Manrope, Playfair Display |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/visheshsanghvi/shapesandshades.git
cd shapesandshades

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be running at **http://localhost:3000**

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
shapesandshades/
├── public/              # Static assets (favicon, robots.txt, sitemap)
│   ├── logo.png
│   ├── robots.txt
│   └── sitemap.xml
├── components/          # Reusable UI components
│   ├── Footer.tsx
│   └── Menu.tsx
├── views/               # Page-level view components
│   ├── Home.tsx
│   ├── About.tsx
│   ├── Projects.tsx
│   └── Contact.tsx
├── src/
│   └── index.css        # Tailwind CSS entry point
├── App.tsx              # Root application component
├── constants.ts         # Project data, content, and configuration
├── types.ts             # TypeScript type definitions
├── index.html           # HTML shell with SEO meta tags
├── index.tsx            # React entry point
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── LOGO.png             # Brand logo
└── package.json
```

---

## Services Showcased

- **Architecture** — End-to-end architectural design and planning
- **Interior Design** — Residential and commercial interior concepts
- **Construction Administration** — Execution support and on-site coordination
- **Consulting** — Design consulting and project advisory

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/visheshsanghvi">Vishesh Sanghvi</a> for <strong>Shapes & Shades</strong></sub>
</div>
