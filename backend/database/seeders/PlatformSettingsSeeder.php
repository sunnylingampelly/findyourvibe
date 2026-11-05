<?php

namespace Database\Seeders;

use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;

class PlatformSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'platform_name', 'value' => 'Find Your Vibe', 'type' => 'string', 'group' => 'general'],
            ['key' => 'platform_tagline', 'value' => 'Discover meaningful companionship', 'type' => 'string', 'group' => 'general'],
            ['key' => 'minimum_age', 'value' => '18', 'type' => 'integer', 'group' => 'eligibility'],
            ['key' => 'companion_minimum_age', 'value' => '18', 'type' => 'integer', 'group' => 'eligibility'],
            ['key' => 'allow_registrations', 'value' => 'true', 'type' => 'boolean', 'group' => 'general'],
            ['key' => 'require_email_verification', 'value' => 'false', 'type' => 'boolean', 'group' => 'auth'],
            ['key' => 'default_discovery_radius_km', 'value' => '50', 'type' => 'integer', 'group' => 'discovery'],
            ['key' => 'max_discovery_radius_km', 'value' => '500', 'type' => 'integer', 'group' => 'discovery'],
            ['key' => 'support_email', 'value' => 'support@findyourvibe.com', 'type' => 'string', 'group' => 'contact'],
        ];

        foreach ($settings as $setting) {
            PlatformSetting::firstOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
