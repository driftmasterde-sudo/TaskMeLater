import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Project, FeatureCard, ErrorCard } from '@/types';

interface TaskMeLaterDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-order': number };
  };
  features: {
    key: string;
    value: FeatureCard;
    indexes: { 'by-project': string };
  };
  errors: {
    key: string;
    value: ErrorCard;
    indexes: { 'by-project': string };
  };
}

const DB_NAME = 'taskmelater';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TaskMeLaterDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TaskMeLaterDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-order', 'order');

        const featureStore = db.createObjectStore('features', { keyPath: 'id' });
        featureStore.createIndex('by-project', 'projectId');

        const errorStore = db.createObjectStore('errors', { keyPath: 'id' });
        errorStore.createIndex('by-project', 'projectId');
      },
    });
  }
  return dbPromise;
}

// Projects
export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  const projects = await db.getAllFromIndex('projects', 'by-order');
  return projects;
}

export async function putProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put('projects', project);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['projects', 'features', 'errors'], 'readwrite');
  await tx.objectStore('projects').delete(id);
  // cascade delete cards
  const features = await tx.objectStore('features').index('by-project').getAllKeys(id);
  for (const key of features) await tx.objectStore('features').delete(key);
  const errors = await tx.objectStore('errors').index('by-project').getAllKeys(id);
  for (const key of errors) await tx.objectStore('errors').delete(key);
  await tx.done;
}

// Features
export async function getFeaturesByProject(projectId: string): Promise<FeatureCard[]> {
  const db = await getDB();
  return db.getAllFromIndex('features', 'by-project', projectId);
}

export async function putFeature(feature: FeatureCard): Promise<void> {
  const db = await getDB();
  await db.put('features', feature);
}

export async function deleteFeature(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('features', id);
}

// Errors
export async function getErrorsByProject(projectId: string): Promise<ErrorCard[]> {
  const db = await getDB();
  return db.getAllFromIndex('errors', 'by-project', projectId);
}

export async function putError(error: ErrorCard): Promise<void> {
  const db = await getDB();
  await db.put('errors', error);
}

export async function deleteError(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('errors', id);
}

// Export/Import
export async function exportAllData(): Promise<string> {
  const db = await getDB();
  const projects = await db.getAll('projects');
  const features = await db.getAll('features');
  const errors = await db.getAll('errors');
  return JSON.stringify({ projects, features, errors }, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  const db = await getDB();
  const tx = db.transaction(['projects', 'features', 'errors'], 'readwrite');
  await tx.objectStore('projects').clear();
  await tx.objectStore('features').clear();
  await tx.objectStore('errors').clear();
  for (const p of data.projects) await tx.objectStore('projects').put(p);
  for (const f of data.features) await tx.objectStore('features').put(f);
  for (const e of data.errors) await tx.objectStore('errors').put(e);
  await tx.done;
}
