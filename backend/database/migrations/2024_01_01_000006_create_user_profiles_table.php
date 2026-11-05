<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('display_name')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'non_binary', 'prefer_not_to_say'])->nullable();
            $table->text('bio')->nullable();
            $table->text('introduction')->nullable();
            $table->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('city_id')->nullable()->constrained()->nullOnDelete();
            $table->string('profile_photo')->nullable();
            $table->boolean('is_companion')->default(false);
            $table->enum('companion_verification_status', [
                'not_started', 'draft', 'submitted', 'under_review',
                'additional_info_required', 'approved', 'rejected', 'suspended'
            ])->default('not_started');
            $table->decimal('avg_rating', 3, 2)->nullable();
            $table->integer('rating_count')->default(0);
            $table->timestamps();

            $table->index('user_id');
            $table->index('is_companion');
            $table->index('companion_verification_status');
            $table->index('country_id');
            $table->index('city_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
