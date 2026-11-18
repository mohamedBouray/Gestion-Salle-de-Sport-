<?php

namespace App\Exports;

use App\Models\Course;
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
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CoursesExport extends DefaultValueBinder implements
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
    // DONNEES + FILTRES
    // =====================================

    public function query(): Builder
    {
        $query = Course::query()
            ->with('coach:id,name');

        $search = trim($this->filters['search'] ?? '');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('coach', fn ($coach) =>
                        $coach->where('name', 'like', "%{$search}%")
                    );
            });
        }

        if (!empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        return $query->orderByDesc('id');
    }

    // =====================================
    // EN-TETES EXCEL
    // =====================================

    public function headings(): array
    {
        return [
            'ID',
            'Nom du cours',
            'Coach principal',
            'Prix (MAD)',
            'Statut',
            'Date de création',
            'Description',
        ];
    }

    // =====================================
    // FORMAT DES LIGNES
    // =====================================

    public function map($course): array
    {
        $statuses = [
            'active' => 'Actif',
            'inactive' => 'Inactif',
            'pending' => 'En attente',
        ];

        return [
            (int) $course->id,
            $course->name ?? '',
            $course->coach?->name ?? 'Non assigné',
            (float) $course->price,
            $statuses[$course->status] ?? $course->status ?? '',
            $course->created_at?->format('d/m/Y') ?? '',
            $course->description ?? '',
        ];
    }

    // =====================================
    // PROTECTION DES CELLULES TEXTE
    // =====================================

    public function bindValue(Cell $cell, $value): bool
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
    // LARGEUR DES COLONNES
    // =====================================

    public function columnWidths(): array
    {
        return [
            'A' => 10,
            'B' => 30,
            'C' => 28,
            'D' => 18,
            'E' => 18,
            'F' => 20,
            'G' => 55,
        ];
    }

    // =====================================
    // DESIGN EXCEL
    // =====================================

    public function styles(Worksheet $sheet): ?array
    {
        $header = $sheet->getStyle('A1:G1');

        $header->getFont()
            ->setBold(true)
            ->setSize(11);

        $header->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()
            ->setRGB('EAF2FF');

        $sheet->getRowDimension(1)->setRowHeight(26);

        $sheet->freezePane('A2');

        $sheet->setAutoFilter('A1:G1');

        $sheet->getStyle('A1:G1')
            ->getAlignment()
            ->setVertical('center');

        return [];
    }
}
