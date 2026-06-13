"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImageIcon, Loader2, Maximize2, Trash2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteQuotationItemImage,
  uploadQuotationItemImages,
} from "@/features/admin-appointments/admin-appointment-api";
import type { CustomerQuotationItemImage } from "@/features/customer/types";
import { normalizeAssetUrl } from "@/features/products/product-utils";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

type ImageType = "before" | "after";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const TARGET_UPLOAD_BYTES = 1.5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1280;

export default function AdminQuotationItemImages({
  quotationItemId,
  beforeImages,
  afterImages,
  mode = "collapsible",
  onImagesChange,
}: {
  quotationItemId: number;
  beforeImages: CustomerQuotationItemImage[];
  afterImages: CustomerQuotationItemImage[];
  mode?: "collapsible" | "content";
  onImagesChange?: (images: { before: CustomerQuotationItemImage[]; after: CustomerQuotationItemImage[] }) => void;
}) {
  const [imageOverrides, setImageOverrides] = useState<Partial<Record<ImageType, CustomerQuotationItemImage[]>>>({});
  const [collapsed, setCollapsed] = useState(true);
  const images = {
    before: imageOverrides.before ?? beforeImages,
    after: imageOverrides.after ?? afterImages,
  };
  const total = images.before.length + images.after.length;

  const updateImages = (type: ImageType, nextImages: CustomerQuotationItemImage[]) => {
    const next = { ...images, [type]: nextImages };
    setImageOverrides((current) => ({ ...current, [type]: nextImages }));
    onImagesChange?.(next);
  };

  if (mode === "content") {
    return (
      <div className="space-y-4">
        <UploadPanel quotationItemId={quotationItemId} type="before" saved={images.before} onSavedChange={(next) => updateImages("before", next)} />
        <div className="h-px bg-border" />
        <UploadPanel quotationItemId={quotationItemId} type="after" saved={images.after} onSavedChange={(next) => updateImages("after", next)} />
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
          <UploadPanel quotationItemId={quotationItemId} type="before" saved={images.before} onSavedChange={(next) => updateImages("before", next)} />
          <UploadPanel quotationItemId={quotationItemId} type="after" saved={images.after} onSavedChange={(next) => updateImages("after", next)} />
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerQuotationItemImage | null>(null);
  const [previewTarget, setPreviewTarget] = useState<CustomerQuotationItemImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = type === "before" ? "Before" : "After";
  const panelClass = type === "before" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50";

  async function addFiles(files: FileList | File[]) {
    setError(null);
    const fileList = Array.from(files);
    const nextFiles: File[] = [];
    let rejected = false;

    setProcessing(true);

    try {
      for (const file of fileList) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          rejected = true;
          continue;
        }

        const prepared = await prepareImageForUpload(file);

        if (prepared.size > TARGET_UPLOAD_BYTES) {
          rejected = true;
          continue;
        }

        nextFiles.push(prepared);
      }
    } catch {
      rejected = true;
    } finally {
      setProcessing(false);
    }

    if (rejected) {
      setError("Some photos were skipped. Upload JPG, PNG, or WebP images that can be compressed under 1.5 MB.");
    }

    if (nextFiles.length > 0) {
      setPending((current) => [...current, ...nextFiles].slice(0, 10));
    }
  }

  async function upload() {
    if (pending.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const uploaded: CustomerQuotationItemImage[] = [];

      for (const file of pending) {
        const formData = new FormData();
        formData.append("type", type);
        formData.append("images[]", file, file.name);

        const response = await uploadQuotationItemImages(quotationItemId, formData) as { data?: CustomerQuotationItemImage[] };
        uploaded.push(...(response.data ?? []));
      }

      onSavedChange([...(saved ?? []), ...uploaded]);
      setPending([]);
      toast.success(`${label} photo${pending.length === 1 ? "" : "s"} uploaded.`);
    } catch (uploadError) {
      setError(apiErrorMessage(uploadError));
      toast.error(`Unable to upload ${label.toLowerCase()} photos.`);
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteQuotationItemImage(deleteTarget.id);
      onSavedChange(saved.filter((image) => image.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Photo deleted.");
    } catch {
      toast.error("Unable to delete photo.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`space-y-3 rounded-xl border p-4 ${panelClass}`}>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{saved.length} saved</span>
      </div>
      {saved.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {saved.map((image) => <SavedThumb key={image.id} image={image} onPreview={setPreviewTarget} />)}
        </div>
      )}
      <div
        onDrop={(event) => {
          event.preventDefault();
          void addFiles(event.dataTransfer.files);
        }}
        onDragOver={(event) => event.preventDefault()}
        className="rounded-lg border-2 border-dashed border-slate-300 bg-white/60 p-4 text-center"
      >
        <Upload className="mx-auto mb-1 size-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Drop images here on desktop, or choose an option below.</p>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={uploadInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {processing && <p className="text-xs font-medium text-muted-foreground">Preparing photo...</p>}
      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {pending.map((file, index) => <PreviewThumb key={`${file.name}-${index}`} file={file} onRemove={() => setPending((current) => current.filter((_, itemIndex) => itemIndex !== index))} />)}
          </div>
          <Button type="button" size="sm" className="w-full" onClick={upload} disabled={uploading}>
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            Upload {pending.length} Image{pending.length === 1 ? "" : "s"}
          </Button>
        </div>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" size="sm" className="w-full bg-white/70" onClick={() => cameraInputRef.current?.click()} disabled={processing || uploading}>
          <Camera className="size-4" />
          Use Camera
        </Button>
        <Button type="button" variant="outline" size="sm" className="w-full bg-white/70" onClick={() => uploadInputRef.current?.click()} disabled={processing || uploading}>
          <ImageIcon className="size-4" />
          Upload Photo
        </Button>
      </div>
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this {label.toLowerCase()} photo from the quotation item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={remove}>
              {deleting ? "Deleting..." : "Delete Photo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ImagePreviewDialog
        image={previewTarget}
        deleting={deleting}
        onOpenChange={(open) => !open && setPreviewTarget(null)}
        onDelete={(image) => {
          setPreviewTarget(null);
          setDeleteTarget(image);
        }}
      />
    </div>
  );
}

async function prepareImageForUpload(file: File): Promise<File> {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    closeImage(image);
    return file;
  }

  context.drawImage(image, 0, 0, width, height);
  closeImage(image);

  for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42]) {
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (blob.size <= TARGET_UPLOAD_BYTES || quality === 0.52) {
      return new File([blob], jpegFileName(file.name), {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }
  }

  return file;
}

async function loadImage(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const image = new window.Image();
    const src = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(src);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error("Unable to read image."));
    };
    image.src = src;
  });
}

function closeImage(image: CanvasImageSource) {
  if ("close" in image && typeof image.close === "function") {
    image.close();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Unable to prepare image."));
      }
    }, type, quality);
  });
}

function jpegFileName(name: string) {
  const baseName = name.replace(/\.[^.]+$/, "") || "photo";
  return `${baseName}.jpg`;
}

function apiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const firstError = error.errors ? Object.values(error.errors)[0] : null;
    if (Array.isArray(firstError)) return firstError[0] ?? error.message;
    if (typeof firstError === "string") return firstError;
    return error.message;
  }

  return "Unable to upload images. Please try again.";
}

function SavedThumb({ image, onPreview }: { image: CustomerQuotationItemImage; onPreview: (image: CustomerQuotationItemImage) => void }) {
  const src = normalizeAssetUrl(image.image_url ?? image.url ?? "");
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border bg-white">
      {src && <Image src={src} alt={image.caption ?? "Quotation image"} fill unoptimized className="object-cover" />}
      <button type="button" onClick={() => onPreview(image)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
        <Maximize2 className="size-5 text-white" />
      </button>
    </div>
  );
}

function ImagePreviewDialog({
  image,
  deleting,
  onOpenChange,
  onDelete,
}: {
  image: CustomerQuotationItemImage | null;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (image: CustomerQuotationItemImage) => void;
}) {
  const src = normalizeAssetUrl(image?.image_url ?? image?.url ?? "");
  const canDelete = image?.can_delete === true;

  return (
    <Dialog open={Boolean(image)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">{image?.caption ?? "Photo preview"}</DialogTitle>
        </DialogHeader>
        {src && (
          <div className="relative h-[75vh] max-h-[760px] overflow-hidden rounded-lg bg-slate-950">
            <Image src={src} alt={image?.caption ?? "Quotation image"} fill unoptimized className="object-contain" />
          </div>
        )}
        {canDelete && (
          <DialogFooter>
            <Button type="button" variant="destructive" onClick={() => image && onDelete(image)} disabled={deleting}>
              <Trash2 className="size-4" />
              Delete Photo
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
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
