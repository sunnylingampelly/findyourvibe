<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('saved_user_id');
            $table->foreign('saved_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'saved_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_profiles');
    }
};
