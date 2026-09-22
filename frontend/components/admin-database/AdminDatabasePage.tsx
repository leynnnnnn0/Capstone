"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Database as DatabaseIcon,
  Download,
  FileArchive,
  KeyRound,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createDatabaseBackup,
  downloadDatabaseBackup,
  fetchDatabaseBackups,
  restoreDatabaseBackup,
} from "@/features/database/database-api";
import type { DatabaseBackup } from "@/features/database/types";
import {
  confirmPassword,
  fetchPasswordConfirmationStatus,
} from "@/features/settings/settings-api";
import { ApiError } from "@/lib/api";

export default function AdminDatabasePage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    fetchPasswordConfirmationStatus()
      .then((status) => setUnlocked(status.confirmed))
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to verify access.");
        setUnlocked(false);
      });
  }, []);

  if (unlocked === null) {
    return <DatabaseLoading />;
  }

  if (!unlocked) {
    return <DatabasePasswordGate onConfirmed={() => setUnlocked(true)} />;
  }

  return <DatabaseManager onPasswordExpired={() => setUnlocked(false)} />;
}

function DatabaseManager({ onPasswordExpired }: { onPasswordExpired: () => void }) {
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [selected, setSelected] = useState<DatabaseBackup | null>(null);
  const [confirmation, setConfirmation] = useState("");

  const handleError = useCallback((error: unknown, fallback: string) => {
    if (error instanceof ApiError && error.status === 423) {
      onPasswordExpired();
      toast.error("Please confirm your password again to continue.");
      return;
    }

    toast.error(error instanceof Error ? error.message : fallback);
  }, [onPasswordExpired]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchDatabaseBackups();
      setBackups(response.data);
    } catch (error) {
      handleError(error, "Unable to load database backups.");
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function createBackup() {
    setCreating(true);
    try {
      const response = await createDatabaseBackup();
      toast.success(response.message);
      await load();
    } catch (error) {
      handleError(error, "Unable to create the database backup.");
    } finally {
      setCreating(false);
    }
  }

  async function downloadBackup(backup: DatabaseBackup) {
    setDownloading(backup.id);
    try {
      await downloadDatabaseBackup(backup.id);
      toast.success("Backup download started.");
    } catch (error) {
      handleError(error, "Unable to download the backup.");
    } finally {
      setDownloading(null);
    }
  }

  async function restoreBackup() {
    if (!selected || confirmation !== "RESTORE") return;

    setRestoring(true);
    try {
      const response = await restoreDatabaseBackup(selected.id);
      toast.success(`${response.message} A safety backup was created first.`);
      setSelected(null);
      setConfirmation("");
      await load();
    } catch (error) {
      handleError(error, "Unable to restore the database.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-white/10 bg-[#162d4a] p-5 text-white shadow-[0_18px_55px_rgba(22,45,74,0.12)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9cfe0]">System administration</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">Database</h1>
            <p className="mt-1 text-sm text-white/55">Create secure snapshots and restore the system from an earlier backup.</p>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={createBackup}
            disabled={creating || restoring}
            className="bg-white text-[#162d4a] hover:bg-white/90"
          >
            {creating ? <Loader2 className="size-4 animate-spin" /> : <DatabaseIcon className="size-4" />}
            {creating ? "Creating backup…" : "Back up now"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Available backups</CardTitle>
            <CardDescription>Backups are kept in private server storage. The newest 20 snapshots are retained.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={load} disabled={loading || restoring} aria-label="Refresh backups">
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-muted/60" />)}
            </div>
          ) : backups.length ? (
            <div className="divide-y rounded-xl border">
              {backups.map((backup) => (
                <div key={backup.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e9f0f5] text-[#264d6b]">
                      <FileArchive className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[#162d4a]">{backup.filename}</p>
                        {backup.reason === "pre_restore" && <Badge variant="outline">Safety backup</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(backup.created_at)} · {formatBytes(backup.size)} · {backup.driver.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 pl-[3.25rem] sm:pl-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => downloadBackup(backup)} disabled={downloading === backup.id || restoring}>
                      {downloading === backup.id ? <Loader2 className="animate-spin" /> : <Download />}
                      Download
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => { setSelected(backup); setConfirmation(""); }} disabled={restoring}>
                      <RotateCcw />
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-6 py-12 text-center">
              <DatabaseIcon className="mx-auto size-9 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">No backups yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Create your first snapshot before making major system changes.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(selected)} onOpenChange={(open) => { if (!open && !restoring) { setSelected(null); setConfirmation(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <TriangleAlert className="size-5" />
            </div>
            <AlertDialogTitle>Restore this database backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Current data will be replaced with the contents of <span className="font-medium text-foreground">{selected?.filename}</span>. A safety backup of the current database will be created automatically first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label htmlFor="restore-confirmation" className="text-sm font-medium">Type RESTORE to continue</label>
            <Input
              id="restore-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              disabled={restoring}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={restoreBackup} disabled={confirmation !== "RESTORE" || restoring}>
              {restoring ? <Loader2 className="animate-spin" /> : <RotateCcw />}
              {restoring ? "Restoring…" : "Restore database"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DatabasePasswordGate({ onConfirmed }: { onConfirmed: () => void }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!password) return;
    setSaving(true);
    setError("");

    try {
      await confirmPassword(password);
      toast.success("Database tools unlocked.");
      onConfirmed();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to confirm your password.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl items-center">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><KeyRound className="size-5" /></div>
          <CardTitle className="text-lg">Confirm your password</CardTitle>
          <CardDescription>Database backups can contain sensitive records, and restoring replaces live data. Confirm your password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <div className="space-y-2">
              <label htmlFor="database-password" className="text-sm font-medium">Password</label>
              <Input id="database-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus autoComplete="current-password" />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button type="submit" disabled={saving || !password}>
              {saving ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
              Unlock database tools
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DatabaseLoading() {
  return <div className="space-y-4"><div className="h-36 animate-pulse rounded-[1.5rem] bg-[#162d4a]/15" /><div className="h-72 animate-pulse rounded-xl bg-muted" /></div>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; value >= 1024 && index < units.length; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
