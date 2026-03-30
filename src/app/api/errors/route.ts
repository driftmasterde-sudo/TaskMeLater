import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ErrorCard from '@/models/ErrorCard';

function mapError(e: Record<string, unknown>) {
  return {
    id: e._id,
    projectId: e.projectId,
    page: e.page,
    prompt: e.prompt,
    priority: e.priority,
    state: e.state,
    createdAt: (e.createdAt as Date).toISOString(),
    updatedAt: (e.updatedAt as Date).toISOString(),
  };
}

// GET errors by projectId
export async function GET(req: NextRequest) {
  await connectDB();
  const projectId = req.nextUrl.searchParams.get('projectId');
  const query = projectId ? { projectId } : {};
  const errors = await ErrorCard.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(errors.map(mapError));
}

// POST create error
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const error = await ErrorCard.create({
    _id: body.id,
    projectId: body.projectId,
    page: body.page,
    prompt: body.prompt,
    priority: body.priority,
    state: body.state,
  });
  return NextResponse.json(mapError(error.toObject()), { status: 201 });
}

// PUT update error
export async function PUT(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { id, ...updates } = body;
  const error = await ErrorCard.findByIdAndUpdate(id, updates, { new: true }).lean();
  if (!error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(mapError(error));
}

// PATCH bulk update state
export async function PATCH(req: NextRequest) {
  await connectDB();
  const { ids, state } = await req.json();
  if (!Array.isArray(ids) || !state) {
    return NextResponse.json({ error: 'ids[] and state required' }, { status: 400 });
  }
  await ErrorCard.updateMany({ _id: { $in: ids } }, { state });
  const updated = await ErrorCard.find({ _id: { $in: ids } }).lean();
  return NextResponse.json(updated.map(mapError));
}

// DELETE error
export async function DELETE(req: NextRequest) {
  await connectDB();
  const { id } = await req.json();
  await ErrorCard.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
