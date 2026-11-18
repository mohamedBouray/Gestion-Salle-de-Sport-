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

class CoachesExport extends DefaultValueBinder implements FromQuery, WithMapping, WithHeadings, WithColumnWidths, WithStyles, WithCustomValueBinder{
    public function __construct( private readonly array $filters = []) {}

    public function query(): Builder
    {
        $query = User::query()
            ->where('role', User::COACH)
            ->with('coachProfile');

        $search = trim($this->filters['search'] ?? '');
        $status = $this->filters['status'] ?? '';

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhereHas(
                        'coachProfile',
                        fn ($p) => $p->where(
                            'specialty',
                            'like',
                            "%{$search}%"
                        )
                    );
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        // SoftDeletes excludes archived coaches by default.
        return $query->orderByDesc('id');
    }


    public function headings(): array{
        return [
            'Nom',
            'Email',
            'Téléphone',
            'Spécialité',
            'Expérience (ans)',
            'Statut',
            'Landing Page',
            'Inscription',
        ];
    }

    public function map(mixed $coach): array{
        $labels = [
            'active' => 'Actif',
            'pending' => 'En attente',
            'inactive' => 'Bloqué',
        ];
        return [
            $coach->name ?? '',
            $coach->email ?? '',
            $coach->phone ?? '',
            $coach->coachProfile?->specialty ?? '',
            (int) ($coach->coachProfile?->experience_years ?? 0),
            $labels[$coach->status] ?? $coach->status,
            $coach->coachProfile?->is_featured ? 'Oui' : 'Non',
            $coach->created_at?->format('d/m/Y') ?? '',
        ];
    }

    public function bindValue(Cell $cell, mixed $value): bool{
        if (is_string($value)) {
            $cell->setValueExplicit($value, DataType::TYPE_STRING);
            return true;
        }

        return parent::bindValue($cell, $value);
    }

    public function columnWidths(): array{
        return [
            'A' => 28,
            'B' => 35,
            'C' => 20,
            'D' => 27,
            'E' => 19,
            'F' => 17,
            'G' => 19,
            'H' => 18,
        ];
    }

    public function styles(Worksheet $sheet): ?array{
        $sheet->getStyle('A1:H1')->getFont()->setBold(true);

        $sheet->getStyle('A1:H1')
            ->getFill()
            ->setFillType(
                \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID
            )
            ->getStartColor()
            ->setRGB('EAF2FF');

        $sheet->freezePane('A2');
        $sheet->setAutoFilter('A1:H1');

        return [];
    }
}
