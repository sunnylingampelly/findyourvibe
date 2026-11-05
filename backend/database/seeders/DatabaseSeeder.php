<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CountrySeeder::class,
            CitySeeder::class,
            LanguageSeeder::class,
            InterestSeeder::class,
            ServiceSeeder::class,
            UserSeeder::class,
            PlatformSettingsSeeder::class,
        ]);
    }
}
