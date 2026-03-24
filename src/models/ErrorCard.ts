import mongoose, { Schema } from 'mongoose';

export interface IErrorCard {
  _id: string;
  projectId: string;
  page: string;
  prompt: string;
  priority: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
}

const ErrorCardSchema = new Schema(
  {
    _id: { type: String, required: true },
    projectId: { type: String, required: true, index: true },
    page: { type: String, required: true },
    prompt: { type: String, required: true },
    priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
    state: { type: String, enum: ['Not Started', 'Implementing', 'Fixed'], default: 'Not Started' },
  },
  { timestamps: true, _id: false }
);

export default mongoose.models.ErrorCard || mongoose.model('ErrorCard', ErrorCardSchema);
