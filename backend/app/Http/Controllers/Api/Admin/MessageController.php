<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Services\ContactService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Throwable;

class MessageController extends Controller
{
    // Liste des messages
    public function index(
        Request $request,
        ContactService $service
    ): JsonResponse {
        $filters = $request->validate([
            'status' => [
                'nullable',
                Rule::in(['new', 'read', 'replied']),
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return response()->json([
            'messages' => $service->paginate($filters),
        ]);
    }

    // Marquer comme lu
    public function update(
        Request $request,
        ContactMessage $message,
        ContactService $service
    ): JsonResponse {
        $request->validate([
            'status' => ['required', Rule::in(['read'])],
        ]);

        return response()->json([
            'message' => $service->markRead($message),
        ]);
    }

    // Répondre par email au visiteur
    public function reply(
        Request $request,
        ContactMessage $message,
        ContactService $service
    ): JsonResponse {
        $data = $request->validate([
            'reply' => ['required', 'string', 'min:2', 'max:5000'],
        ]);

        try {
            $contact = $service->reply(
                $message,
                $data['reply']
            );
        } catch (ValidationException | ConflictHttpException $e) {
            throw $e;
        } catch (Throwable $e) {
            Log::error('Erreur réponse Contact.', [
                'contact_id' => $message->id,
                'error_type' => get_class($e),
            ]);

            return response()->json([
                'message' => "Impossible de traiter l'envoi. Vérifiez les logs et la configuration SMTP.",
            ], 503);
        }

        return response()->json([
            'message' => 'Réponse acceptée par le serveur email.',
            'contact' => $contact,
        ]);
    }
}
