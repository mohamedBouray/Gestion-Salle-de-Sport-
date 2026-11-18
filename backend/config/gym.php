<?php

return [
    'timezone' => env('GYM_TIMEZONE', 'Africa/Casablanca'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    'invitation_hours' => (int) env('GYM_INVITATION_HOURS', 48),
];
