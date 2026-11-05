<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companion_applications', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('legal_name');
            $table->enum('status', [
                'draft', 'submitted', 'under_review',
                'additional_info_required', 'approved', 'rejected', 'suspended'
            ])->default('draft');
            $table->text('submission_notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->string('reviewed_by')->nullable();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companion_applications');
    }
};
