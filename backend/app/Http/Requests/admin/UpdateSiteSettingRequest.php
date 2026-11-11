<?php

namespace App\Http\Requests\admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSiteSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        $images = config('landing.image_keys', []);
        $json = config('landing.json_keys', []);
        $allowed = array_diff(array_keys(config('landing.fields')), $images);
        $hrefs = ['#home', '#features', '#pricing', '#schedule', '#contact', '/login', '/register'];

        $rules = ['settings' => ['required', 'array', Rule::array($allowed)]];
        foreach ($allowed as $key) {
            if (in_array($key, $json, true)) continue;
            $rules["settings.$key"] = ['sometimes', 'nullable', 'string', 'max:3000'];
        }

        foreach (['hero_button_link', 'footer_primary_link', 'footer_secondary_link'] as $key) {
            $rules["settings.$key"] = ['sometimes', 'required', Rule::in($hrefs)];
        }
        $rules['settings.contact_email'] = ['sometimes', 'nullable', 'email', 'max:190'];

        foreach (['nav_links' => 8, 'footer_links' => 10] as $key => $max) {
            $rules["settings.$key"] = ['sometimes', 'array', "max:$max"];
            $rules["settings.$key.*"] = ['required', 'array:label,href'];
            $rules["settings.$key.*.label"] = ['required', 'string', 'max:80'];
            $rules["settings.$key.*.href"] = ['required', Rule::in($hrefs)];
        }

        $rules['settings.features_items'] = ['sometimes', 'array', 'max:12'];
        $rules['settings.features_items.*'] = ['required', 'array:icon,title,description'];
        $rules['settings.features_items.*.icon'] = ['required', Rule::in(['members','membership','attendance','payment','trainer','analytics'])];
        $rules['settings.features_items.*.title'] = ['required', 'string', 'max:160'];
        $rules['settings.features_items.*.description'] = ['nullable', 'string', 'max:1000'];

        $rules['settings.pricing_plans'] = ['sometimes', 'array', 'max:8'];
        $rules['settings.pricing_plans.*'] = ['required', 'array:name,description,price,currency,period,popular,features'];
        foreach (['name','currency','period'] as $key) {
            $rules["settings.pricing_plans.*.$key"] = ['required', 'string', 'max:100'];
        }
        $rules['settings.pricing_plans.*.description'] = ['nullable', 'string', 'max:1000'];
        $rules['settings.pricing_plans.*.price'] = ['required', 'numeric', 'min:0', 'max:1000000'];
        $rules['settings.pricing_plans.*.popular'] = ['required', 'boolean'];
        $rules['settings.pricing_plans.*.features'] = ['required', 'array', 'max:20'];
        $rules['settings.pricing_plans.*.features.*'] = ['required', 'string', 'max:200'];

        $rules['settings.classes_items'] = ['sometimes', 'array', 'max:12'];
        $rules['settings.classes_items.*'] = ['required', 'array:category,days,time,title,coach,location,enrolled,capacity'];
        foreach (['category','days','time','title','coach','location'] as $key) {
            $rules["settings.classes_items.*.$key"] = ['nullable', 'string', 'max:160'];
        }
        foreach (['enrolled','capacity'] as $key) {
            $rules["settings.classes_items.*.$key"] = ['required', 'integer', 'min:0', 'max:10000'];
        }

        return $rules;
    }
}