<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->string('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->integer('preferred_min_age')->default(18);
            $table->integer('preferred_max_age')->default(50);
            $table->integer('preferred_discovery_radius_km')->default(50);
            $table->json('preferred_languages')->nullable();
            $table->boolean('discovery_enabled')->default(true);
            $table->boolean('show_online_status')->default(true);
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
