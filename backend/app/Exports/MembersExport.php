<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class MembersExport extends DefaultValueBinder implements
    FromQuery,
    WithMapping,
    WithHeadings,
    WithColumnWidths,
    WithStyles,
    WithCustomValueBinder
{
    public function __construct(
        private readonly array $filters = []
    ) {}

    // =====================================
    // QUERY DATABASE
    // =====================================

    public function query(): Builder
    {
        $query = User::query()
            ->where('role', User::MEMBER);

        $search = trim($this->filters['search'] ?? '');
        $status = $this->filters['status'] ?? '';

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        // SoftDeletes: membres archivés exclus
        return $query->orderByDesc('id');
    }

    // =====================================
    // HEADINGS
    // =====================================

    public function headings(): array
    {
        return [
            'Nom',
            'Email',
            'Téléphone',
            'Statut',
            'Inscription',
        ];
    }

    // =====================================
    // DATA MAPPING
    // =====================================

    public function map(mixed $member): array
    {
        $labels = [
            'active' => 'Actif',
            'pending' => 'En attente',
            'inactive' => 'Bloqué',
        ];

        return [
            $member->name ?? '',
            $member->email ?? '',
            $member->phone ?? '',
            $labels[$member->status]
                ?? $member->status
                ?? '',
            $member->created_at?->format('d/m/Y') ?? '',
        ];
    }

    // =====================================
    // SECURITY: TEXT VALUES
    // =====================================

    public function bindValue(Cell $cell, mixed $value): bool
    {
        if (is_string($value)) {
            $cell->setValueExplicit(
                $value,
                DataType::TYPE_STRING
            );

            return true;
        }

        return parent::bindValue($cell, $value);
    }

    // =====================================
    // COLUMN WIDTHS
    // =====================================

    public function columnWidths(): array
    {
        return [
            'A' => 28,
            'B' => 35,
            'C' => 22,
            'D' => 20,
            'E' => 20,
        ];
    }

    // =====================================
    // EXCEL STYLING
    // =====================================

    public function styles(Worksheet $sheet): ?array
    {
        $sheet->getStyle('A1:E1')
            ->getFont()
            ->setBold(true);

        $sheet->getStyle('A1:E1')
            ->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()
            ->setRGB('EAF2FF');

        $sheet->getStyle('A1:E1')
            ->getAlignment()
            ->setVertical('center');

        $sheet->getRowDimension(1)->setRowHeight(24);

        $sheet->freezePane('A2');

        $sheet->setAutoFilter('A1:E1');

        return [];
    }
}
