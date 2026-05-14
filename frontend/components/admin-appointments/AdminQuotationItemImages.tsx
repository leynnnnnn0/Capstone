"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImageIcon, Loader2, Trash2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteQuotationItemImage,
  uploadQuotationItemImages,
} from "@/features/admin-appointments/admin-appointment-api";
import type { CustomerQuotationItemImage } from "@/features/customer/types";
import { normalizeAssetUrl } from "@/features/products/product-utils";

type ImageType = "before" | "after";

export default function AdminQuotationItemImages({
  quotationItemId,
  beforeImages,
  afterImages,
  mode = "collapsible",
}: {
  quotationItemId: number;
  beforeImages: CustomerQuotationItemImage[];
  afterImages: CustomerQuotationItemImage[];
  mode?: "collapsible" | "content";
}) {
  const [images, setImages] = useState({ before: beforeImages, after: afterImages });
  const [collapsed, setCollapsed] = useState(true);
  const total = images.before.length + images.after.length;

  if (mode === "content") {
    return (
      <div className="space-y-4">
        <UploadPanel quotationItemId={quotationItemId} type="before" saved={images.before} onSavedChange={(next) => setImages((current) => ({ ...current, before: next }))} />
        <div className="h-px bg-border" />
        <UploadPanel quotationItemId={quotationItemId} type="after" saved={images.after} onSavedChange={(next) => setImages((current) => ({ ...current, after: next }))} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <button type="button" onClick={() => setCollapsed((value) => !value)} className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <ImageIcon className="size-4 text-muted-foreground" />
          Item Photos
          {total > 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{total}</span>}
        </span>
      </button>
      {!collapsed && (
        <div className="space-y-3 border-t px-4 py-4">
          <UploadPanel quotationItemId={quotationItemId} type="before" saved={images.before} onSavedChange={(next) => setImages((current) => ({ ...current, before: next }))} />
          <UploadPanel quotationItemId={quotationItemId} type="after" saved={images.after} onSavedChange={(next) => setImages((current) => ({ ...current, after: next }))} />
        </div>
      )}
    </div>
  );
}

function UploadPanel({
  quotationItemId,
  type,
  saved,
  onSavedChange,
}: {
  quotationItemId: number;
  type: ImageType;
  saved: CustomerQuotationItemImage[];
  onSavedChange: (images: CustomerQuotationItemImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const label = type === "before" ? "Before" : "After";
  const panelClass = type === "before" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50";

  function addFiles(files: FileList | File[]) {
    const nextFiles = Array.from(files).filter((file) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type));
    setPending((current) => [...current, ...nextFiles].slice(0, 10));
  }

  async function upload() {
    if (pending.length === 0) return;
    const formData = new FormData();
    formData.append("type", type);
    if (caption) formData.append("caption", caption);
    pending.forEach((file) => formData.append("images[]", file));

    setUploading(true);
    try {
      const response = await uploadQuotationItemImages(quotationItemId, formData) as { data?: CustomerQuotationItemImage[] };
      onSavedChange([...(saved ?? []), ...(response.data ?? [])]);
      setPending([]);
      setCaption("");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: number) {
    await deleteQuotationItemImage(id);
    onSavedChange(saved.filter((image) => image.id !== id));
  }

  return (
    <div className={`space-y-3 rounded-xl border p-4 ${panelClass}`}>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{saved.length} saved</span>
      </div>
      {saved.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {saved.map((image) => <SavedThumb key={image.id} image={image} onDelete={remove} />)}
        </div>
      )}
      <div
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
        onDragOver={(event) => event.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-white/60 p-4 text-center hover:border-primary"
      >
        <Upload className="mx-auto mb-1 size-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Drop images here or <span className="font-medium text-primary">browse</span></p>
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={(event) => event.target.files && addFiles(event.target.files)} />
      </div>
      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {pending.map((file, index) => <PreviewThumb key={`${file.name}-${index}`} file={file} onRemove={() => setPending((current) => current.filter((_, itemIndex) => itemIndex !== index))} />)}
          </div>
          <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Caption (optional)" className="w-full rounded-md border bg-white px-3 py-1.5 text-xs" />
          <Button type="button" size="sm" className="w-full" onClick={upload} disabled={uploading}>
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            Upload {pending.length} Image{pending.length === 1 ? "" : "s"}
          </Button>
        </div>
      )}
      <Button type="button" variant="outline" size="sm" className="w-full bg-white/70" onClick={() => inputRef.current?.click()}>
        <Camera className="size-4" />
        Take / Add Photo
      </Button>
    </div>
  );
}

function SavedThumb({ image, onDelete }: { image: CustomerQuotationItemImage; onDelete: (id: number) => void }) {
  const src = normalizeAssetUrl(image.image_url ?? image.url ?? "");
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border bg-white">
      {src && <Image src={src} alt={image.caption ?? "Quotation image"} fill unoptimized className="object-cover" />}
      <button type="button" onClick={() => onDelete(image.id)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
        <Trash2 className="size-5 text-white" />
      </button>
    </div>
  );
}

function PreviewThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [src] = useState(() => URL.createObjectURL(file));
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border bg-white">
      <Image src={src} alt={file.name} fill unoptimized className="object-cover" />
      <button type="button" onClick={onRemove} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
        <X className="size-5 text-white" />
      </button>
    </div>
  );
}
