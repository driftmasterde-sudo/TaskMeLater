import mongoose, { Schema } from 'mongoose';

export interface IProject {
  _id: string;
  name: string;
  color: string;
  icon: string;
  pages: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    icon: { type: String, default: '' },
    pages: { type: [String], default: ['Dashboard', 'Settings', 'Profile'] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, _id: false }
);

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
