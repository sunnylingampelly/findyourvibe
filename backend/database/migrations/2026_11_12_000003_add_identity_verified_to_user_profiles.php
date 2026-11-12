<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->string('selfie_photo')->nullable()->after('profile_photo');
            $table->timestamp('identity_verified_at')->nullable()->after('selfie_photo');
        });
    }

    public function down(): void {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn(['selfie_photo', 'identity_verified_at']);
        });
    }
};
