<?php

return [
    'mail_enabled' => (bool) env('CONTACT_MAIL_ENABLED', false),
    'notification_to' => env('CONTACT_TO_ADDRESS'),
];
