import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  type: 'bug' | 'feature';
  title: string;
  description: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ['bug', 'feature'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IReport>('Report', ReportSchema);