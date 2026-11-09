<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('agreed_rate', 8, 2)->nullable()->after('notes');
            $table->string('duration_hours', 10)->nullable()->after('agreed_rate');
            $table->string('location_notes', 500)->nullable()->after('duration_hours');
            $table->text('companion_response_note')->nullable()->after('location_notes');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['agreed_rate', 'duration_hours', 'location_notes', 'companion_response_note']);
        });
    }
};
