<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('experience_packages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('companion_id', 26);
            $table->foreign('companion_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('title', 100);
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency', 3)->default('INR');
            $table->decimal('duration_hours', 4, 1)->nullable();
            $table->string('location_type', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('experience_packages');
    }
};
