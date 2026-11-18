<?php

namespace App\Http\Controllers\Api\Admin;

use App\Exports\MembersExport;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MembersExportController extends Controller
{
    public function __invoke(Request $request): BinaryFileResponse
    {
        $filters = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],
            'status' => [
                'nullable',
                'in:active,pending,inactive',
            ],
        ]);

        $filename = 'membres-'
            . now()->format('Y-m-d')
            . '.xlsx';

        return Excel::download(
            new MembersExport($filters),
            $filename
        );
    }
}
