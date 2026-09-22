<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\Process\Process;
use Throwable;

class DatabaseBackupService
{
    public function all(): array
    {
        $directory = $this->directory();

        return collect(File::files($directory))
            ->filter(fn ($file) => preg_match('/\Asog-backup-\d{8}-\d{6}-[a-f0-9]{8}\.(sql|sqlite)\z/', $file->getFilename()))
            ->map(fn ($file) => $this->serialize($file->getFilename()))
            ->sortByDesc('created_at')
            ->values()
            ->all();
    }

    public function create(string $reason = 'manual'): array
    {
        return $this->locked(fn () => $this->createUnlocked($reason));
    }

    public function restore(string $filename): void
    {
        $this->locked(fn () => $this->restoreUnlocked($filename));
    }

    public function restoreWithSafetyBackup(string $filename): array
    {
        return $this->locked(function () use ($filename) {
            $this->path($filename);
            $safetyBackup = $this->createUnlocked('pre_restore', $filename);
            $this->restoreUnlocked($filename);

            return $safetyBackup;
        });
    }

    public function path(string $filename): string
    {
        if ($filename !== basename($filename)
            || ! preg_match('/\Asog-backup-\d{8}-\d{6}-[a-f0-9]{8}\.(sql|sqlite)\z/', $filename)) {
            throw new RuntimeException('The selected backup is invalid.');
        }

        $path = $this->directory().DIRECTORY_SEPARATOR.$filename;

        if (! File::isFile($path)) {
            throw new RuntimeException('The selected backup no longer exists.');
        }

        return $path;
    }

    private function dumpMysql(string $path): void
    {
        $config = DB::connection()->getConfig();
        $command = [
            (string) config('database-backups.binaries.mysqldump'),
            '--host='.(string) ($config['host'] ?? '127.0.0.1'),
            '--port='.(string) ($config['port'] ?? 3306),
            '--user='.(string) ($config['username'] ?? ''),
            '--single-transaction',
            '--routines',
            '--triggers',
            '--events',
            '--no-tablespaces',
            '--result-file='.$path,
        ];

        if (! empty($config['unix_socket'])) {
            $command[] = '--socket='.(string) $config['unix_socket'];
        }

        $command[] = (string) $config['database'];
        $this->run($command, (string) ($config['password'] ?? ''));
    }

    private function restoreMysql(string $path): void
    {
        if (pathinfo($path, PATHINFO_EXTENSION) !== 'sql') {
            throw new RuntimeException('This backup is not compatible with the current database driver.');
        }

        $config = DB::connection()->getConfig();
        $command = [
            (string) config('database-backups.binaries.mysql'),
            '--host='.(string) ($config['host'] ?? '127.0.0.1'),
            '--port='.(string) ($config['port'] ?? 3306),
            '--user='.(string) ($config['username'] ?? ''),
            '--binary-mode',
        ];

        if (! empty($config['unix_socket'])) {
            $command[] = '--socket='.(string) $config['unix_socket'];
        }

        $command[] = (string) $config['database'];
        $input = fopen($path, 'rb');

        if ($input === false) {
            throw new RuntimeException('The backup file could not be opened.');
        }

        try {
            $this->run($command, (string) ($config['password'] ?? ''), $input);
        } finally {
            fclose($input);
        }

        DB::purge();
    }

    private function dumpSqlite(string $path): void
    {
        $database = (string) DB::connection()->getDatabaseName();

        if ($database === ':memory:') {
            throw new RuntimeException('In-memory SQLite databases cannot be backed up.');
        }

        DB::connection()->getPdo()->exec('VACUUM INTO '.DB::connection()->getPdo()->quote($path));
    }

    private function restoreSqlite(string $path): void
    {
        if (pathinfo($path, PATHINFO_EXTENSION) !== 'sqlite') {
            throw new RuntimeException('This backup is not compatible with the current database driver.');
        }

        $connection = DB::getDefaultConnection();
        $database = (string) DB::connection($connection)->getDatabaseName();

        if ($database === ':memory:') {
            throw new RuntimeException('In-memory SQLite databases cannot be restored.');
        }

        DB::purge($connection);

        if (! File::copy($path, $database)) {
            throw new RuntimeException('The SQLite database could not be restored.');
        }

        DB::reconnect($connection);
    }

    private function run(array $command, string $password, mixed $input = null): void
    {
        $process = new Process($command, null, ['MYSQL_PWD' => $password]);
        $process->setTimeout((int) config('database-backups.timeout', 300));

        if ($input !== null) {
            $process->setInput($input);
        }

        $process->run();

        if (! $process->isSuccessful()) {
            $message = trim($process->getErrorOutput()) ?: 'The database command failed.';
            throw new RuntimeException($message);
        }
    }

    private function serialize(string $filename): array
    {
        $path = $this->path($filename);
        $metadata = File::exists($this->metadataPath($filename))
            ? json_decode((string) File::get($this->metadataPath($filename)), true) ?? []
            : [];

        return [
            'id' => $filename,
            'filename' => $filename,
            'size' => File::size($path),
            'driver' => $metadata['driver'] ?? pathinfo($filename, PATHINFO_EXTENSION),
            'reason' => $metadata['reason'] ?? 'manual',
            'created_at' => $metadata['created_at'] ?? date(DATE_ATOM, File::lastModified($path)),
        ];
    }

    private function writeMetadata(string $filename, string $reason, string $driver): void
    {
        File::put($this->metadataPath($filename), json_encode([
            'reason' => $reason,
            'driver' => $driver,
            'created_at' => now()->toAtomString(),
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    private function createUnlocked(string $reason, ?string $protectedFilename = null): array
    {
        $driver = DB::connection()->getDriverName();
        $extension = $driver === 'sqlite' ? 'sqlite' : 'sql';
        $filename = 'sog-backup-'.now()->format('Ymd-His').'-'.bin2hex(random_bytes(4)).'.'.$extension;
        $path = $this->directory().DIRECTORY_SEPARATOR.$filename;

        try {
            match ($driver) {
                'mysql', 'mariadb' => $this->dumpMysql($path),
                'sqlite' => $this->dumpSqlite($path),
                default => throw new RuntimeException("Database backups are not supported for the {$driver} driver."),
            };

            $this->writeMetadata($filename, $reason, $driver);
            $this->prune($protectedFilename);

            return $this->serialize($filename);
        } catch (Throwable $exception) {
            File::delete($path, $this->metadataPath($filename));
            throw $exception;
        }
    }

    private function restoreUnlocked(string $filename): void
    {
        $path = $this->path($filename);
        $driver = DB::connection()->getDriverName();

        match ($driver) {
            'mysql', 'mariadb' => $this->restoreMysql($path),
            'sqlite' => $this->restoreSqlite($path),
            default => throw new RuntimeException("Database restores are not supported for the {$driver} driver."),
        };
    }

    private function prune(?string $protectedFilename = null): void
    {
        $retention = max(1, (int) config('database-backups.retention', 20));
        $expired = collect($this->all())
            ->reject(fn (array $backup) => $backup['id'] === $protectedFilename)
            ->slice($retention)
            ->all();

        foreach ($expired as $backup) {
            File::delete($this->path($backup['id']), $this->metadataPath($backup['id']));
        }
    }

    private function locked(callable $callback): mixed
    {
        $handle = fopen($this->directory().DIRECTORY_SEPARATOR.'.database-backup.lock', 'c');

        if ($handle === false || ! flock($handle, LOCK_EX | LOCK_NB)) {
            throw new RuntimeException('Another database backup or restore is already running.');
        }

        try {
            return $callback();
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    private function directory(): string
    {
        $directory = Storage::disk('local')->path((string) config('database-backups.directory'));
        File::ensureDirectoryExists($directory);

        return $directory;
    }

    private function metadataPath(string $filename): string
    {
        return $this->directory().DIRECTORY_SEPARATOR.$filename.'.json';
    }
}
