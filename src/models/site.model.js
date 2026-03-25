
import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name:     { type: String, required: true },
  icon:     { type: String, default: 'leaf' },  //  renamed from sfSymbol to match your Swift struct

}, { timestamps: true });

//  Never store plantCount, always derive it
siteSchema.virtual('plantCount', {
  ref:        'UserPlant',
  localField: '_id',
  foreignField: 'siteId',
  count: true
});

export default mongoose.model('Site', siteSchema);