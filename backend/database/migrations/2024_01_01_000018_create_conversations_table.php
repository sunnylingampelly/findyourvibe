<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('connection_id');
            $table->foreign('connection_id')->references('id')->on('connections')->cascadeOnDelete();
            $table->timestamps();

            $table->unique('connection_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
