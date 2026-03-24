import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Feature from '@/models/Feature';

function mapFeature(f: Record<string, unknown>) {
  return {
    id: f._id,
    projectId: f.projectId,
    title: f.title,
    description: f.description,
    priority: f.priority,
    state: f.state,
    mockupHtml: f.mockupHtml ?? null,
    createdAt: (f.createdAt as Date).toISOString(),
    updatedAt: (f.updatedAt as Date).toISOString(),
  };
}

// GET features by projectId
export async function GET(req: NextRequest) {
  await connectDB();
  const projectId = req.nextUrl.searchParams.get('projectId');
  const query = projectId ? { projectId } : {};
  const features = await Feature.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(features.map(mapFeature));
}

// POST create feature
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const feature = await Feature.create({
    _id: body.id,
    projectId: body.projectId,
    title: body.title,
    description: body.description,
    priority: body.priority,
    state: body.state,
    mockupHtml: body.mockupHtml ?? null,
  });
  return NextResponse.json(mapFeature(feature.toObject()), { status: 201 });
}

// PUT update feature
export async function PUT(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { id, ...updates } = body;
  const feature = await Feature.findByIdAndUpdate(id, updates, { new: true }).lean();
  if (!feature) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(mapFeature(feature));
}

// DELETE feature
export async function DELETE(req: NextRequest) {
  await connectDB();
  const { id } = await req.json();
  await Feature.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
