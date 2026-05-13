import { useState, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    FileText,
    Package,
    Layers,
    StickyNote,
    Calculator,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    ThumbsUp,
    Loader2,
    Download,
    Images,
    Camera,
    Upload,
    X,
    Trash2,
    ImageIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ItemStatus =
    | 'for_acceptance'
    | 'approved'
    | 'rejected'
    | 'revision_needed'
    | 'on_hold';

interface QuotationItemOption {
    id: number;
    group_name: string;
    option_name: string;
    price_modifier: number | string;
}

interface QuotationItemImage {
    id: number;
    url: string;
    type: 'before' | 'after';
    sort_order: number;
    caption: string | null;
}

interface QuotationItem {
    id: number;
    name: string;
    description: string | null;
    width: number | null;
    height: number | null;
    thickness: number | null;
    pieces: number;
    amount_per_piece: number | string;
    options_amount: number | string;
    total_amount: number | string;
    notes: string | null;
    status: ItemStatus;
    quotation_item_options: QuotationItemOption[];
    images: {
        before: QuotationItemImage[];
        after: QuotationItemImage[];
    };
}

interface Quotation {
    id: number;
    notes: string | null;
    created_at: string;
    quotation_items: QuotationItem[];
}

interface Props {
    quotation: Quotation;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | string) =>
    parseFloat(String(n) || '0').toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const APPROVED_STATUS: ItemStatus = 'approved';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    ItemStatus,
    {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: React.ReactNode;
        className?: string;
    }
> = {
    for_acceptance: {
        label: 'For Acceptance',
        variant: 'secondary',
        icon: <Clock className="h-3 w-3" />,
    },
    approved: {
        label: 'Approved',
        variant: 'default',
        icon: <CheckCircle2 className="h-3 w-3" />,
        className:
            'bg-green-600 hover:bg-green-700 text-white border-green-600',
    },
    rejected: {
        label: 'Rejected',
        variant: 'destructive',
        icon: <XCircle className="h-3 w-3" />,
    },
    revision_needed: {
        label: 'Revision Needed',
        variant: 'outline',
        icon: <AlertCircle className="h-3 w-3" />,
        className: 'border-amber-500 text-amber-600',
    },
    on_hold: {
        label: 'On Hold',
        variant: 'outline',
        icon: <ThumbsUp className="h-3 w-3 rotate-90" />,
        className: 'border-slate-400 text-slate-500',
    },
};

const ALL_STATUSES: ItemStatus[] = [
    'for_acceptance',
    'approved',
    'rejected',
    'revision_needed',
    'on_hold',
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ItemStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <Badge
            variant={cfg.variant}
            className={`flex items-center gap-1 text-[10px] ${cfg.className ?? ''}`}
        >
            {cfg.icon}
            {cfg.label}
        </Badge>
    );
}

// ─── Inline Status Selector ───────────────────────────────────────────────────

function ItemStatusSelector({
    itemId,
    currentStatus,
    onStatusChange,
    saving,
}: {
    itemId: number;
    currentStatus: ItemStatus;
    onStatusChange: (itemId: number, status: ItemStatus) => void;
    saving: boolean;
}) {
    return (
        <div className="flex items-center gap-1.5">
            {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : null}
            <Select
                value={currentStatus}
                onValueChange={(v) => onStatusChange(itemId, v as ItemStatus)}
                disabled={saving}
            >
                <SelectTrigger className="h-7 w-auto min-w-[140px] border-dashed text-xs">
                    <div className="flex items-center gap-1.5">
                        {STATUS_CONFIG[currentStatus].icon}
                        <span>{STATUS_CONFIG[currentStatus].label}</span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {ALL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                            <div className="flex items-center gap-2">
                                <span
                                    className={
                                        s === 'approved'
                                            ? 'text-green-600'
                                            : s === 'rejected'
                                              ? 'text-destructive'
                                              : s === 'revision_needed'
                                                ? 'text-amber-600'
                                                : 'text-muted-foreground'
                                    }
                                >
                                    {STATUS_CONFIG[s].icon}
                                </span>
                                {STATUS_CONFIG[s].label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// ─── Camera Modal ─────────────────────────────────────────────────────────────

function CameraCapture({
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
        setCaptured(canvas.toDataURL('image/jpeg', 0.92));
        stopCamera();
    }, [stopCamera]);

    const handleUse = useCallback(() => {
        if (!canvasRef.current) return;
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
    }, [onCapture, onClose]);

    // Start camera on mount
    useState(() => {
        startCamera();
        return () => stopCamera();
    });

    return (
        <div className="overflow-hidden rounded-lg border bg-black">
            <div className="relative aspect-[4/3] w-full bg-black">
                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
                        <Camera className="h-8 w-8" />
                        <p className="text-xs">{error}</p>
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
                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                        )}
                    </>
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2 bg-neutral-900 p-3">
                {captured ? (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setCaptured(null);
                                startCamera();
                            }}
                            className="flex-1 border-white/20 text-white hover:bg-white/10 hover:text-white"
                        >
                            Retake
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleUse}
                            className="flex-1 gap-1.5 bg-blue-600 hover:bg-blue-500"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Use Photo
                        </Button>
                    </>
                ) : (
                    <Button
                        size="sm"
                        onClick={handleCapture}
                        disabled={!ready || !!error}
                        className="flex-1 bg-white text-neutral-900 hover:bg-neutral-200"
                    >
                        Capture
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── Saved Thumbnail ──────────────────────────────────────────────────────────

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
        <div className="group relative aspect-square overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
            <img
                src={image.url}
                alt={image.caption ?? 'Image'}
                className="h-full w-full object-cover"
            />
            {image.caption && (
                <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
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
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                    <Trash2 className="h-4 w-4 text-white" />
                )}
            </button>
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
        <div className="group relative aspect-square overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
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
                <X className="h-4 w-4 text-white" />
            </button>
        </div>
    );
}

// ─── Upload Section (inside dialog, no tabs) ──────────────────────────────────

function ImageSection({
    quotationItemId,
    type,
    saved,
    onSavedDelete,
}: {
    quotationItemId: number;
    type: 'before' | 'after';
    saved: QuotationItemImage[];
    onSavedDelete: (id: number) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    const addFiles = (files: FileList | File[]) => {
        const arr = Array.from(files).filter((f) =>
            ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
                f.type,
            ),
        );
        setPendingFiles((prev) => [...prev, ...arr].slice(0, 10));
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

    const isAfter = type === 'after';
    const accentClass = isAfter
        ? 'text-primary-600 dark:text-primary-400'
        : 'text-amber-600 dark:text-amber-400';
    const badgeClass = isAfter
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800';

    return (
        <div className="space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-2">
                <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold`}
                >
                    {isAfter ? 'After' : 'Before'}
                </span>
                <span className="text-xs text-muted-foreground">
                    {saved.length} photo{saved.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Saved grid */}
            {saved.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5">
                    {saved.map((img) => (
                        <SavedThumb
                            key={img.id}
                            image={img}
                            onDelete={onSavedDelete}
                        />
                    ))}
                </div>
            )}

            {/* Camera capture */}
            {showCamera ? (
                <div className="space-y-2">
                    <CameraCapture
                        onCapture={(file) => {
                            setPendingFiles((prev) =>
                                [...prev, file].slice(0, 10),
                            );
                            setShowCamera(false);
                        }}
                        onClose={() => setShowCamera(false)}
                    />
                </div>
            ) : (
                <div className="flex gap-2">
                    {/* Drop zone */}
                    <div
                        onDrop={(e) => {
                            e.preventDefault();
                            addFiles(e.dataTransfer.files);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-200 py-4 text-center transition hover:border-blue-400 dark:border-neutral-700 dark:hover:border-blue-500"
                    >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <p className="text-[11px] text-muted-foreground">
                            Drop or{' '}
                            <span className="font-medium text-blue-500">
                                browse
                            </span>
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files) addFiles(e.target.files);
                                e.target.value = '';
                            }}
                        />
                    </div>
                    {/* Camera button */}
                    <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex flex-col items-center justify-center gap-1 rounded-lg border border-neutral-200 px-4 py-4 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        <Camera className="h-4 w-4" />
                        <span className="text-[10px]">Camera</span>
                    </button>
                </div>
            )}

            {/* Pending queue */}
            {pendingFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground">
                        Ready to upload ({pendingFiles.length})
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
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
                    <input
                        type="text"
                        placeholder="Caption (optional)"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                    />
                    <Button
                        size="sm"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full gap-1.5 text-xs"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />{' '}
                                Uploading…
                            </>
                        ) : (
                            <>
                                <Upload className="h-3 w-3" /> Upload{' '}
                                {pendingFiles.length} Image
                                {pendingFiles.length !== 1 ? 's' : ''}
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}

// ─── Item Photos Dialog ───────────────────────────────────────────────────────

function ItemPhotosDialog({
    item,
    open,
    onOpenChange,
}: {
    item: QuotationItem;
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const [images, setImages] = useState(item.images);
    const totalCount = images.before.length + images.after.length;

    const handleDelete = (type: 'before' | 'after', id: number) => {
        setImages((prev) => ({
            ...prev,
            [type]: prev[type].filter((img) => img.id !== id),
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-sm">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        {item.name}
                        {totalCount > 0 && (
                            <Badge variant="secondary" className="text-[10px]">
                                {totalCount} photo{totalCount !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pt-1">
                    {/* Before */}
                    <ImageSection
                        quotationItemId={item.id}
                        type="before"
                        saved={images.before}
                        onSavedDelete={(id) => handleDelete('before', id)}
                    />

                    <Separator />

                    {/* After */}
                    <ImageSection
                        quotationItemId={item.id}
                        type="after"
                        saved={images.after}
                        onSavedDelete={(id) => handleDelete('after', id)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuotationDetails({ quotation }: Props) {
    const [itemStatuses, setItemStatuses] = useState<
        Record<number, ItemStatus>
    >(() =>
        Object.fromEntries(
            quotation.quotation_items.map((item) => [
                item.id,
                item.status as ItemStatus,
            ]),
        ),
    );
    const [savingId, setSavingId] = useState<number | null>(null);
    const [photoDialogItemId, setPhotoDialogItemId] = useState<number | null>(
        null,
    );

    const handleStatusChange = (itemId: number, newStatus: ItemStatus) => {
        setItemStatuses((prev) => ({ ...prev, [itemId]: newStatus }));
        setSavingId(itemId);

        router.patch(
            `/quotation-items/${itemId}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => setSavingId(null),
                onError: () => {
                    setItemStatuses((prev) => ({
                        ...prev,
                        [itemId]: quotation.quotation_items.find(
                            (i) => i.id === itemId,
                        )?.status as ItemStatus,
                    }));
                    setSavingId(null);
                },
            },
        );
    };

    const approvedTotal = quotation.quotation_items.reduce((sum, item) => {
        const status = itemStatuses[item.id];
        return status === APPROVED_STATUS
            ? sum + parseFloat(String(item.total_amount) || '0')
            : sum;
    }, 0);

    const allTotal = quotation.quotation_items.reduce(
        (sum, item) => sum + parseFloat(String(item.total_amount) || '0'),
        0,
    );

    const approvedCount = quotation.quotation_items.filter(
        (item) => itemStatuses[item.id] === APPROVED_STATUS,
    ).length;

    const activeDialogItem =
        quotation.quotation_items.find((i) => i.id === photoDialogItemId) ??
        null;

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <CardTitle className="text-base">
                                Quotation
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <a
                                href={`/quotations/${quotation.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1.5 text-xs"
                                >
                                    <Download className="h-3 w-3" />
                                    PDF
                                </Button>
                            </a>
                            {approvedCount > 0 && (
                                <Badge
                                    variant="default"
                                    className="bg-green-600 text-[10px] text-white hover:bg-green-700"
                                >
                                    {approvedCount} approved
                                </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                                {quotation.quotation_items.length} item
                                {quotation.quotation_items.length !== 1
                                    ? 's'
                                    : ''}
                            </Badge>
                        </div>
                    </div>
                    <CardDescription className="text-xs">
                        Created{' '}
                        {new Date(quotation.created_at).toLocaleDateString(
                            'en-PH',
                            {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            },
                        )}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {quotation.notes && (
                        <div className="rounded-lg bg-muted/40 p-3">
                            <div className="mb-1.5 flex items-center gap-1.5">
                                <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                    Notes
                                </span>
                            </div>
                            <p className="text-sm">{quotation.notes}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {quotation.quotation_items.map((item, idx) => {
                            const currentStatus =
                                itemStatuses[item.id] ?? item.status;
                            const isApproved =
                                currentStatus === APPROVED_STATUS;
                            const isSaving = savingId === item.id;
                            const photoCount =
                                (item.images?.before?.length ?? 0) +
                                (item.images?.after?.length ?? 0);

                            return (
                                <div
                                    key={item.id}
                                    className="rounded-lg border transition-colors"
                                >
                                    {/* Item Header */}
                                    <div className="flex items-start justify-between px-3 py-2.5">
                                        <div className="flex items-start gap-2.5">
                                            <div
                                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                                    isApproved
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                        : 'bg-primary/10 text-primary'
                                                }`}
                                            >
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm leading-tight font-semibold">
                                                    {item.name}
                                                </p>
                                                {item.description && (
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <div className="mt-1 flex flex-wrap gap-1.5">
                                                    {(item.width ||
                                                        item.height) && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px]"
                                                        >
                                                            {item.width} ×{' '}
                                                            {item.height} cm
                                                        </Badge>
                                                    )}
                                                    {item.thickness && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px]"
                                                        >
                                                            {item.thickness} mm
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px]"
                                                    >
                                                        {item.pieces} pc
                                                        {item.pieces !== 1
                                                            ? 's'
                                                            : ''}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-2 shrink-0 text-right">
                                            <p
                                                className={`text-sm font-bold ${
                                                    isApproved
                                                        ? 'text-green-700 dark:text-green-400'
                                                        : ''
                                                }`}
                                            >
                                                ₱{fmt(item.total_amount)}
                                            </p>
                                            {item.pieces > 1 && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    ₱
                                                    {fmt(item.amount_per_piece)}{' '}
                                                    × {item.pieces}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status + Photos Row */}
                                    <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
                                        <ItemStatusSelector
                                            itemId={item.id}
                                            currentStatus={
                                                currentStatus as ItemStatus
                                            }
                                            onStatusChange={handleStatusChange}
                                            saving={isSaving}
                                        />

                                        {/* Photos button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setPhotoDialogItemId(item.id)
                                            }
                                            className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                                        >
                                            <Images className="h-3.5 w-3.5" />
                                            Photos
                                            {photoCount > 0 && (
                                                <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                                                    {photoCount}
                                                </span>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Options */}
                                    {item.quotation_item_options.length > 0 && (
                                        <div className="border-t px-3 py-2">
                                            <div className="mb-1.5 flex items-center gap-1">
                                                <Layers className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                                    Material Options
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {item.quotation_item_options.map(
                                                    (opt) => (
                                                        <div
                                                            key={opt.id}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {
                                                                        opt.group_name
                                                                    }
                                                                    :
                                                                </span>
                                                                <span className="text-xs font-medium">
                                                                    {
                                                                        opt.option_name
                                                                    }
                                                                </span>
                                                            </div>
                                                            {Number(
                                                                opt.price_modifier,
                                                            ) > 0 ? (
                                                                <span className="text-xs font-medium text-green-600">
                                                                    +₱
                                                                    {fmt(
                                                                        opt.price_modifier,
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Included
                                                                </span>
                                                            )}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {parseFloat(String(item.options_amount)) >
                                        0 && (
                                        <div className="border-t bg-muted/30 px-3 py-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">
                                                    Base price
                                                </span>
                                                <span>
                                                    ₱
                                                    {fmt(item.amount_per_piece)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">
                                                    Options
                                                </span>
                                                <span className="text-green-600">
                                                    +₱{fmt(item.options_amount)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {item.notes && (
                                        <div className="border-t px-3 py-2">
                                            <p className="text-xs text-muted-foreground italic">
                                                {item.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {quotation.quotation_items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
                            <Package className="mb-2 h-8 w-8 opacity-30" />
                            <p>No items in this quotation.</p>
                        </div>
                    )}

                    {quotation.quotation_items.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>All items subtotal</span>
                                    <span>₱{fmt(allTotal)}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 dark:bg-green-950/20">
                                    <div className="flex items-center gap-1.5">
                                        <Calculator className="h-4 w-4" />
                                        <span className="text-sm font-semibold">
                                            Approved Total
                                        </span>
                                        <span className="text-[10px] text-green-600 dark:text-green-500">
                                            ({approvedCount} of{' '}
                                            {quotation.quotation_items.length}{' '}
                                            items)
                                        </span>
                                    </div>
                                    <span className="text-xl font-bold text-green-700 dark:text-green-400">
                                        ₱{fmt(approvedTotal)}
                                    </span>
                                </div>
                                {approvedCount === 0 && (
                                    <p className="text-center text-[11px] text-muted-foreground">
                                        No items approved yet — approve items
                                        above to calculate the total.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Photos Dialog */}
            {activeDialogItem && (
                <ItemPhotosDialog
                    item={activeDialogItem}
                    open={photoDialogItemId !== null}
                    onOpenChange={(v) => {
                        if (!v) setPhotoDialogItemId(null);
                    }}
                />
            )}
        </>
    );
}
