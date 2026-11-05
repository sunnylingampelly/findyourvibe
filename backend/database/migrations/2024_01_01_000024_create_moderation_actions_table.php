<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moderation_actions', function (Blueprint $table) {
            $table->id();
            $table->string('moderator_id');
            $table->foreign('moderator_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('target_user_id');
            $table->foreign('target_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('action_type');
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->index('moderator_id');
            $table->index('target_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moderation_actions');
    }
};
