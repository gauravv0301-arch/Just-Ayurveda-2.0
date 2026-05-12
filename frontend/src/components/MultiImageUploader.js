import { useRef, useState } from 'react';
import axios from 'axios';
import { Upload, X, Star, Loader2, MoveLeft, MoveRight, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { resolveImageUrl } from '@/lib/images';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;

export default function MultiImageUploader({ images, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const remaining = Math.max(0, MAX_IMAGES - (images?.length || 0));

  const validate = (files) => {
    const arr = Array.from(files);
    if (arr.length === 0) return [];
    if (arr.length > remaining) {
      toast.error(`You can upload max ${MAX_IMAGES} images. ${remaining} slot(s) remaining.`);
      return [];
    }
    for (const f of arr) {
      if (!ALLOWED.includes(f.type)) {
        toast.error(`${f.name}: only JPG, PNG, WEBP allowed`);
        return [];
      }
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name}: exceeds 5MB limit`);
        return [];
      }
    }
    return arr;
  };

  const uploadFiles = async (files) => {
    const valid = validate(files);
    if (valid.length === 0) return;
    setUploading(true);
    setProgress(0);
    try {
      const form = new FormData();
      valid.forEach(f => form.append('files', f));
      const token = sessionStorage.getItem('ja_admin_token');
      const { data } = await axios.post(`${API}/admin/upload`, form, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: e => setProgress(Math.round((e.loaded * 100) / (e.total || 1))),
      });
      const newImages = (data.files || []).map(f => ({ url: f.url, isPrimary: false }));
      // Merge — if no existing image, mark first uploaded as primary
      const existing = images || [];
      let merged = [...existing, ...newImages];
      if (!merged.some(i => i.isPrimary) && merged.length > 0) merged[0].isPrimary = true;
      onChange(merged);
      toast.success(`${newImages.length} image(s) uploaded`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  const setPrimary = (idx) => {
    const next = (images || []).map((i, k) => ({ ...i, isPrimary: k === idx }));
    onChange(next);
  };

  const removeImage = (idx) => {
    const next = (images || []).filter((_, k) => k !== idx);
    if (next.length > 0 && !next.some(i => i.isPrimary)) next[0].isPrimary = true;
    onChange(next);
  };

  const moveImage = (idx, dir) => {
    const next = [...(images || [])];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3" data-testid="multi-image-uploader">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && remaining > 0 && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl px-5 py-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-[#3bb44b] bg-[#3bb44b]/5' : 'border-[#cfecd6] bg-[#cfecd6]/10 hover:bg-[#cfecd6]/20'
        } ${remaining === 0 ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={e => uploadFiles(e.target.files)}
          data-testid="image-upload-input"
        />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-[#3bb44b] animate-spin" />
              <p className="text-sm font-medium text-[#233232]">Uploading… {progress}%</p>
              <div className="w-full max-w-xs h-1.5 bg-[#cfecd6] rounded-full overflow-hidden">
                <div className="h-full bg-[#3bb44b] transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-[#3bb44b]" />
              <p className="text-sm font-medium text-[#233232]">
                {remaining > 0 ? 'Drop images here or click to upload' : 'Maximum images reached'}
              </p>
              <p className="text-xs text-[#8dac96]">
                JPG, PNG, WEBP · up to 5MB each · {remaining} slot{remaining !== 1 ? 's' : ''} left
              </p>
            </>
          )}
        </div>
      </div>

      {/* Thumbnails grid */}
      {images && images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div
              key={`${img.url}-${idx}`}
              data-testid={`image-thumb-${idx}`}
              className={`relative group aspect-square rounded-xl overflow-hidden border-2 ${
                img.isPrimary ? 'border-[#3bb44b]' : 'border-[#cfecd6]'
              }`}
            >
              <img src={resolveImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
              {img.isPrimary && (
                <div className="absolute top-1.5 left-1.5 bg-[#3bb44b] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-current" /> Primary
                </div>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-1">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      title="Set as primary"
                      data-testid={`set-primary-${idx}`}
                      className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-[#3bb44b] hover:text-white text-[#233232]"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => moveImage(idx, -1)}
                    disabled={idx === 0}
                    title="Move left"
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-[#cfecd6] text-[#233232] disabled:opacity-40"
                  >
                    <MoveLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 1)}
                    disabled={idx === images.length - 1}
                    title="Move right"
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-[#cfecd6] text-[#233232] disabled:opacity-40"
                  >
                    <MoveRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    title="Remove"
                    data-testid={`remove-image-${idx}`}
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white text-[#233232]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-[#cfecd6] hover:border-[#3bb44b] hover:bg-[#3bb44b]/5 flex flex-col items-center justify-center text-[#8dac96] hover:text-[#3bb44b] transition-colors"
              data-testid="add-more-images"
            >
              <ImagePlus className="w-5 h-5" />
              <span className="text-[10px] mt-1">Add more</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
