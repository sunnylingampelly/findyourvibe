<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connection_requests', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('sender_id');
            $table->foreign('sender_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('receiver_id');
            $table->foreign('receiver_id')->references('id')->on('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted', 'declined', 'withdrawn', 'expired', 'revoked', 'blocked'])->default('pending');
            $table->text('message')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('sender_id');
            $table->index('receiver_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connection_requests');
    }
};
