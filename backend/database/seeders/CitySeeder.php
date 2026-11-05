<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Country;
use Illuminate\Database\Seeder;

class CitySeeder extends Seeder
{
    public function run(): void
    {
        $citiesByCountry = [
            'IN' => ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'],
            'US' => ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
            'GB' => ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
            'AU' => ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
            'CA' => ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
            'AE' => ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'],
            'SG' => ['Singapore City', 'Jurong', 'Tampines', 'Woodlands', 'Ang Mo Kio'],
            'DE' => ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
            'FR' => ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
            'JP' => ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya'],
        ];

        foreach ($citiesByCountry as $countryCode => $cities) {
            $country = Country::where('code', $countryCode)->first();
            if (!$country) continue;

            foreach ($cities as $cityName) {
                City::create(['country_id' => $country->id, 'name' => $cityName]);
            }
        }
    }
}
