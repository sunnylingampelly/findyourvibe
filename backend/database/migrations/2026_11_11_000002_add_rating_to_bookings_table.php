<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedTinyInteger('rating')->nullable()->after('companion_response_note');
            $table->text('review_text')->nullable()->after('rating');
            $table->timestamp('completed_at')->nullable()->after('review_text');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['rating', 'review_text', 'completed_at']);
        });
    }
};
