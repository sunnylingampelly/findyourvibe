<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companion_documents', function (Blueprint $table) {
            $table->id();
            $table->string('companion_application_id');
            $table->foreign('companion_application_id')->references('id')->on('companion_applications')->cascadeOnDelete();
            $table->enum('document_type', ['identity', 'selfie', 'other']);
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime_type');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companion_documents');
    }
};
