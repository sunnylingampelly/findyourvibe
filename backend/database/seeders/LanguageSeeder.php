<?php

namespace Database\Seeders;

use App\Models\Language;
use Illuminate\Database\Seeder;

class LanguageSeeder extends Seeder
{
    public function run(): void
    {
        $languages = [
            ['name' => 'English', 'code' => 'en'],
            ['name' => 'Hindi', 'code' => 'hi'],
            ['name' => 'Spanish', 'code' => 'es'],
            ['name' => 'French', 'code' => 'fr'],
            ['name' => 'German', 'code' => 'de'],
            ['name' => 'Japanese', 'code' => 'ja'],
            ['name' => 'Mandarin', 'code' => 'zh'],
            ['name' => 'Arabic', 'code' => 'ar'],
            ['name' => 'Portuguese', 'code' => 'pt'],
            ['name' => 'Korean', 'code' => 'ko'],
            ['name' => 'Italian', 'code' => 'it'],
            ['name' => 'Russian', 'code' => 'ru'],
            ['name' => 'Tamil', 'code' => 'ta'],
            ['name' => 'Bengali', 'code' => 'bn'],
            ['name' => 'Marathi', 'code' => 'mr'],
        ];

        foreach ($languages as $lang) {
            Language::create($lang);
        }
    }
}
