<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_reports', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('reporter_id');
            $table->foreign('reporter_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('reported_id');
            $table->foreign('reported_id')->references('id')->on('users')->cascadeOnDelete();
            $table->enum('category', [
                'inappropriate_behaviour', 'fake_profile', 'harassment',
                'suspicious_activity', 'misleading_information', 'other'
            ]);
            $table->text('description');
            $table->enum('status', ['open', 'under_review', 'resolved', 'dismissed'])->default('open');
            $table->text('admin_notes')->nullable();
            $table->string('resolved_by')->nullable();
            $table->foreign('resolved_by')->references('id')->on('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index('reporter_id');
            $table->index('reported_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_reports');
    }
};
