<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_views', function (Blueprint $table) {
            $table->id();
            $table->string('viewer_id');
            $table->foreign('viewer_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('viewed_id');
            $table->foreign('viewed_id')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamp('viewed_at');
            $table->timestamps();

            $table->index(['viewer_id', 'viewed_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_views');
    }
};
