import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';
import Feature from '@/models/Feature';
import ErrorCard from '@/models/ErrorCard';

// GET export all data
export async function GET() {
  await connectDB();
  const [projects, features, errors] = await Promise.all([
    Project.find().sort({ order: 1 }).lean(),
    Feature.find().lean(),
    ErrorCard.find().lean(),
  ]);
  return NextResponse.json({ projects, features, errors });
}

// POST import all data (replaces everything)
export async function POST(req: NextRequest) {
  await connectDB();
  const { projects, features, errors } = await req.json();
  await Promise.all([
    Project.deleteMany({}),
    Feature.deleteMany({}),
    ErrorCard.deleteMany({}),
  ]);
  await Promise.all([
    projects?.length ? Project.insertMany(projects.map((p: Record<string, unknown>) => ({ ...p, _id: p.id ?? p._id }))) : null,
    features?.length ? Feature.insertMany(features.map((f: Record<string, unknown>) => ({ ...f, _id: f.id ?? f._id }))) : null,
    errors?.length ? ErrorCard.insertMany(errors.map((e: Record<string, unknown>) => ({ ...e, _id: e.id ?? e._id }))) : null,
  ]);
  return NextResponse.json({ ok: true });
}
