<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('swipes', function (Blueprint $table) {
            $table->id();
            $table->string('swiper_id');
            $table->foreign('swiper_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('swiped_id');
            $table->foreign('swiped_id')->references('id')->on('users')->cascadeOnDelete();
            $table->enum('direction', ['left', 'right']);
            $table->timestamps();

            $table->unique(['swiper_id', 'swiped_id']);
            $table->index('swiper_id');
            $table->index('swiped_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('swipes');
    }
};
