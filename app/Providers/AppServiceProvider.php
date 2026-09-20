<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\NotificationService;
use App\Services\FaceRecognitionService;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(NotificationService::class, function ($app) {
            return new NotificationService();
        });

        $this->app->singleton(FaceRecognitionService::class, function ($app) {
            return new FaceRecognitionService();
        });
    }
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        $this->configureDefaults();
        $this->forceHttpsInProduction(); // 👈 added
    }
}
