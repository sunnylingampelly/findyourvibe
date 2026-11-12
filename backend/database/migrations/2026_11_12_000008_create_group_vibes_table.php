<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_vibes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('host_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 100);
            $table->text('description')->nullable();
            $table->string('activity', 100)->nullable();
            $table->string('location', 200)->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->unsignedTinyInteger('max_members')->default(6);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_vibes');
    }
};
