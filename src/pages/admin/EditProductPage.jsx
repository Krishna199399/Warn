import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsApi } from '../../api/products.api';
import { PageHeader, LoadingSpinner } from '../../components/ui';
import ImageUploader from '../../components/admin/ImageUploader';
import ProductPreviewCard from '../../components/admin/ProductPreviewCard';
import {
  Package, ChevronRight, CheckCircle2, AlertCircle,
  Loader2, ArrowLeft, Info, Tag as TagIcon, X
} from 'lucide-react';

const CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticide', 'Equipment', 'Supplement'];
const UNITS      = ['kg', 'liter', 'unit', 'bag', 'box', 'packet', 'quintal', 'ton'];

function Section({ number, title, icon: Icon, children }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-green-600 text-white text-xs font-bold
                        flex items-center justify-center flex-shrink-0">
          {number}
        </div>
        {Icon && <Icon size={15} className="text-slate-500" />}
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, error, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint  && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3
                     rounded-xl shadow-2xl border text-sm font-medium toast-enter
                     ${type === 'success'
                       ? 'bg-green-600 text-white border-green-500'
                       : 'bg-red-600 text-white border-red-500'}`}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
}

export default function EditProductPage() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [form, setForm]           = useState(null);
  const [imageFile, setImageFile]   = useState(null);
  const [existingUrl, setExistingUrl] = useState(null);
  const [clearImage, setClearImage]   = useState(false);
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [toast, setToast]         = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await productsApi.getOne(id);
        const p   = res.data.data;
        setForm({
          name:        p.name        || '',
          sku:         p.sku         || '',
          category:    p.category    || CATEGORIES[0],
          unit:        p.unit        || UNITS[0],
          price:       String(p.price) || '',
          description: p.description || '',
          brand:       p.brand       || '',
          weight:      p.weight      || '',
          tagsInput:   (p.tags || []).join(', '),
        });
        if (p.image) {
          const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
          setExistingUrl(p.image.startsWith('http') ? p.image : `${base}${p.image}`);
        }
      } catch {
        setToast({ message: 'Product not found', type: 'error' });
        setTimeout(() => navigate('/app/products'), 1800);
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  if (fetching) return <LoadingSpinner />;
  if (!form)    return null;

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const parsedTags = form.tagsInput.split(',').map(t => t.trim()).filter(Boolean);

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name = 'Product name is required';
    if (!form.sku.trim())      e.sku  = 'SKU is required';
    if (!form.category)        e.category = 'Select a category';
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)
                               e.price = 'Enter a valid price (≥ 0)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name',        form.name.trim());
      fd.append('sku',         form.sku.trim());
      fd.append('category',    form.category);
      fd.append('unit',        form.unit);
      fd.append('price',       form.price);
      fd.append('description', form.description.trim());
      fd.append('brand',       form.brand.trim());
      fd.append('weight',      form.weight.trim());
      parsedTags.forEach(t => fd.append('tags', t));
      if (imageFile)  fd.append('image', imageFile);
      if (clearImage) fd.append('clearImage', 'true');

      await productsApi.update(id, fd);
      setToast({ message: 'Product updated successfully!', type: 'success' });
      setTimeout(() => navigate('/app/products'), 1800);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update product';
      if (msg.toLowerCase().includes('sku')) setErrors(e => ({ ...e, sku: msg }));
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const currentPreviewUrl = clearImage ? null : existingUrl;

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Edit Product"
        subtitle="Update product details and save changes"
        actions={
          <button onClick={() => navigate('/app/products')} className="btn-secondary">
            <ArrowLeft size={15} /> Back to Products
          </button>
        }
      />

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span>Products</span>
        <ChevronRight size={12} />
        <span className="text-green-600 font-medium">Edit</span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">

          {/* Left: Preview */}
          <ProductPreviewCard
            name={form.name}
            category={form.category}
            price={form.price}
            unit={form.unit}
            brand={form.brand}
            tags={parsedTags}
            image={imageFile}
            previewUrl={currentPreviewUrl}
          />

          {/* Right: Form */}
          <div className="space-y-5">

            <Section number="1" title="Product Image" icon={Package}>
              <ImageUploader
                value={imageFile}
                previewUrl={currentPreviewUrl}
                onChange={(file) => { setImageFile(file); setClearImage(false); }}
                onClear={() => { setImageFile(null); setClearImage(true); setExistingUrl(null); }}
              />
            </Section>

            <Section number="2" title="Product Information" icon={Info}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Product Name" required error={errors.name}>
                  <input id="edit-name" type="text" value={form.name}
                    onChange={e => set('name', e.target.value)} placeholder="Product name"
                    className={`input-field ${errors.name ? 'border-red-400' : ''}`} />
                </Field>

                <Field label="SKU" required error={errors.sku}>
                  <input id="edit-sku" type="text" value={form.sku}
                    onChange={e => set('sku', e.target.value.toUpperCase())} placeholder="SKU"
                    className={`input-field font-mono ${errors.sku ? 'border-red-400' : ''}`} />
                </Field>

                <Field label="Category" required error={errors.category}>
                  <select id="edit-category" value={form.category}
                    onChange={e => set('category', e.target.value)} className="input-field">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>

                <Field label="Unit">
                  <select id="edit-unit" value={form.unit}
                    onChange={e => set('unit', e.target.value)} className="input-field">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>

                <Field label="Price (₹)" required error={errors.price}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                    <input id="edit-price" type="number" min="0" step="0.01" value={form.price}
                      onChange={e => set('price', e.target.value)} placeholder="0.00"
                      className={`input-field pl-7 ${errors.price ? 'border-red-400' : ''}`} />
                  </div>
                </Field>
              </div>

              <Field label="Description">
                <textarea id="edit-description" rows={3} value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the product..." className="input-field resize-none" />
              </Field>
            </Section>

            <Section number="3" title="Additional Information" icon={TagIcon}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Brand">
                  <input id="edit-brand" type="text" value={form.brand}
                    onChange={e => set('brand', e.target.value)} placeholder="Brand name"
                    className="input-field" />
                </Field>
                <Field label="Weight / Volume">
                  <input id="edit-weight" type="text" value={form.weight}
                    onChange={e => set('weight', e.target.value)} placeholder="e.g. 1 kg"
                    className="input-field" />
                </Field>
              </div>

              <Field label="Tags / Labels" hint="Separate tags with commas">
                <input id="edit-tags" type="text" value={form.tagsInput}
                  onChange={e => set('tagsInput', e.target.value)}
                  placeholder="e.g. organic, bestseller" className="input-field" />
                {parsedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {parsedTags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs font-medium
                                               bg-green-50 text-green-700 border border-green-200
                                               px-2.5 py-0.5 rounded-full">
                        <TagIcon size={9} />{tag}
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            </Section>

            <div className="card p-5 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                Required fields (<span className="text-red-500">*</span>) must be filled.
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => navigate('/app/products')}
                  className="btn-secondary" disabled={loading}>
                  Cancel
                </button>
                <button id="btn-update-product" type="submit" className="btn-primary" disabled={loading}>
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                    : <><CheckCircle2 size={15} /> Save Changes</>
                  }
                </button>
              </div>
            </div>

          </div>
        </div>
      </form>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
