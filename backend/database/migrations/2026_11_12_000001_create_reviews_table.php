<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('reviews', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('booking_id');
            $table->foreign('booking_id')->references('id')->on('bookings')->cascadeOnDelete();
            $table->string('reviewer_id');
            $table->foreign('reviewer_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('reviewee_id');
            $table->foreign('reviewee_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('body')->nullable();
            $table->enum('reviewer_role', ['requester', 'companion']);
            $table->boolean('is_published')->default(false);
            $table->timestamps();
            $table->unique(['booking_id', 'reviewer_id']);
            $table->index('reviewee_id');
            $table->index('is_published');
        });
    }

    public function down(): void { Schema::dropIfExists('reviews'); }
};
