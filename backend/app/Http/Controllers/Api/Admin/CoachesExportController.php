<?php

namespace App\Http\Controllers\Api\Admin;

use App\Exports\CoachesExport;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class CoachesExportController extends Controller
{
    public function __invoke(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => [
                'nullable',
                'in:active,pending,inactive',
            ],
        ]);

        $filename = 'coachs-' . now()->format('Y-m-d') . '.xlsx';

        return Excel::download(
            new CoachesExport($filters),
            $filename
        );
    }
}
