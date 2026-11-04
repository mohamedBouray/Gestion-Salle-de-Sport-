<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GymAccountInvitation extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $activationUrl,
        private readonly string $role,
        private readonly int $validHours
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $roleLabel = $this->role === 'coach' ? 'coach' : 'membre';

        return (new MailMessage)
            ->subject('GYM Management - Invitation à activer votre compte')
            ->greeting('Bonjour '.$notifiable->name.',')
            ->line('Un administrateur a créé votre compte '.$roleLabel.' sur GYM Management.')
            ->line('Cliquez sur le bouton ci-dessous pour choisir votre mot de passe et activer votre accès.')
            ->action('Activer mon compte', $this->activationUrl)
            ->line('Ce lien est personnel, utilisable une seule fois et expire dans '.$this->validHours.' heures.')
            ->line("Si vous n'attendiez pas cette invitation, ignorez cet e-mail.");
    }
}
