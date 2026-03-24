import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';
import Feature from '@/models/Feature';
import ErrorCard from '@/models/ErrorCard';

// GET all projects
export async function GET() {
  await connectDB();
  const projects = await Project.find().sort({ order: 1 }).lean();
  const mapped = projects.map((p) => ({
    id: p._id,
    name: p.name,
    color: p.color,
    icon: p.icon,
    pages: p.pages,
    order: p.order,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
  return NextResponse.json(mapped);
}

// POST create project
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const project = await Project.create({
    _id: body.id,
    name: body.name,
    color: body.color,
    icon: body.icon,
    pages: body.pages,
    order: body.order,
  });
  return NextResponse.json({
    id: project._id,
    name: project.name,
    color: project.color,
    icon: project.icon,
    pages: project.pages,
    order: project.order,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }, { status: 201 });
}

// PUT update project
export async function PUT(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { id, ...updates } = body;
  const project = await Project.findByIdAndUpdate(id, updates, { new: true }).lean();
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    id: project._id,
    name: project.name,
    color: project.color,
    icon: project.icon,
    pages: project.pages,
    order: project.order,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
}

// DELETE project + cascade
export async function DELETE(req: NextRequest) {
  await connectDB();
  const { id } = await req.json();
  await Promise.all([
    Project.findByIdAndDelete(id),
    Feature.deleteMany({ projectId: id }),
    ErrorCard.deleteMany({ projectId: id }),
  ]);
  return NextResponse.json({ ok: true });
}
