<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_vibe_members', function (Blueprint $table) {
            $table->id();
            $table->ulid('group_vibe_id');
            $table->string('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted'])->default('accepted');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->unique(['group_vibe_id', 'user_id']);
            $table->foreign('group_vibe_id')->references('id')->on('group_vibes')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_vibe_members');
    }
};
