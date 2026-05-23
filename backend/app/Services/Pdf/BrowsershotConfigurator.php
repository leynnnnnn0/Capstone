<?php

namespace App\Services\Pdf;

use Spatie\Browsershot\Browsershot;

class BrowsershotConfigurator
{
    public function configure(Browsershot $browsershot): Browsershot
    {
        $browsershot
            ->setNodeModulePath(base_path('node_modules'))
            ->noSandbox();

        if ($chromePath = $this->chromePath()) {
            $browsershot->setChromePath($chromePath);
        }

        return $browsershot;
    }

    private function chromePath(): ?string
    {
        $candidates = [
            env('BROWSERSHOT_CHROME_PATH'),
            env('PUPPETEER_EXECUTABLE_PATH'),
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && $candidate !== '' && is_file($candidate)) {
                return $candidate;
            }
        }

        return null;
    }
}
