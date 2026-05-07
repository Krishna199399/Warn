import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '../../api/products.api';
import { categoriesApi } from '../../api/categories.api';
// Legacy PageHeader removed — using inline header
import ImageUploader from '../../components/admin/ImageUploader';
import ProductPreviewCard from '../../components/admin/ProductPreviewCard';
import {
  Package, ChevronRight, CheckCircle2, AlertCircle,
  Loader2, ArrowLeft, Info, Tag as TagIcon, X, Lock
} from 'lucide-react';

const UNITS      = ['kg', 'liter', 'unit', 'bag', 'box', 'packet', 'quintal', 'ton'];

const INITIAL_FORM = {
  name: '', sku: '', category: '', unit: UNITS[0], unitQuantity: '',
  actualPrice: '', mrp: '', rp: '', sv: '', rv: '', iv: '',
  wholesalePrice: '', miniStockPrice: '',
  description: '', brand: '', weight: '', tagsInput: '',
  taxRate: '18', // Default 18% tax
  ingredients: '', howToUse: '', benefits: '', dosage: '', disclaimer: '',
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
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

// ─── Field wrapper ────────────────────────────────────────────────────────────
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

// ─── Toast ────────────────────────────────────────────────────────────────────
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateProductPage() {
  const navigate = useNavigate();

  const [form, setForm]         = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    categoriesApi.getAll()
      .then(res => {
        const cats = res.data.data || [];
        setCategories(cats);
        // Set first category as default if available
        if (cats.length > 0 && !form.category) {
          setForm(f => ({ ...f, category: cats[0].name }));
        }
      })
      .catch(err => {
        console.error('Failed to load categories:', err);
        setToast({ message: 'Failed to load categories', type: 'error' });
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  const set = (key, val) => {
    setForm(f => {
      const updated = { ...f, [key]: val };
      // Auto-sync: When actualPrice changes, update mrp field too
      if (key === 'actualPrice') {
        updated.mrp = val;
      }
      return updated;
    });
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name  = 'Product name is required';
    if (!form.sku.trim())      e.sku   = 'SKU is required';
    if (!form.category)        e.category = 'Select a category';
    if (!form.actualPrice || isNaN(parseFloat(form.actualPrice)) || parseFloat(form.actualPrice) < 0)
                               e.actualPrice = 'Enter a valid MRP price (≥ 0)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
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
      fd.append('price',       form.actualPrice); // Use actualPrice as price (no discount)
      fd.append('taxRate',     form.taxRate || '18');
      if (form.mrp)  fd.append('mrp', form.mrp);
      if (form.rp)   fd.append('rp',  form.rp);
      if (form.sv)   fd.append('sv',  form.sv);
      if (form.rv)   fd.append('rv',  form.rv);
      if (form.iv)   fd.append('iv',  form.iv);
      if (form.wholesalePrice) fd.append('wholesalePrice', form.wholesalePrice);
      if (form.miniStockPrice) fd.append('miniStockPrice', form.miniStockPrice);
      fd.append('description', form.description.trim());
      fd.append('ingredients', form.ingredients.trim());
      fd.append('howToUse', form.howToUse.trim());
      fd.append('benefits', form.benefits.trim());
      fd.append('dosage', form.dosage.trim());
      fd.append('disclaimer', form.disclaimer.trim());
      if (imageFile) fd.append('image', imageFile);

      await productsApi.create(fd);
      setToast({ message: 'Product created successfully!', type: 'success' });
      setTimeout(() => navigate('/app/products'), 1800);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create product';
      // Highlight field if SKU duplicate
      if (msg.toLowerCase().includes('sku')) setErrors(e => ({ ...e, sku: msg }));
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 page-enter">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Product</h1>
          <p className="text-muted-foreground text-sm mt-1">Add a new product to the catalog</p>
        </div>
        <button onClick={() => navigate('/app/products')} className="btn-secondary flex items-center gap-1.5 text-sm">
          <ArrowLeft size={15} /> Back to Products
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span>Products</span>
        <ChevronRight size={12} />
        <span className="text-green-600 font-medium">Create</span>
      </div>

      {/* 2-column grid */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid lg:grid-cols-[1fr_2fr] xl:grid-cols-[320px_1fr] gap-6 items-start">

          {/* ── LEFT: Preview ─────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-6">
            <ProductPreviewCard
              name={form.name}
              category={form.category}
              actualPrice={form.actualPrice}
              price={form.actualPrice}
              unit={form.unit}
              unitQuantity={form.unitQuantity}
              brand=""
              tags={[]}
              image={imageFile}
              previewUrl={null}
              description={form.description}
              taxRate={form.taxRate}
            />
          </div>

          {/* ── RIGHT: Form ───────────────────────────────────────────────── */}
          <div className="space-y-5 min-w-0">{/* min-w-0 prevents overflow */}

            {/* Section 1 — Image */}
            <Section number="1" title="Product Image" icon={Package}>
              <ImageUploader
                value={imageFile}
                previewUrl={null}
                onChange={(file) => setImageFile(file)}
                onClear={() => setImageFile(null)}
              />
            </Section>

            {/* Section 2 — Product Information */}
            <Section number="2" title="Product Information" icon={Info}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Product Name" required error={errors.name}>
                  <input
                    id="prod-name"
                    type="text"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Premium Wheat Seeds"
                    className={`input-field ${errors.name ? 'border-red-400 focus:border-red-400' : ''}`}
                  />
                </Field>

                <Field label="SKU" required error={errors.sku} hint="Unique product identifier">
                  <input
                    id="prod-sku"
                    type="text"
                    value={form.sku}
                    onChange={e => set('sku', e.target.value.toUpperCase())}
                    placeholder="e.g. SEED-001"
                    className={`input-field font-mono ${errors.sku ? 'border-red-400 focus:border-red-400' : ''}`}
                  />
                </Field>

                <Field label="Category" required error={errors.category}>
                  <select
                    id="prod-category"
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
                      id="prod-unit-quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.unitQuantity}
                      onChange={e => set('unitQuantity', e.target.value)}
                      placeholder="40"
                      className="input-field w-32"
                    />
                    <select
                      id="prod-unit"
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
                      id="prod-tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.taxRate}
                      onChange={e => set('taxRate', e.target.value)}
                      placeholder="18"
                      className={`input-field pr-8 ${errors.taxRate ? 'border-red-400 focus:border-red-400' : ''}`}
                    />
                  </div>
                </Field>
              </div>

              <Field label="MRP Price (₹)" hint="Maximum Retail Price for this product" required error={errors.actualPrice}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                  <input
                    id="prod-actual-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.actualPrice}
                    onChange={e => set('actualPrice', e.target.value)}
                    placeholder="0.00"
                    className={`input-field pl-7 ${errors.actualPrice ? 'border-red-400 focus:border-red-400' : ''}`}
                  />
                </div>
              </Field>

              <Field label="Description" hint="Briefly describe what this product is and its key uses">
                <textarea
                  id="prod-description"
                  rows={3}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the product..."
                  className="input-field resize-none"
                />
              </Field>
            </Section>

            {/* Section 2.5 — Product Details (Expandable Sections) */}
            <Section number="2.5" title="Product Details (Optional)" icon={Info}>
              <p className="text-xs text-slate-400 -mt-1 mb-4">
                These sections will appear as expandable panels on the product detail page. Leave blank to hide.
              </p>
              
              <Field label="Ingredients" hint="List the ingredients or composition of the product">
                <textarea
                  id="prod-ingredients"
                  rows={3}
                  value={form.ingredients}
                  onChange={e => set('ingredients', e.target.value)}
                  placeholder="e.g. Organic compounds, natural extracts..."
                  className="input-field resize-none"
                />
              </Field>

              <Field label="How to Use" hint="Provide detailed usage instructions">
                <textarea
                  id="prod-how-to-use"
                  rows={5}
                  value={form.howToUse}
                  onChange={e => set('howToUse', e.target.value)}
                  placeholder="e.g. Spray: - Use for spray by mixing 2 to 2.5 ml in 1 liter water.&#10;Drip: - Use for one acre land by mixing 250 ml in 200 liters water."
                  className="input-field resize-none"
                />
              </Field>

              <Field label="Benefits" hint="List the key benefits and advantages">
                <textarea
                  id="prod-benefits"
                  rows={4}
                  value={form.benefits}
                  onChange={e => set('benefits', e.target.value)}
                  placeholder="e.g. Improves crop yield, protects against pests..."
                  className="input-field resize-none"
                />
              </Field>

              <Field label="Dosage" hint="Specify recommended dosage and application rates">
                <textarea
                  id="prod-dosage"
                  rows={3}
                  value={form.dosage}
                  onChange={e => set('dosage', e.target.value)}
                  placeholder="e.g. 250 ml per acre, apply every 15 days..."
                  className="input-field resize-none"
                />
              </Field>

              <Field label="Disclaimer" hint="Add any warnings, precautions, or legal disclaimers">
                <textarea
                  id="prod-disclaimer"
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
                  { key: 'mrp', label: 'MRP',               hint: 'Auto-synced from MRP Price above', readOnly: true },
                  { key: 'wholesalePrice', label: 'Wholesale Price', hint: 'Price for Wholesale buyers' },
                  { key: 'miniStockPrice', label: 'Mini Stock Price', hint: 'Price for Mini Stock buyers' },
                  { key: 'rp',  label: 'RP – Retail Point',  hint: 'Price at retail point' },
                  { key: 'sv',  label: 'SV – Salary Value',  hint: 'Salary value component' },
                  { key: 'rv',  label: 'RV – Rewards Value', hint: 'Rewards value component' },
                  { key: 'iv',  label: 'IV – Incentive Value', hint: 'Incentive value component' },
                ].map(({ key, label, hint, readOnly }) => (
                  <Field key={key} label={label} hint={hint}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                      <input
                        id={`prod-${key}`}
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

            {/* Section 4 — Actions */}
            <div className="card p-5 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                All required fields (<span className="text-red-500">*</span>) must be filled.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/app/products')}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  id="btn-create-product"
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Creating...</>
                    : <><CheckCircle2 size={15} /> Create Product</>
                  }
                </button>
              </div>
            </div>

          </div>
        </div>
      </form>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
