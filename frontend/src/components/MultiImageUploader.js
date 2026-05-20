import { useRef, useState } from 'react';
import axios from 'axios';
import { Upload, X, Star, Loader2, ImagePlus, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { resolveImageUrl } from '@/lib/images';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;

function SortableImage({ id, img, idx, setPrimary, removeImage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`image-thumb-${idx}`}
      className={`relative group aspect-[3/4] rounded-xl overflow-hidden border-2 flex items-center justify-center p-2 bg-white touch-none ${
        img.isPrimary ? 'border-[#3bb44b]' : 'border-[#cfecd6]'
      } ${isDragging ? 'shadow-xl ring-2 ring-[#3bb44b]/40' : ''}`}
    >
      <img src={resolveImageUrl(img.url)} alt="" className="w-full h-full object-contain pointer-events-none" />

      {img.isPrimary && (
        <div className="absolute top-1.5 left-1.5 bg-[#3bb44b] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
          <Star className="w-2.5 h-2.5 fill-current" /> Primary
        </div>
      )}

      {/* Drag handle - top */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        data-testid={`drag-handle-${idx}`}
        className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-[#233232] hover:bg-[#3bb44b] hover:text-white cursor-grab active:cursor-grabbing opacity-70 group-hover:opacity-100 transition-opacity shadow-md"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Hover actions (bottom) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pt-6 pb-2 px-2 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!img.isPrimary && (
          <button
            type="button"
            onClick={() => setPrimary(idx)}
            title="Set as primary"
            data-testid={`set-primary-${idx}`}
            className="px-2 py-1 bg-white rounded-full text-[10px] font-medium hover:bg-[#3bb44b] hover:text-white text-[#233232] flex items-center gap-1"
          >
            <Star className="w-3 h-3" /> Set Primary
          </button>
        )}
        <button
          type="button"
          onClick={() => removeImage(idx)}
          title="Remove image"
          data-testid={`remove-image-${idx}`}
          className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white text-[#233232]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function MultiImageUploader({ images, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const remaining = Math.max(0, MAX_IMAGES - (images?.length || 0));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = images.findIndex(i => i.url === active.id);
    const newIdx = images.findIndex(i => i.url === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onChange(arrayMove(images, oldIdx, newIdx));
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

      {/* Thumbnails grid with drag-and-drop */}
      {images && images.length > 0 && (
        <>
          <p className="text-xs text-[#8dac96] flex items-center gap-1.5">
            <GripVertical className="w-3 h-3" /> Drag the grip handle to reorder images
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images.map(i => i.url)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <SortableImage
                    key={img.url}
                    id={img.url}
                    img={img}
                    idx={idx}
                    setPrimary={setPrimary}
                    removeImage={removeImage}
                  />
                ))}
                {remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-[#cfecd6] hover:border-[#3bb44b] hover:bg-[#3bb44b]/5 flex flex-col items-center justify-center text-[#8dac96] hover:text-[#3bb44b] transition-colors"
                    data-testid="add-more-images"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[10px] mt-1">Add more</span>
                  </button>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}
