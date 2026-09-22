<?php

return [
    'directory' => env('DATABASE_BACKUP_DIRECTORY', 'database-backups'),
    'retention' => (int) env('DATABASE_BACKUP_RETENTION', 20),
    'timeout' => (int) env('DATABASE_BACKUP_TIMEOUT', 300),
    'binaries' => [
        'mysqldump' => env('MYSQLDUMP_PATH', 'mysqldump'),
        'mysql' => env('MYSQL_PATH', 'mysql'),
    ],
];
