<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('safe_meets', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('booking_id');
            $table->foreign('booking_id')->references('id')->on('bookings')->cascadeOnDelete();
            $table->string('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('trusted_name');
            $table->string('trusted_phone');
            $table->timestamp('checkin_at')->nullable();
            $table->timestamp('checkout_at')->nullable();
            $table->timestamp('sos_triggered_at')->nullable();
            $table->timestamps();
            $table->unique(['booking_id', 'user_id']);
        });
    }

    public function down(): void { Schema::dropIfExists('safe_meets'); }
};
