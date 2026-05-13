import { useRef, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
    Camera,
    Upload,
    X,
    Loader2,
    ImageIcon,
    Trash2,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuotationItemImage {
    id: number;
    url: string;
    type: 'before' | 'after';
    sort_order: number;
    caption: string | null;
}

interface Props {
    quotationItemId: number;
    images: {
        before: QuotationItemImage[];
        after: QuotationItemImage[];
    };
}

type ImageType = 'before' | 'after';

// ─── Camera Modal ─────────────────────────────────────────────────────────────

function CameraModal({
    onCapture,
    onClose,
}: {
    onCapture: (file: File) => void;
    onClose: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [ready, setReady] = useState(false);
    const [captured, setCaptured] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => setReady(true);
            }
        } catch {
            setError('Camera access denied or unavailable.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
    }, []);

    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCaptured(dataUrl);
        stopCamera();
    }, [stopCamera]);

    const handleUse = useCallback(() => {
        if (!captured || !canvasRef.current) return;
        canvasRef.current.toBlob(
            (blob) => {
                if (!blob) return;
                const file = new File([blob], `camera-${Date.now()}.jpg`, {
                    type: 'image/jpeg',
                });
                onCapture(file);
                onClose();
            },
            'image/jpeg',
            0.92,
        );
    }, [captured, onCapture, onClose]);

    const handleRetake = useCallback(() => {
        setCaptured(null);
        startCamera();
    }, [startCamera]);

    // Start camera on mount
    useState(() => {
        startCamera();
        return () => stopCamera();
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-xl bg-neutral-900 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Camera className="h-4 w-4" /> Take Photo
                    </span>
                    <button
                        onClick={() => {
                            stopCamera();
                            onClose();
                        }}
                        className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Viewfinder */}
                <div className="relative aspect-[4/3] w-full bg-black">
                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
                            <Camera className="h-10 w-10" />
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : captured ? (
                        <img
                            src={captured}
                            alt="Captured"
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="h-full w-full object-cover"
                            />
                            {!ready && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                                </div>
                            )}
                        </>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-4">
                    {captured ? (
                        <>
                            <button
                                onClick={handleRetake}
                                className="flex-1 rounded-lg border border-white/20 py-2 text-sm text-white transition hover:bg-white/10"
                            >
                                Retake
                            </button>
                            <button
                                onClick={handleUse}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                            >
                                <CheckCircle2 className="h-4 w-4" /> Use Photo
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleCapture}
                            disabled={!ready || !!error}
                            className="flex-1 rounded-lg bg-white py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-40"
                        >
                            Capture
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Preview Thumbnail ────────────────────────────────────────────────────────

function PreviewThumb({
    file,
    onRemove,
}: {
    file: File;
    onRemove: () => void;
}) {
    const [src] = useState(() => URL.createObjectURL(file));
    return (
        <div className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
            <img
                src={src}
                alt={file.name}
                className="h-full w-full object-cover"
            />
            <button
                type="button"
                onClick={onRemove}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
            >
                <X className="h-5 w-5 text-white" />
            </button>
        </div>
    );
}

// ─── Saved Image Thumbnail ────────────────────────────────────────────────────

function SavedThumb({
    image,
    onDelete,
}: {
    image: QuotationItemImage;
    onDelete: (id: number) => void;
}) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        if (!confirm('Delete this image?')) return;
        setDeleting(true);
        router.delete(`/quotation-item-images/${image.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(false),
        });
        onDelete(image.id);
    };

    return (
        <div className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
            <img
                src={image.url}
                alt={image.caption ?? 'Image'}
                className="h-full w-full object-cover"
            />
            {image.caption && (
                <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-[10px] text-white">
                    {image.caption}
                </div>
            )}
            <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
            >
                {deleting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                    <Trash2 className="h-5 w-5 text-white" />
                )}
            </button>
        </div>
    );
}

// ─── Upload Panel ─────────────────────────────────────────────────────────────

function UploadPanel({
    quotationItemId,
    type,
    saved,
    onSavedDelete,
}: {
    quotationItemId: number;
    type: ImageType;
    saved: QuotationItemImage[];
    onSavedDelete: (id: number) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);

    const addFiles = (files: FileList | File[]) => {
        const arr = Array.from(files).filter((f) =>
            ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
                f.type,
            ),
        );
        setPendingFiles((prev) => {
            const combined = [...prev, ...arr];
            return combined.slice(0, 10); // max 10
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(e.target.files);
        e.target.value = '';
    };

    const handleCameraCapture = (file: File) => {
        setPendingFiles((prev) => [...prev, file].slice(0, 10));
    };

    const handleUpload = () => {
        if (!pendingFiles.length) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('type', type);
        if (caption) formData.append('caption', caption);
        pendingFiles.forEach((f) => formData.append('images[]', f));

        router.post(`/quotation-items/${quotationItemId}/images`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setPendingFiles([]);
                setCaption('');
            },
            onFinish: () => setUploading(false),
        });
    };

    const label = type === 'before' ? 'Before' : 'After';
    const color =
        type === 'before'
            ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
            : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800';
    const badge =
        type === 'before'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';

    return (
        <div className={`space-y-3 rounded-xl border p-4 ${color}`}>
            {/* Label */}
            <div className="flex items-center gap-2">
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}
                >
                    {label}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {saved.length} saved
                </span>
            </div>

            {/* Saved images grid */}
            {saved.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {saved.map((img) => (
                        <SavedThumb
                            key={img.id}
                            image={img}
                            onDelete={onSavedDelete}
                        />
                    ))}
                </div>
            )}

            {/* Drop zone */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="cursor-pointer rounded-lg border-2 border-dashed border-neutral-300 p-4 text-center transition hover:border-blue-400 dark:border-neutral-600 dark:hover:border-blue-500"
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className="mx-auto mb-1 h-5 w-5 text-neutral-400" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Drop images here or{' '}
                    <span className="font-medium text-blue-500">browse</span>
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-400">
                    JPEG, PNG, WebP · max 5 MB each · up to 10
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {/* Camera button */}
            <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
                <Camera className="h-4 w-4" /> Take Photo
            </button>

            {/* Pending previews */}
            {pendingFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        Ready to upload ({pendingFiles.length})
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {pendingFiles.map((f, i) => (
                            <PreviewThumb
                                key={i}
                                file={f}
                                onRemove={() =>
                                    setPendingFiles((prev) =>
                                        prev.filter((_, j) => j !== i),
                                    )
                                }
                            />
                        ))}
                    </div>

                    {/* Caption */}
                    <input
                        type="text"
                        placeholder="Caption (optional)"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800"
                    />

                    {/* Upload button */}
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />{' '}
                                Uploading…
                            </>
                        ) : (
                            <>
                                <Upload className="h-3.5 w-3.5" /> Upload{' '}
                                {pendingFiles.length} Image
                                {pendingFiles.length !== 1 ? 's' : ''}
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Camera modal */}
            {cameraOpen && (
                <CameraModal
                    onCapture={handleCameraCapture}
                    onClose={() => setCameraOpen(false)}
                />
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuotationItemImages({
    quotationItemId,
    images: initialImages,
}: Props) {
    const [images, setImages] = useState(initialImages);
    const [collapsed, setCollapsed] = useState(false);

    const handleSavedDelete = (type: ImageType, id: number) => {
        setImages((prev) => ({
            ...prev,
            [type]: prev[type].filter((img) => img.id !== id),
        }));
    };

    const totalCount = images.before.length + images.after.length;

    return (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            {/* Header */}
            <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
                <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        Item Photos
                    </span>
                    {totalCount > 0 && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                            {totalCount}
                        </span>
                    )}
                </div>
                {collapsed ? (
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                ) : (
                    <ChevronUp className="h-4 w-4 text-neutral-400" />
                )}
            </button>

            {/* Body */}
            {!collapsed && (
                <div className="space-y-3 border-t border-neutral-100 px-4 pt-3 pb-4 dark:border-neutral-800">
                    <UploadPanel
                        quotationItemId={quotationItemId}
                        type="before"
                        saved={images.before}
                        onSavedDelete={(id) => handleSavedDelete('before', id)}
                    />
                    <UploadPanel
                        quotationItemId={quotationItemId}
                        type="after"
                        saved={images.after}
                        onSavedDelete={(id) => handleSavedDelete('after', id)}
                    />
                </div>
            )}
        </div>
    );
}
