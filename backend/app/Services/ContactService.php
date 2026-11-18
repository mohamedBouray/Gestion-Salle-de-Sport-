<?php

namespace App\Services;

use App\Models\ContactMessage;
use App\Mail\ContactReceivedMail;
use App\Mail\ContactReplyMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Throwable;

class ContactService
{

    public function submit(array $data): ContactMessage
    {
        $contact = ContactMessage::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'subject' => $data['subject'],
            'message' => $data['message'],
            'status' => 'new',
        ]);

        $this->notifyAdmin($contact);

        return $contact;
    }

    // Notification du nouveau message
    private function notifyAdmin(ContactMessage $contact): void
    {
        if (!config('contact.mail_enabled', false)) {
            return;
        }

        $adminEmail = config('contact.notification_to');

        if (
            !is_string($adminEmail) ||
            !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)
        ) {
            Log::warning('Email administrateur non configuré.', [
                'contact_id' => $contact->id,
            ]);

            return;
        }

        try {
            Mail::to($adminEmail)->send(
                new ContactReceivedMail($contact)
            );
        } catch (Throwable $e) {
            Log::error('Erreur notification Contact.', [
                'contact_id' => $contact->id,
                'error_type' => get_class($e),
            ]);
        }
    }

    // Liste paginée pour Admin
    public function paginate(array $filters)
    {
        return ContactMessage::query()
            ->when(
                $filters['status'] ?? null,
                fn ($query, $status) =>
                    $query->where('status', $status)
            )
            ->latest('id')
            ->paginate((int) ($filters['per_page'] ?? 20));
    }

    // Marquer un message comme lu
    public function markRead(ContactMessage $contact): ContactMessage
    {
        if ($contact->status === 'new') {
            $contact->update([
                'status' => 'read',
                'read_at' => now(),
            ]);
        }

        return $contact->fresh();
    }

    // Envoyer une réponse email au visiteur
    public function reply(
        ContactMessage $contact,
        string $replyBody
    ): ContactMessage {

        if ($contact->status === 'replied') {
            throw new ConflictHttpException(
                'Ce message a déjà reçu une réponse.'
            );
        }

        // Empêcher une fausse réponse en mode log
        if (in_array(config('mail.default'), ['log', 'array'], true)) {
            throw ValidationException::withMessages([
                'reply' => 'Configurez SMTP pour envoyer un email.',
            ]);
        }

        // Envoyer avant de modifier le statut
        Mail::to($contact->email)->send(
            new ContactReplyMail($contact, $replyBody)
        );

        $contact->update([
            'status' => 'replied',
            'read_at' => $contact->read_at ?? now(),
            'replied_at' => now(),
        ]);

        return $contact->fresh();
    }
}
