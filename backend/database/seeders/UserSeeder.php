<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Country;
use App\Models\Interest;
use App\Models\Language;
use App\Models\Service;
use App\Models\User;
use App\Models\UserPreferences;
use App\Models\UserProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@findyourvibe.com',
            'password' => Hash::make('Admin@123'),
            'role' => 'super_admin',
            'account_status' => 'active',
            'email_verified_at' => now(),
            'onboarding_completed_at' => now(),
        ]);

        UserProfile::create([
            'user_id' => $admin->id,
            'display_name' => 'Super Admin',
        ]);

        // Sample users
        $countries = Country::all();
        $cities = City::all();
        $interests = Interest::all();
        $languages = Language::all();
        $services = Service::all();

        $sampleUsers = [
            ['name' => 'Priya Sharma', 'email' => 'priya@example.com', 'gender' => 'female', 'country' => 'IN', 'city' => 'Mumbai'],
            ['name' => 'Arjun Mehta', 'email' => 'arjun@example.com', 'gender' => 'male', 'country' => 'IN', 'city' => 'Delhi'],
            ['name' => 'Sarah Johnson', 'email' => 'sarah@example.com', 'gender' => 'female', 'country' => 'US', 'city' => 'New York'],
            ['name' => 'James Wilson', 'email' => 'james@example.com', 'gender' => 'male', 'country' => 'US', 'city' => 'Los Angeles'],
            ['name' => 'Emma Thompson', 'email' => 'emma@example.com', 'gender' => 'female', 'country' => 'GB', 'city' => 'London'],
            ['name' => 'Oliver Brown', 'email' => 'oliver@example.com', 'gender' => 'male', 'country' => 'GB', 'city' => 'Manchester'],
            ['name' => 'Aisha Rahman', 'email' => 'aisha@example.com', 'gender' => 'female', 'country' => 'AE', 'city' => 'Dubai'],
            ['name' => 'Mohammed Al-Rashid', 'email' => 'mohammed@example.com', 'gender' => 'male', 'country' => 'AE', 'city' => 'Abu Dhabi'],
            ['name' => 'Yuki Tanaka', 'email' => 'yuki@example.com', 'gender' => 'female', 'country' => 'JP', 'city' => 'Tokyo'],
            ['name' => 'Hiroshi Nakamura', 'email' => 'hiroshi@example.com', 'gender' => 'male', 'country' => 'JP', 'city' => 'Osaka'],
            ['name' => 'Sophie Martin', 'email' => 'sophie@example.com', 'gender' => 'female', 'country' => 'FR', 'city' => 'Paris'],
            ['name' => 'Lucas Dubois', 'email' => 'lucas@example.com', 'gender' => 'male', 'country' => 'FR', 'city' => 'Lyon'],
            ['name' => 'Anna Schmidt', 'email' => 'anna@example.com', 'gender' => 'female', 'country' => 'DE', 'city' => 'Berlin'],
            ['name' => 'Felix Mueller', 'email' => 'felix@example.com', 'gender' => 'male', 'country' => 'DE', 'city' => 'Munich'],
            ['name' => 'Chen Wei', 'email' => 'chen@example.com', 'gender' => 'male', 'country' => 'SG', 'city' => 'Singapore City'],
            ['name' => 'Lin Jing', 'email' => 'lin@example.com', 'gender' => 'female', 'country' => 'SG', 'city' => 'Tampines'],
            ['name' => 'Raj Patel', 'email' => 'raj@example.com', 'gender' => 'male', 'country' => 'IN', 'city' => 'Bangalore'],
            ['name' => 'Meera Nair', 'email' => 'meera@example.com', 'gender' => 'female', 'country' => 'IN', 'city' => 'Chennai'],
            ['name' => 'David Miller', 'email' => 'david@example.com', 'gender' => 'male', 'country' => 'AU', 'city' => 'Sydney'],
            ['name' => 'Jessica Lee', 'email' => 'jessica@example.com', 'gender' => 'female', 'country' => 'AU', 'city' => 'Melbourne'],
            ['name' => 'Marco Rossi', 'email' => 'marco@example.com', 'gender' => 'male', 'country' => 'DE', 'city' => 'Hamburg'],
            ['name' => 'Isabella Conti', 'email' => 'isabella@example.com', 'gender' => 'female', 'country' => 'FR', 'city' => 'Marseille'],
            ['name' => 'Ahmed Hassan', 'email' => 'ahmed@example.com', 'gender' => 'male', 'country' => 'AE', 'city' => 'Sharjah'],
            ['name' => 'Fatima Al-Zahra', 'email' => 'fatima@example.com', 'gender' => 'female', 'country' => 'AE', 'city' => 'Dubai'],
            ['name' => 'Tom Anderson', 'email' => 'tom@example.com', 'gender' => 'male', 'country' => 'CA', 'city' => 'Toronto'],
            ['name' => 'Emily Davis', 'email' => 'emily@example.com', 'gender' => 'female', 'country' => 'CA', 'city' => 'Vancouver'],
            ['name' => 'Sanjay Kumar', 'email' => 'sanjay@example.com', 'gender' => 'male', 'country' => 'IN', 'city' => 'Hyderabad'],
            ['name' => 'Pooja Singh', 'email' => 'pooja@example.com', 'gender' => 'female', 'country' => 'IN', 'city' => 'Mumbai'],
            ['name' => 'Jake Thompson', 'email' => 'jake@example.com', 'gender' => 'male', 'country' => 'AU', 'city' => 'Brisbane'],
            ['name' => 'Mia Roberts', 'email' => 'mia@example.com', 'gender' => 'female', 'country' => 'AU', 'city' => 'Perth'],
        ];

        $bios = [
            'Adventure seeker who loves exploring new places and meeting interesting people.',
            'Coffee enthusiast and movie buff looking for great company.',
            'Passionate about travel, food, and meaningful conversations.',
            'Fitness lover who enjoys outdoor activities and weekend adventures.',
            'Culture explorer always looking for the next great experience.',
            'Bookworm and café hopper seeking genuine connections.',
            'Music lover and art enthusiast open to new experiences.',
            'Foodie and city explorer ready to discover hidden gems.',
        ];

        foreach ($sampleUsers as $index => $userData) {
            $country = $countries->where('code', $userData['country'])->first();
            $city = $cities->where('name', $userData['city'])->first();

            $user = User::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make('Password@123'),
                'role' => 'user',
                'account_status' => 'active',
                'email_verified_at' => now(),
                'onboarding_completed_at' => now(),
                'last_active_at' => now()->subHours(rand(1, 72)),
            ]);

            $isCompanion = $index < 15;
            $dob = now()->subYears(rand(22, 38))->subDays(rand(0, 365));

            UserProfile::create([
                'user_id' => $user->id,
                'display_name' => $userData['name'],
                'date_of_birth' => $dob,
                'gender' => $userData['gender'],
                'bio' => $bios[$index % count($bios)],
                'introduction' => 'Hi! I am ' . explode(' ', $userData['name'])[0] . '. Looking forward to meeting new people and exploring together!',
                'country_id' => $country?->id,
                'city_id' => $city?->id,
                'is_companion' => $isCompanion,
                'companion_verification_status' => $isCompanion ? 'approved' : 'not_started',
                'avg_rating' => $isCompanion ? round(rand(38, 50) / 10, 1) : null,
                'rating_count' => $isCompanion ? rand(5, 50) : 0,
            ]);

            UserPreferences::create(['user_id' => $user->id]);

            $userInterests = $interests->random(rand(3, 7));
            $user->interests()->sync($userInterests->pluck('id')->toArray());

            $userLanguages = $languages->random(rand(1, 3));
            $user->languages()->sync($userLanguages->pluck('id')->toArray());

            if ($isCompanion) {
                $userServices = $services->random(rand(2, 5));
                $user->services()->sync($userServices->pluck('id')->toArray());
            }
        }
    }
}
