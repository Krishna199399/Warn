import React, { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

/**
 * ImageUploader — drag-and-drop + click-to-browse
 * Props:
 *  - value: File | null
 *  - previewUrl: string | null  (existing URL for edit mode)
 *  - onChange(file): called when a new file is selected
 *  - onClear(): called when the image is removed
 */
export default function ImageUploader({ value, previewUrl, onChange, onClear }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  // Build display URL: if a new File is chosen use object URL, else fall back to existing URL
  const displayUrl = value
    ? URL.createObjectURL(value)
    : previewUrl || null;

  const handleFiles = (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    onChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {displayUrl ? (
        /* ── Preview ── */
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
          <img
            src={displayUrl}
            alt="Product preview"
            className="w-full h-52 object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm
                       flex items-center justify-center text-slate-500 hover:text-red-600
                       shadow-md transition-all hover:scale-110"
          >
            <X size={14} />
          </button>
          <div
            className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors
                        flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold
                         px-3 py-1.5 rounded-lg shadow-md hover:bg-white transition-all"
            >
              Change Image
            </button>
          </div>
        </div>
      ) : (
        /* ── Drop zone ── */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                      transition-all duration-200 select-none
                      ${dragging
                        ? 'border-green-500 bg-green-50 scale-[1.01]'
                        : 'border-slate-200 hover:border-green-400 hover:bg-green-50/50 bg-slate-50'
                      }`}
        >
          <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-colors
                           ${dragging ? 'bg-green-100' : 'bg-slate-100'}`}>
            <ImageIcon size={22} className={dragging ? 'text-green-600' : 'text-slate-400'} />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {dragging ? 'Drop your image here' : 'Drop your image here or click to browse'}
          </p>
          <p className="text-xs text-slate-400">
            PNG, JPG, WebP, GIF · Max 5 MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
