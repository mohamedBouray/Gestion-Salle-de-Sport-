<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/email/verify/{id}/{hash}', \App\Http\Controllers\Auth\EmailVerificationController::class)
    ->whereNumber('id')->middleware(['signed:relative', 'throttle:10,1'])
    ->name('verification.verify');
