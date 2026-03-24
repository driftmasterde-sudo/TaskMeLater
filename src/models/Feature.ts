import mongoose, { Schema } from 'mongoose';

export interface IFeature {
  _id: string;
  projectId: string;
  title: string;
  description: string;
  priority: string;
  state: string;
  mockupHtml: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureSchema = new Schema(
  {
    _id: { type: String, required: true },
    projectId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
    state: { type: String, enum: ['Proposed', 'Planned', 'Implementing', 'Integrated'], default: 'Proposed' },
    mockupHtml: { type: String, default: null },
  },
  { timestamps: true, _id: false }
);

export default mongoose.models.Feature || mongoose.model('Feature', FeatureSchema);
