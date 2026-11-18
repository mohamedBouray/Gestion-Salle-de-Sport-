<?php

namespace App\Http\Controllers\Api\Admin;

use App\Exports\CoursesExport;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class CoursesExportController extends Controller
{
    // =====================================
    // EXPORT EXCEL DES COURS
    // =====================================

    public function __invoke(Request $request): BinaryFileResponse
    {
        // Validation des filtres
        $filters = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'status' => [
                'nullable',
                'in:pending,active,inactive',
            ],
        ]);

        // Nom du fichier Excel
        $filename = 'cours-'
            . now()->format('Y-m-d')
            . '.xlsx';

        // Générer et télécharger le fichier
        return Excel::download(
            new CoursesExport($filters),
            $filename
        );
    }
}
