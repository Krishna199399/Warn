import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsApi } from '../../api/products.api';
import { categoriesApi } from '../../api/categories.api';
import { Skeleton } from '@/components/ui/skeleton';
import ImageUploader from '../../components/admin/ImageUploader';
import ProductPreviewCard from '../../components/admin/ProductPreviewCard';
import {
  Package, ChevronRight, CheckCircle2, AlertCircle,
  Loader2, ArrowLeft, Info, Tag as TagIcon, X, Lock
} from 'lucide-react';

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
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    categoriesApi.getAll()
      .then(res => {
        setCategories(res.data.data || []);
      })
      .catch(err => {
        console.error('Failed to load categories:', err);
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await productsApi.getOne(id);
        const p   = res.data.data;
        setForm({
          name:        p.name        || '',
          sku:         p.sku         || '',
          category:    p.category    || '',
          unit:        p.unit        || UNITS[0],
          unitQuantity: String(p.unitQuantity ?? ''),
          actualPrice: String(p.actualPrice ?? ''),
          mrp:         String(p.mrp  ?? ''),
          price:       String(p.price ?? ''),
          rp:          String(p.rp   ?? ''),
          sv:          String(p.sv   ?? ''),
          rv:          String(p.rv   ?? ''),
          iv:          String(p.iv   ?? ''),
          wholesaleCommission: String(p.wholesaleCommission ?? ''),
          miniStockCommission: String(p.miniStockCommission ?? ''),
          description: p.description || '',
          brand:       p.brand       || '',
          weight:      p.weight      || '',
          tagsInput:   (p.tags || []).join(', '),
          taxRate:     String(p.taxRate ?? '18'),
          ingredients: p.ingredients || '',
          howToUse:    p.howToUse    || '',
          benefits:    p.benefits    || '',
          dosage:      p.dosage      || '',
          disclaimer:  p.disclaimer  || '',
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

  if (fetching) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <div className="space-y-4">{[1,2,3].map(i=><Skeleton key={i} className="h-32 rounded-xl"/>)}</div>
      </div>
    </div>
  );
  if (!form) return null;

  const set = (key, val) => {
    setForm(f => {
      const updated = { ...f, [key]: val };
      
      // Auto-fill Base Price from Sell Price (for preview)
      if (key === 'mrp') {
        updated.price = val;  // Base Price = Sell Price
      }
      
      return updated;
    });
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const parsedTags = form?.tagsInput ? form.tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name = 'Product name is required';
    if (!form.sku.trim())      e.sku  = 'SKU is required';
    if (!form.category)        e.category = 'Select a category';
    if (!form.actualPrice || isNaN(parseFloat(form.actualPrice)) || parseFloat(form.actualPrice) < 0)
                               e.actualPrice = 'Enter a valid MRP price (≥ 0)';
    if (!form.mrp || isNaN(parseFloat(form.mrp)) || parseFloat(form.mrp) < 0)
                               e.mrp = 'Enter a valid sell price (≥ 0)';
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
      if (form.unitQuantity) fd.append('unitQuantity', form.unitQuantity);
      fd.append('actualPrice', form.actualPrice);
      // price field is auto-filled by backend from mrp
      fd.append('taxRate',     form.taxRate || '18');
      if (form.mrp) fd.append('mrp', form.mrp);
      if (form.rp)  fd.append('rp',  form.rp);
      if (form.sv)  fd.append('sv',  form.sv);
      if (form.rv)  fd.append('rv',  form.rv);
      if (form.iv)  fd.append('iv',  form.iv);
      if (form.wholesaleCommission) fd.append('wholesaleCommission', form.wholesaleCommission);
      if (form.miniStockCommission) fd.append('miniStockCommission', form.miniStockCommission);
      fd.append('description', form.description.trim());
      fd.append('brand',       form.brand.trim());
      fd.append('weight',      form.weight.trim());
      fd.append('ingredients', form.ingredients.trim());
      fd.append('howToUse',    form.howToUse.trim());
      fd.append('benefits',    form.benefits.trim());
      fd.append('dosage',      form.dosage.trim());
      fd.append('disclaimer',  form.disclaimer.trim());
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground text-sm mt-1">Update product details and save changes</p>
        </div>
        <button onClick={() => navigate('/app/products')} className="btn-secondary flex items-center gap-1.5 text-sm">
          <ArrowLeft size={15} /> Back to Products
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span>Products</span>
        <ChevronRight size={12} />
        <span className="text-green-600 font-medium">Edit</span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid lg:grid-cols-[1fr_2fr] xl:grid-cols-[320px_1fr] gap-6 items-start">

          {/* Left: Preview */}
          <div className="lg:sticky lg:top-6">
            <ProductPreviewCard
              name={form.name}
              category={form.category}
              actualPrice={form.actualPrice}
              mrp={form.mrp}
              price={form.price}
              unit={form.unit}
              unitQuantity={form.unitQuantity}
              brand={form.brand}
              tags={parsedTags}
              image={imageFile}
              previewUrl={currentPreviewUrl}
              description={form.description}
              taxRate={form.taxRate}
            />
          </div>

          {/* Right: Form */}
          <div className="space-y-5 min-w-0">{/* min-w-0 prevents overflow */}

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
                  <select 
                    id="edit-category" 
                    value={form.category}
                    onChange={e => set('category', e.target.value)} 
                    className="input-field"
                    disabled={loadingCategories}
                  >
                    {loadingCategories ? (
                      <option value="">Loading categories...</option>
                    ) : categories.length === 0 ? (
                      <option value="">No categories available</option>
                    ) : (
                      <>
                        <option value="">Select a category</option>
                        {categories.map(c => (
                          <option key={c._id} value={c.name}>{c.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Package Size" hint="e.g. 40 kg, 5 liter, 100 unit">
                  <div className="flex gap-2">
                    <input
                      id="edit-unit-quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.unitQuantity}
                      onChange={e => set('unitQuantity', e.target.value)}
                      placeholder="40"
                      className="input-field w-32"
                    />
                    <select
                      id="edit-unit"
                      value={form.unit}
                      onChange={e => set('unit', e.target.value)}
                      className="input-field w-40"
                    >
                      {UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </Field>

                <Field label="Tax Rate (%)" hint="GST/Tax percentage for this product" required error={errors.taxRate}>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">%</span>
                    <input
                      id="edit-tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.taxRate}
                      onChange={e => set('taxRate', e.target.value)}
                      placeholder="18"
                      className={`input-field pr-8 ${errors.taxRate ? 'border-red-400' : ''}`}
                    />
                  </div>
                </Field>
              </div>

              <Field label="MRP Price (₹)" hint="Maximum Retail Price (printed on package)" required error={errors.actualPrice}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                  <input id="edit-actual-price" type="number" min="0" step="0.01" value={form.actualPrice}
                    onChange={e => set('actualPrice', e.target.value)} placeholder="0.00"
                    className={`input-field pl-7 ${errors.actualPrice ? 'border-red-400' : ''}`} />
                </div>
              </Field>

              <Field label="Sell Price (₹)" hint="Actual selling price to customers" required error={errors.mrp}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                  <input id="edit-mrp" type="number" min="0" step="0.01" value={form.mrp}
                    onChange={e => set('mrp', e.target.value)} placeholder="0.00"
                    className={`input-field pl-7 ${errors.mrp ? 'border-red-400' : ''}`} />
                </div>
              </Field>

              <Field label="Description">
                <textarea id="edit-description" rows={3} value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the product..." className="input-field resize-none" />
              </Field>
            </Section>

            {/* Section 2.5 — Product Details (Expandable Sections) */}
            <Section number="2.5" title="Product Details (Optional)" icon={Info}>
              <p className="text-xs text-slate-400 -mt-1 mb-4">
                These sections will appear as expandable panels on the product detail page. Leave blank to hide.
              </p>
              
              <Field label="Ingredients" hint="List the ingredients or composition of the product">
                <textarea
                  id="edit-ingredients"
                  rows={3}
                  value={form.ingredients}
                  onChange={e => set('ingredients', e.target.value)}
                  placeholder="e.g. Organic compounds, natural extracts..."
                  className="input-field resize-none"
                />
              </Field>

              <Field label="How to Use" hint="Provide detailed usage instructions">
                <textarea
                  id="edit-how-to-use"
                  rows={5}
                  value={form.howToUse}
                  onChange={e => set('howToUse', e.target.value)}
                  placeholder="e.g. Spray: - Use for spray by mixing 2 to 2.5 ml in 1 liter water.&#10;Drip: - Use for one acre land by mixing 250 ml in 200 liters water."
                  className="input-field resize-none"
                />
              </Field>

              <Field label="Benefits" hint="List the key benefits and advantages">
                <textarea
                  id="edit-benefits"
                  rows={4}
                  value={form.benefits}
                  onChange={e => set('benefits', e.target.value)}
                  placeholder="e.g. Improves crop yield, protects against pests..."
                  className="input-field resize-none"
                />
              </Field>

              <Field label="Dosage" hint="Specify recommended dosage and application rates">
                <textarea
                  id="edit-dosage"
                  rows={3}
                  value={form.dosage}
                  onChange={e => set('dosage', e.target.value)}
                  placeholder="e.g. 250 ml per acre, apply every 15 days..."
                  className="input-field resize-none"
                />
              </Field>

              <Field label="Disclaimer" hint="Add any warnings, precautions, or legal disclaimers">
                <textarea
                  id="edit-disclaimer"
                  rows={3}
                  value={form.disclaimer}
                  onChange={e => set('disclaimer', e.target.value)}
                  placeholder="e.g. Keep out of reach of children. Use protective equipment..."
                  className="input-field resize-none"
                />
              </Field>
            </Section>

            {/* Section 3 — Pricing & Values */}
            <Section number="3" title="Pricing & Values" icon={Info}>
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <Lock size={16} className="text-amber-600" />
                <p className="text-xs text-amber-800">
                  <strong>Admin Only:</strong> These pricing values are hidden from other users and only visible to administrators.
                </p>
              </div>
              <p className="text-xs text-slate-400 -mt-1 mb-4">All value fields are optional. Enter ₹ amounts for each pricing tier.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'price', label: 'Base Price',      hint: 'Base selling price (before discount)' },
                  { key: 'wholesaleCommission', label: 'Wholesale Commission (per unit)', hint: 'Commission amount for Wholesale buyers' },
                  { key: 'miniStockCommission', label: 'Mini Stock Commission (per unit)', hint: 'Commission amount for Mini Stock buyers' },
                  { key: 'rp',  label: 'RP – Retail Point',   hint: 'Price at retail point' },
                  { key: 'sv',  label: 'SV – Salary Value',   hint: 'Salary value component' },
                  { key: 'rv',  label: 'RV – Rewards Value',  hint: 'Rewards value component' },
                  { key: 'iv',  label: 'IV – Incentive Value', hint: 'Incentive value component' },
                ].map(({ key, label, hint, readOnly }) => (
                  <Field key={key} label={label} hint={hint}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                      <input
                        id={`edit-${key}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={form[key]}
                        onChange={e => set(key, e.target.value)}
                        placeholder="0.00"
                        className={`input-field pl-7 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                        readOnly={readOnly}
                      />
                      {readOnly && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium">
                          Auto
                        </span>
                      )}
                    </div>
                  </Field>
                ))}
              </div>
            </Section>

            {/* Section 4 — Additional Information */}
            <Section number="4" title="Additional Information" icon={TagIcon}>
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
