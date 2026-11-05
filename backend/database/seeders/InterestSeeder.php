<?php

namespace Database\Seeders;

use App\Models\Interest;
use Illuminate\Database\Seeder;

class InterestSeeder extends Seeder
{
    public function run(): void
    {
        $interests = [
            ['name' => 'Travel', 'icon' => 'plane', 'color' => '#236B63'],
            ['name' => 'Movies', 'icon' => 'film', 'color' => '#D98D7A'],
            ['name' => 'Music', 'icon' => 'music', 'color' => '#A8C5B5'],
            ['name' => 'Coffee', 'icon' => 'coffee', 'color' => '#8B6914'],
            ['name' => 'Fitness', 'icon' => 'dumbbell', 'color' => '#4D9274'],
            ['name' => 'Photography', 'icon' => 'camera', 'color' => '#194E49'],
            ['name' => 'Food', 'icon' => 'utensils', 'color' => '#E9B7A5'],
            ['name' => 'Reading', 'icon' => 'book', 'color' => '#236B63'],
            ['name' => 'Gaming', 'icon' => 'gamepad', 'color' => '#6B5B95'],
            ['name' => 'Adventure', 'icon' => 'mountain', 'color' => '#D9A45B'],
            ['name' => 'Shopping', 'icon' => 'shopping-bag', 'color' => '#D76D6D'],
            ['name' => 'Sports', 'icon' => 'trophy', 'color' => '#4D9274'],
            ['name' => 'Art', 'icon' => 'palette', 'color' => '#9B59B6'],
            ['name' => 'Nature', 'icon' => 'leaf', 'color' => '#27AE60'],
            ['name' => 'Events', 'icon' => 'calendar', 'color' => '#E67E22'],
        ];

        foreach ($interests as $interest) {
            Interest::create($interest);
        }
    }
}
