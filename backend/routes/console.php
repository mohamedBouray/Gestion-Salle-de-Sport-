<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\CourseSession;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('gym:complete-sessions', function () {
    $count = CourseSession::completeElapsed();
    $this->info("Séances terminées : {$count}");
})->purpose('Clôturer les séances dont l’heure de fin est passée');

Schedule::command('gym:complete-sessions')->everyMinute()->withoutOverlapping();
