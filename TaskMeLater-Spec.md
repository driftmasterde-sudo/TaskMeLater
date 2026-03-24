# TaskMeLater — Product Specification

> **Version:** 1.0
> **Author:** Firas Hattab
> **Date:** 2026-03-24
> **Status:** Specification — Ready for Implementation

---

## 1. Overview

**TaskMeLater** is a lightweight, card-based project planner designed for managing feature ideas, bugs, and change requests across multiple parallel projects. It is built for solo entrepreneurs and small teams who juggle several products simultaneously and need a single place to capture, prioritize, and track work without heavyweight project management tools.

### Core Principles

- **Simplicity first** — no unnecessary complexity, no deep nesting, no Gantt charts
- **Card-based UI** — every item is a visual card that can be scanned at a glance
- **Project isolation** — each project has its own space with dedicated pages
- **Implementation-ready prompts** — bug descriptions are written as copy-paste-ready prompts for AI coding tools (e.g. Claude Code)
- **Visual mockups** — feature cards can include .html mockup files that render inline

---

## 2. Information Architecture

```
TaskMeLater (App)
├── Sidebar / Project List
│   ├── Project A (e.g. "Oriido")
│   │   ├── Features
│   │   └── Errors & Changes
│   ├── Project B (e.g. "MoveMaster")
│   │   ├── Features
│   │   └── Errors & Changes
│   ├── Project C (e.g. "TaskMeLater")
│   │   ├── Features
│   │   └── Errors & Changes
│   └── Project D (e.g. "Sharaaty")
│       ├── Features
│       └── Errors & Changes
└── Settings / Cross-Project View (future)
```

---

## 3. Data Models

### 3.1 Project

| Field       | Type   | Description                          | Required |
|-------------|--------|--------------------------------------|----------|
| `id`        | UUID   | Unique identifier                    | Auto     |
| `name`      | String | Project name (e.g. "Oriido")         | Yes      |
| `color`     | String | Hex color for visual identification  | Yes      |
| `icon`      | String | Emoji or icon identifier             | Optional |
| `createdAt` | Date   | Timestamp of creation                | Auto     |
| `updatedAt` | Date   | Timestamp of last modification       | Auto     |

### 3.2 Feature Card

| Field         | Type     | Description                                                        | Required |
|---------------|----------|--------------------------------------------------------------------|----------|
| `id`          | UUID     | Unique identifier                                                  | Auto     |
| `projectId`   | UUID     | Reference to parent project                                        | Auto     |
| `title`       | String   | Name of the feature                                                | Yes      |
| `description` | Text     | Short description of what the feature does                         | Yes      |
| `priority`    | Enum     | `Critical` · `High` · `Medium` · `Low`                            | Yes      |
| `mockup`      | File     | An `.html` file that showcases a visual example of the feature     | Optional |
| `state`       | Enum     | `Proposed` · `Planned` · `Implementing` · `Integrated`            | Yes      |
| `createdAt`   | Date     | Timestamp of creation                                              | Auto     |
| `updatedAt`   | Date     | Timestamp of last modification                                     | Auto     |

**Default values:** `priority` = `Medium`, `state` = `Proposed`

### 3.3 Error/Change Card

| Field       | Type   | Description                                                                 | Required |
|-------------|--------|-----------------------------------------------------------------------------|----------|
| `id`        | UUID   | Unique identifier                                                           | Auto     |
| `projectId` | UUID   | Reference to parent project                                                 | Auto     |
| `page`      | String | Which page/screen is affected (user-defined select per project)             | Yes      |
| `prompt`    | Text   | Description of the error/change, written as a ready-to-use Claude Code prompt | Yes      |
| `priority`  | Enum   | `Critical` · `High` · `Medium` · `Low`                                     | Yes      |
| `state`     | Enum   | `Not Started` · `Implementing` · `Fixed`                                   | Yes      |
| `createdAt` | Date   | Timestamp of creation                                                       | Auto     |
| `updatedAt` | Date   | Timestamp of last modification                                              | Auto     |

**Default values:** `priority` = `Medium`, `state` = `Not Started`

---

## 4. Pages & Views

### 4.1 Sidebar

- Lists all projects vertically
- Each project shows its name, color dot, and icon
- Clicking a project expands it to reveal two sub-pages: **Features** and **Errors & Changes**
- A **"+ New Project"** button at the bottom of the sidebar
- Projects can be reordered via drag-and-drop

### 4.2 Features Page

- **Header:** Project name + "Features" label + card count + "Add Feature" button
- **Filter bar:** Filter by priority, filter by state, search by title/description
- **Sort options:** By priority (Critical first), by date (newest first), by state
- **Card grid layout:** Responsive grid of feature cards (2–3 columns on desktop, 1 on mobile)

**Each Feature Card displays:**

```
┌──────────────────────────────────────────┐
│  [Priority Badge]           [State Chip] │
│                                          │
│  Feature Title                           │
│  Short description text that can wrap    │
│  to two lines max with ellipsis...       │
│                                          │
│  [📎 Mockup attached]     [Created date] │
└──────────────────────────────────────────┘
```

- **Priority badge** is color-coded: Critical = red, High = orange, Medium = blue, Low = gray
- **State chip** is color-coded: Proposed = gray, Planned = blue, Implementing = yellow, Integrated = green
- Clicking the card opens a **detail modal/panel** (see §4.4)
- If a mockup is attached, show a small file indicator; clicking it opens the mockup in an iframe preview

### 4.3 Errors & Changes Page

- **Header:** Project name + "Errors & Changes" label + card count + "Add Error/Change" button
- **Filter bar:** Filter by page, filter by priority, filter by state, search by prompt text
- **Sort options:** By priority, by date, by state

**Each Error/Change Card displays:**

```
┌──────────────────────────────────────────┐
│  [Priority Badge]           [State Chip] │
│                                          │
│  Page: "Dashboard"                       │
│  Prompt text preview that can wrap       │
│  to two lines max with ellipsis...       │
│                                          │
│  [📋 Copy Prompt]         [Created date] │
└──────────────────────────────────────────┘
```

- **"Copy Prompt" button** copies the full prompt text to clipboard for pasting into Claude Code
- Clicking the card opens a detail modal/panel (see §4.4)

### 4.4 Detail Modal / Side Panel

When a card is clicked, a detail view opens (either as a modal overlay or a right-side panel). This shows all fields in editable form:

**For Feature Cards:**
- Title (text input)
- Description (textarea)
- Priority (dropdown select)
- State (dropdown select)
- Mockup (file upload with drag-and-drop, accepts `.html` only)
- Mockup preview (renders the uploaded .html in a sandboxed iframe)
- Created / Updated timestamps (read-only)
- Delete button (with confirmation)

**For Error/Change Cards:**
- Page (dropdown select — options are managed per project in settings)
- Prompt (textarea, monospace font for code-readability)
- Priority (dropdown select)
- State (dropdown select)
- "Copy Prompt" button (copies full prompt text)
- Created / Updated timestamps (read-only)
- Delete button (with confirmation)

---

## 5. User Interactions

### 5.1 Project Management

| Action             | Trigger                                        |
|--------------------|------------------------------------------------|
| Create project     | Click "+ New Project" in sidebar               |
| Rename project     | Double-click project name or via context menu   |
| Delete project     | Context menu → "Delete" (with confirmation)     |
| Reorder projects   | Drag-and-drop in sidebar                        |
| Set project color  | Color picker in project settings                |

### 5.2 Card Management

| Action          | Trigger                                            |
|-----------------|----------------------------------------------------|
| Create card     | Click "Add Feature" or "Add Error/Change" button   |
| Edit card       | Click card → edit in detail panel                   |
| Delete card     | Detail panel → Delete button (with confirmation)    |
| Change state    | Dropdown in detail panel or quick-change on card    |
| Change priority | Dropdown in detail panel                            |
| Copy prompt     | Click "Copy Prompt" on error/change card            |
| View mockup     | Click mockup indicator on feature card              |
| Upload mockup   | Drag-and-drop or file picker in detail panel        |

### 5.3 Filtering & Sorting

- Filters persist per page per session (not saved permanently)
- Multiple filters can be combined (e.g. Priority = Critical AND State = Proposed)
- Search is a live text filter across title/description/prompt fields

---

## 6. Technical Requirements

### 6.1 Tech Stack (Recommended)

- **Frontend:** React (single-page application)
- **Styling:** Tailwind CSS
- **State Management:** React Context or Zustand
- **Data Persistence:** localStorage or IndexedDB (offline-first, no backend needed for V1)
- **File Handling:** HTML mockup files stored as blobs in IndexedDB
- **Build Tool:** Vite

### 6.2 Data Persistence

For V1, all data is stored client-side:

- **IndexedDB** for structured data (projects, cards) and file blobs (mockups)
- **Export/Import:** JSON export of all data for backup/migration (excluding mockup files in initial version, including them as base64 in a later version)
- No user accounts, no authentication, no server needed

### 6.3 Mockup Rendering

- Uploaded `.html` files are rendered in a **sandboxed iframe** (`sandbox="allow-scripts allow-same-origin"`)
- Mockup preview should be resizable (small preview on card, full-size in detail panel)
- Only `.html` files are accepted for upload

### 6.4 Responsive Design

- Desktop: sidebar visible, 2–3 column card grid
- Tablet: collapsible sidebar, 2 column grid
- Mobile: hidden sidebar (hamburger menu), single column cards

---

## 7. UI/UX Guidelines

### 7.1 Design Language

- Clean, minimal design with generous whitespace
- Dark mode and light mode support
- Color-coded priority badges and state chips for quick scanning
- Subtle card shadows and hover effects
- Smooth transitions for opening/closing panels

### 7.2 Color Scheme

**Priority colors:**
| Priority | Badge Color |
|----------|-------------|
| Critical | `#EF4444` (red) |
| High     | `#F97316` (orange) |
| Medium   | `#3B82F6` (blue) |
| Low      | `#9CA3AF` (gray) |

**State colors (Features):**
| State         | Chip Color |
|---------------|------------|
| Proposed      | `#9CA3AF` (gray) |
| Planned       | `#3B82F6` (blue) |
| Implementing  | `#EAB308` (yellow) |
| Integrated    | `#22C55E` (green) |

**State colors (Errors & Changes):**
| State         | Chip Color |
|---------------|------------|
| Not Started   | `#9CA3AF` (gray) |
| Implementing  | `#EAB308` (yellow) |
| Fixed         | `#22C55E` (green) |

### 7.3 Typography

- Headings: Inter or system font, semibold
- Body: Inter or system font, regular
- Prompt text: monospace (JetBrains Mono or system monospace)

---

## 8. Example Data for Initial Setup

Pre-populate the app with these sample projects for demo purposes:

```json
[
  { "name": "Oriido", "color": "#3B82F6", "icon": "🧠" },
  { "name": "MoveMaster", "color": "#22C55E", "icon": "🚚" },
  { "name": "TaskMeLater", "color": "#8B5CF6", "icon": "📋" },
  { "name": "Sharaaty", "color": "#F97316", "icon": "🤝" }
]
```

---

## 9. Future Enhancements (Out of Scope for V1)

These are documented for reference but should NOT be implemented in V1:

1. **Cross-project dashboard** — view all Critical items across every project on one screen
2. **Notes/Comments** — a threaded comment field on each card for tracking progress
3. **Tags/Labels** — custom tags for categorizing cards beyond priority and state
4. **Due dates** — optional deadline field with overdue highlighting
5. **Backend sync** — cloud storage with user accounts for multi-device access
6. **Drag-and-drop Kanban** — option to view cards as Kanban columns grouped by state
7. **Notifications/Reminders** — alerts for stale items or approaching deadlines
8. **Mockup versioning** — keep multiple mockup versions per feature card
9. **Export to CSV/PDF** — export project data for reporting
10. **API integration** — connect with GitHub Issues, Linear, or other tools

---

## 10. Implementation Notes for Claude Code

When implementing this spec, follow these guidelines:

1. **Start with data layer** — define TypeScript interfaces for Project, FeatureCard, and ErrorCard matching the data models in §3
2. **IndexedDB wrapper** — create a clean data access layer using `idb` library for IndexedDB operations
3. **Component hierarchy:**
   - `App` → `Sidebar` + `MainContent`
   - `MainContent` → `FeaturesPage` | `ErrorsPage`
   - `FeaturesPage` → `FilterBar` + `CardGrid` → `FeatureCard[]`
   - `ErrorsPage` → `FilterBar` + `CardGrid` → `ErrorCard[]`
   - `DetailPanel` (shared, adapts to card type)
4. **State management** — use Zustand store with IndexedDB persistence middleware
5. **File handling** — store mockup HTML files as Blobs in IndexedDB, create object URLs for iframe rendering
6. **Keep all files under 500 lines** — split into logical modules

---

*This document is the complete specification for TaskMeLater V1. Hand this file to Claude Code for implementation.*
