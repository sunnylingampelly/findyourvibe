<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->string('prompt_1_q')->nullable()->after('introduction');
            $table->text('prompt_1_a')->nullable()->after('prompt_1_q');
            $table->string('prompt_2_q')->nullable()->after('prompt_1_a');
            $table->text('prompt_2_a')->nullable()->after('prompt_2_q');
            $table->string('prompt_3_q')->nullable()->after('prompt_2_a');
            $table->text('prompt_3_a')->nullable()->after('prompt_3_q');
            $table->string('voice_intro')->nullable()->after('prompt_3_a');
        });
    }

    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn(['prompt_1_q', 'prompt_1_a', 'prompt_2_q', 'prompt_2_a', 'prompt_3_q', 'prompt_3_a', 'voice_intro']);
        });
    }
};
