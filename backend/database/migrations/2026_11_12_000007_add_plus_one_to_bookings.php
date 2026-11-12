<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('plus_one_name', 100)->nullable()->after('location_notes');
            $table->string('plus_one_phone', 20)->nullable()->after('plus_one_name');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['plus_one_name', 'plus_one_phone']);
        });
    }
};
