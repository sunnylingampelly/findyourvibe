<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('mobile', 20)->nullable();
            $table->string('country_code', 10)->nullable();
            $table->enum('role', ['user', 'super_admin'])->default('user');
            $table->enum('account_status', ['active', 'suspended', 'deleted'])->default('active');
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('mobile_verified_at')->nullable();
            $table->timestamp('onboarding_completed_at')->nullable();
            $table->timestamp('last_active_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index('role');
            $table->index('account_status');
            $table->index('onboarding_completed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
