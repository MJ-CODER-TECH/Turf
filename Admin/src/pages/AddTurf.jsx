import { useState } from 'react';
import { ArrowLeft, Check, Upload, X, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const SPORTS    = ['Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Box Cricket', 'Multi-Sport'];
const AMENITIES = ['Parking', 'Changing Room', 'Floodlit', 'Cafeteria', 'Washrooms', 'First Aid',
  'Equipment Rental', 'Coaching', 'Scoreboard', 'Referee', 'AC Hall', 'Drinking Water',
  'CCTV', 'WiFi', 'Refreshments', 'Shower', 'Locker', 'Spectator Seating'];
const BADGES    = ['', 'Popular', 'New', 'Top Rated', 'Floodlit', 'Indoor', 'Premium', 'Full Ground'];

export default function AddTurf({ onNavigate, editData = null }) {
  const { token } = useAuth();
  const isEdit = !!editData;

  const [form, setForm] = useState({
    name:        editData?.name               || '',
    description: editData?.description        || '',
    sport:       editData?.sport              || 'Football',
    type:        editData?.type               || '5-a-side',
    badge:       editData?.badge              || '',
    capacity:    editData?.capacity           || 10,
    address:     editData?.location?.address  || '',
    area:        editData?.location?.area     || '',
    city:        editData?.location?.city     || '',
    state:       editData?.location?.state    || 'Maharashtra',
    pincode:     editData?.location?.pincode  || '',
    weekday:     editData?.pricing?.weekday   || '',
    weekend:     editData?.pricing?.weekend   || '',
    open:        editData?.operatingHours?.open  || '06:00',
    close:       editData?.operatingHours?.close || '23:00',
    amenities:   editData?.amenities          || [],
    rules:       editData?.rules?.join('\n')  || '',
    tags:        editData?.tags?.join(', ')   || '',
  });

  // Images state
  // existingImages = already on server (edit mode)
  // newImages      = files selected locally (not yet uploaded)
  // uploadedImages = returned from /uploads/turf-images API
  const [existingImages, setExistingImages]   = useState(editData?.images || []);
  const [newImages, setNewImages]             = useState([]);   // { file, preview }
  const [uploadedImages, setUploadedImages]   = useState([]);   // { public_id, url }
  const [imageUploading, setImageUploading]   = useState(false);
  const [imageError, setImageError]           = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const toggleAmenity = (a) => {
    setForm(p => ({
      ...p,
      amenities: p.amenities.includes(a)
        ? p.amenities.filter(x => x !== a)
        : [...p.amenities, a],
    }));
  };

  // ── Image Handlers ──────────────────────────────────────
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalAllowed = 5 - existingImages.length - uploadedImages.length;
    if (files.length > totalAllowed) {
      setImageError(`Maximum 5 images allowed. You can add ${totalAllowed} more.`);
      return;
    }
    setImageError('');
    const previews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages(prev => [...prev, ...previews].slice(0, totalAllowed));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Upload new images to Cloudinary via backend
  const uploadImages = async () => {
    if (newImages.length === 0) return [];
    setImageUploading(true);
    setImageError('');
    try {
      const formData = new FormData();
      newImages.forEach(({ file }) => formData.append('images', file));

      const res = await fetch(`${API_BASE}/uploads/turf-images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setUploadedImages(prev => [...prev, ...data.data]);
      setNewImages([]);   // clear local previews
      return data.data;
    } catch (err) {
      setImageError(err.message || 'Image upload failed.');
      return null;  // null = signal to abort form submit
    } finally {
      setImageUploading(false);
    }
  };

  // ── Form Submit ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Upload any pending new images first
    let freshUploads = [];
    if (newImages.length > 0) {
      const result = await uploadImages();
      if (result === null) {
        setLoading(false);
        return;  // upload failed — stop
      }
      freshUploads = result;
    }

    // 2. Combine all images: existing (kept) + previously uploaded + just uploaded
    const allImages = [
      ...existingImages,
      ...uploadedImages,
      ...freshUploads,
    ];

    const payload = {
      name:        form.name,
      description: form.description,
      sport:       form.sport,
      type:        form.type,
      badge:       form.badge,
      capacity:    Number(form.capacity),
      location: {
        address: form.address,
        area:    form.area,
        city:    form.city,
        state:   form.state,
        pincode: form.pincode,
      },
      pricing: {
        weekday: Number(form.weekday),
        weekend: Number(form.weekend),
      },
      operatingHours: {
        open:  form.open,
        close: form.close,
      },
      amenities: form.amenities,
      rules:     form.rules.split('\n').filter(Boolean),
      tags:      form.tags.split(',').map(t => t.trim()).filter(Boolean),
      images:    allImages,
    };

    try {
      const url    = isEdit ? `${API_BASE}/turfs/${editData._id}` : `${API_BASE}/turfs`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => onNavigate('turfs'), 1500);
      } else {
        setError(data.message || 'Failed to save turf.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalImages = existingImages.length + uploadedImages.length + newImages.length;

  // ── Success Screen ──────────────────────────────────────
  if (success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-primary-400" />
          </div>
          <p className="text-white font-semibold text-lg">
            {isEdit ? 'Turf Updated!' : 'Turf Created!'}
          </p>
          <p className="text-white/40 text-sm mt-1">Redirecting to turfs list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate('turfs')} className="btn-ghost px-3">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-white font-display font-bold text-xl">
            {isEdit ? 'Edit Turf' : 'Add New Turf'}
          </h2>
          <p className="text-white/40 text-sm">
            {isEdit ? `Editing: ${editData.name}` : 'Register a new turf on TurfZone'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Basic Info ── */}
        <div className="card p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Turf Name *</label>
              <input className="input" placeholder="Champions Football Turf" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Description *</label>
              <textarea className="input min-h-[100px] resize-none" placeholder="Describe the turf..." value={form.description} onChange={e => set('description', e.target.value)} required />
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Sport *</label>
              <select className="input" value={form.sport} onChange={e => set('sport', e.target.value)}>
                {SPORTS.map(s => <option key={s} style={{ background: '#131c2e' }}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Type *</label>
              <input className="input" placeholder="5-a-side, Full Pitch, 4 Courts..." value={form.type} onChange={e => set('type', e.target.value)} required />
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Capacity</label>
              <input className="input" type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Badge</label>
              <select className="input" value={form.badge} onChange={e => set('badge', e.target.value)}>
                {BADGES.map(b => <option key={b} value={b} style={{ background: '#131c2e' }}>{b || 'None'}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Images ── */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-white font-semibold text-sm">
              Turf Images
              <span className="text-white/30 font-normal ml-2">({totalImages}/5)</span>
            </h3>
            {newImages.length > 0 && (
              <button
                type="button"
                onClick={uploadImages}
                disabled={imageUploading}
                className="btn-ghost text-xs py-1.5 px-3 text-primary-400"
              >
                {imageUploading
                  ? <><div className="w-3 h-3 border border-primary-400/30 border-t-primary-400 rounded-full animate-spin" /> Uploading...</>
                  : <><Upload size={12} /> Upload {newImages.length} image{newImages.length > 1 ? 's' : ''}</>
                }
              </button>
            )}
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

            {/* Existing images (edit mode) */}
            {existingImages.map((img, i) => (
              <div key={`existing-${i}`} className="relative group aspect-video rounded-xl overflow-hidden bg-dark-100">
                <img src={img.url} alt={`turf-${i}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-md font-semibold">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeExistingImage(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/80 backdrop-blur rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}

            {/* Already uploaded images (this session) */}
            {uploadedImages.map((img, i) => (
              <div key={`uploaded-${i}`} className="relative group aspect-video rounded-xl overflow-hidden bg-dark-100">
                <img src={img.url} alt={`uploaded-${i}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 bg-primary-500/70 text-white text-xs px-2 py-0.5 rounded-md">
                  Uploaded ✓
                </span>
                <button
                  type="button"
                  onClick={() => removeUploadedImage(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/80 backdrop-blur rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}

            {/* New local previews (not yet uploaded) */}
            {newImages.map((img, i) => (
              <div key={`new-${i}`} className="relative group aspect-video rounded-xl overflow-hidden bg-dark-100">
                <img src={img.preview} alt={`preview-${i}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-0">
                </div>
                <span className="absolute bottom-1.5 left-1.5 bg-yellow-500/70 text-white text-xs px-2 py-0.5 rounded-md">
                  Pending
                </span>
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/80 backdrop-blur rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}

            {/* Add more slot */}
            {totalImages < 5 && (
              <label className="aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-primary-500/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                  <Image size={16} className="text-white/30 group-hover:text-primary-400 transition-colors" />
                </div>
                <span className="text-white/30 text-xs group-hover:text-white/50 transition-colors">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </div>

          {imageError && (
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              ⚠️ {imageError}
            </p>
          )}

          <p className="text-white/25 text-xs">
            Max 5 images · Each up to 5MB · First image will be the cover photo
          </p>
        </div>

        {/* ── Location ── */}
        <div className="card p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Full Address *</label>
              <input className="input" placeholder="Plot 12, Near XYZ..." value={form.address} onChange={e => set('address', e.target.value)} required />
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Area *</label>
              <input className="input" placeholder="Baner, Koregaon Park..." value={form.area} onChange={e => set('area', e.target.value)} required />
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">City *</label>
              <input className="input" placeholder="Pune" value={form.city} onChange={e => set('city', e.target.value)} required />
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">State</label>
              <input className="input" value={form.state} onChange={e => set('state', e.target.value)} />
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Pincode</label>
              <input className="input" placeholder="411045" value={form.pincode} onChange={e => set('pincode', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Pricing & Hours ── */}
        <div className="card p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Pricing & Hours</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Weekday ₹ *</label>
              <input className="input" type="number" min="0" placeholder="1200" value={form.weekday} onChange={e => set('weekday', e.target.value)} required />
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Weekend ₹ *</label>
              <input className="input" type="number" min="0" placeholder="1500" value={form.weekend} onChange={e => set('weekend', e.target.value)} required />
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Opens At</label>
              <input className="input" type="time" value={form.open} onChange={e => set('open', e.target.value)} />
            </div>
            <div>
              <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Closes At</label>
              <input className="input" type="time" value={form.close} onChange={e => set('close', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Amenities ── */}
        <div className="card p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">
            Amenities
            <span className="text-primary-400 ml-2 font-normal">({form.amenities.length} selected)</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                  form.amenities.includes(a)
                    ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                {form.amenities.includes(a) && <span className="mr-1">✓</span>}
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* ── Rules & Tags ── */}
        <div className="card p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Rules & Tags</h3>
          <div>
            <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Rules (one per line)</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="No spiked shoes&#10;Bring your own ball&#10;No smoking" value={form.rules} onChange={e => set('rules', e.target.value)} />
          </div>
          <div>
            <label className="text-white/40 text-xs font-medium uppercase tracking-wider block mb-1.5">Tags (comma separated)</label>
            <input className="input" placeholder="floodlit, evening, corporate" value={form.tags} onChange={e => set('tags', e.target.value)} />
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="card p-4 border-red-500/20 bg-red-500/5 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── Submit ── */}
        <div className="flex gap-3 pb-6">
          <button type="button" onClick={() => onNavigate('turfs')} className="btn-ghost flex-1 justify-center">
            Cancel
          </button>
          <button type="submit" disabled={loading || imageUploading} className="btn-primary flex-1 justify-center">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Check size={16} /> {isEdit ? 'Update Turf' : 'Create Turf'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}