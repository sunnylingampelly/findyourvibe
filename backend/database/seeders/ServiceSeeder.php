<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['name' => 'Movie Companion', 'slug' => 'movie-companion', 'icon' => 'film', 'color' => '#236B63', 'description' => 'Find someone to watch movies with at cinemas or at home.', 'sort_order' => 1],
            ['name' => 'Coffee Buddy', 'slug' => 'coffee-buddy', 'icon' => 'coffee', 'color' => '#8B6914', 'description' => 'Meet up for coffee, tea, or your favourite café experience.', 'sort_order' => 2],
            ['name' => 'Event Companion', 'slug' => 'event-companion', 'icon' => 'calendar', 'color' => '#E67E22', 'description' => 'Attend concerts, exhibitions, festivals, and events together.', 'sort_order' => 3],
            ['name' => 'Travel Buddy', 'slug' => 'travel-buddy', 'icon' => 'plane', 'color' => '#194E49', 'description' => 'Explore new destinations and travel experiences together.', 'sort_order' => 4],
            ['name' => 'Shopping Companion', 'slug' => 'shopping-companion', 'icon' => 'shopping-bag', 'color' => '#D76D6D', 'description' => 'Make shopping more fun with a companion by your side.', 'sort_order' => 5],
            ['name' => 'Food Explorer', 'slug' => 'food-explorer', 'icon' => 'utensils', 'color' => '#E9B7A5', 'description' => 'Discover new restaurants and cuisines together.', 'sort_order' => 6],
            ['name' => 'City Explorer', 'slug' => 'city-explorer', 'icon' => 'map', 'color' => '#4D9274', 'description' => 'Explore your city\'s hidden gems and local attractions.', 'sort_order' => 7],
            ['name' => 'Weekend Companion', 'slug' => 'weekend-companion', 'icon' => 'sun', 'color' => '#D9A45B', 'description' => 'Make your weekends more enjoyable with great company.', 'sort_order' => 8],
            ['name' => 'Adventure Companion', 'slug' => 'adventure-companion', 'icon' => 'mountain', 'color' => '#236B63', 'description' => 'Hiking, outdoor activities, and adventure experiences.', 'sort_order' => 9],
            ['name' => 'Gaming Buddy', 'slug' => 'gaming-buddy', 'icon' => 'gamepad', 'color' => '#6B5B95', 'description' => 'Play board games, video games, or sports together.', 'sort_order' => 10],
        ];

        foreach ($services as $service) {
            Service::create($service);
        }
    }
}
