<?php

namespace App\Services;

use App\Models\SiteSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class SiteSettingService
{
    public function all(): array
    {
        $defaults = collect(config('landing.fields'))
            ->mapWithKeys(fn ($field, $key) => [$key => $field[2]])->all();

        $saved = SiteSetting::whereIn('key', array_keys($defaults))
            ->pluck('value', 'key')->all();

        $settings = array_merge($defaults, $saved);

        foreach (config('landing.json_keys', []) as $key) {
            $decoded = json_decode($settings[$key] ?? '[]', true);
            $settings[$key] = is_array($decoded) ? $decoded : [];
        }

        foreach (config('landing.image_keys', []) as $key) {
            if (Str::startsWith($settings[$key] ?? '', 'landing/')) {
                $settings[$key] = url(Storage::disk('public')->url($settings[$key]));
            }
        }

        return $settings;
    }

    public function update(array $settings): array
    {
        DB::transaction(function () use ($settings) {
            $fields = config('landing.fields');
            $imageKeys = config('landing.image_keys', []);
            $jsonKeys = config('landing.json_keys', []);

            foreach ($settings as $key => $value) {
                if (!isset($fields[$key]) || in_array($key, $imageKeys, true)) continue;

                SiteSetting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => in_array($key, $jsonKeys, true)
                            ? json_encode($value, JSON_UNESCAPED_UNICODE)
                            : $value,
                        'group' => $fields[$key][0],
                        'label' => $fields[$key][1],
                    ]
                );
            }
        });

        return $this->all();
    }

    public function uploadImage(string $key, UploadedFile $image): array
    {
        abort_unless(in_array($key, config('landing.image_keys', []), true), 422);

        $previous = SiteSetting::where('key', $key)->value('value');
        $path = $image->store('landing', 'public');

        try {
            $field = config("landing.fields.$key");
            SiteSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $path, 'group' => $field[0], 'label' => $field[1]]
            );
        } catch (Throwable $e) {
            Storage::disk('public')->delete($path);
            throw $e;
        }

        if ($previous && Str::startsWith($previous, 'landing/')) {
            Storage::disk('public')->delete($previous);
        }

        return $this->all();
    }
}