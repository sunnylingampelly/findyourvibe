<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connections', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('user_one_id');
            $table->foreign('user_one_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('user_two_id');
            $table->foreign('user_two_id')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamp('connected_at');
            $table->timestamps();

            $table->unique(['user_one_id', 'user_two_id']);
            $table->index('user_one_id');
            $table->index('user_two_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connections');
    }
};
