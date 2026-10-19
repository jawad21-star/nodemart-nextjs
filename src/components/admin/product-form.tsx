"use client";

import { X } from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";
import { saveProduct } from "@/actions/admin";
import { Field, FieldError, SelectField, SubmitButton, TextArea, Toggle, useFormToast } from "@/components/form";
import { ProductImage } from "@/components/product-image";
import type { Product } from "@/db/schema";
import { shop } from "@/lib/config";
import type { FormState } from "@/lib/form";
import { slugify } from "@/lib/format";

type Option = { id: number; name: string };

export function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 ${className ?? ""}`}>
      <h2 className="mb-4 font-semibold text-slate-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function ProductForm({ product, categories, brands }: { product?: Product; categories: Option[]; brands: Option[] }) {
  const [state, action] = useActionState(saveProduct.bind(null, product?.id ?? null), {} as FormState);
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [gallery, setGallery] = useState(product?.gallery ?? []);
  const [preview, setPreview] = useState<string | null>(product?.image ?? null);
  useFormToast(state);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Section title="Product information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              name="name"
              state={state}
              defaultValue={product?.name}
              required
              onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
            />
            <div>
              <label className="label" htmlFor="slug">
                Slug
              </label>
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="input"
                placeholder="auto-generated-from-name"
              />
              <FieldError state={state} name="slug" />
            </div>
          </div>
          <TextArea label="Short description" name="shortDescription" state={state} defaultValue={product?.shortDescription} rows={2} />
          <TextArea label="Description (HTML allowed)" name="description" state={state} defaultValue={product?.description} rows={8} />
        </Section>

        <Section title="Images">
          <div className="flex flex-wrap items-start gap-5">
            <div className="size-32 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <ProductImage src={preview} alt="Main image" className="size-full p-2" />
            </div>
            <div className="min-w-60 flex-1 space-y-3">
              <div>
                <label className="label" htmlFor="imageFile">
                  Upload main image
                </label>
                <input
                  id="imageFile"
                  name="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPreview(URL.createObjectURL(file));
                  }}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>
              <Field label="…or image URL" name="imageUrl" state={state} defaultValue={product?.image} placeholder="https://…" onChange={(e) => setPreview(e.target.value || null)} />
            </div>
          </div>

          <div>
            <p className="label">Gallery</p>
            {gallery.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-3">
                {gallery.map((src) => (
                  <div key={src} className="relative size-20 rounded-lg border border-slate-200 bg-slate-50">
                    <input type="hidden" name="keepGallery" value={src} />
                    <ProductImage src={src} alt="" className="size-full p-1" />
                    <button
                      type="button"
                      onClick={() => setGallery((g) => g.filter((s) => s !== src))}
                      className="absolute -top-2 -right-2 flex size-6 cursor-pointer items-center justify-center rounded-full bg-rose-600 text-white shadow"
                      aria-label="Remove image"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              name="galleryFiles"
              type="file"
              accept="image/*"
              multiple
              aria-label="Add gallery images"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
            />
            <p className="mt-1 text-xs text-slate-500">Up to 8 images in total, 5 MB each.</p>
          </div>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Status">
          <Toggle label="Visible in store" name="isActive" state={state} defaultChecked={product?.isActive ?? true} />
          <Toggle label="Featured on homepage" name="isFeatured" state={state} defaultChecked={product?.isFeatured} />
        </Section>

        <Section title="Pricing">
          <Field label={`Price (${shop.currency})`} name="price" type="number" min={0} state={state} defaultValue={product?.price} required />
          <Field label={`Compare-at price (${shop.currency})`} name="comparePrice" type="number" min={0} state={state} defaultValue={product?.comparePrice} hint="Original price, shown crossed out." />
        </Section>

        <Section title="Inventory">
          <Field label="SKU" name="sku" state={state} defaultValue={product?.sku} />
          <Field label="Stock" name="stock" type="number" min={0} state={state} defaultValue={product?.stock ?? 0} required />
        </Section>

        <Section title="Organisation">
          <SelectField label="Category" name="categoryId" state={state} defaultValue={product?.categoryId} placeholder="Choose a category" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          <SelectField label="Brand" name="brandId" state={state} defaultValue={product?.brandId} placeholder="No brand" options={brands.map((b) => ({ value: b.id, label: b.name }))} />
        </Section>

        <SubmitButton className="btn-brand w-full !rounded-xl !py-3" pendingText="Saving…">
          {product ? "Save changes" : "Create product"}
        </SubmitButton>
      </div>
    </form>
  );
}
