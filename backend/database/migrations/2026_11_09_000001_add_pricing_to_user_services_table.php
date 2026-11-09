<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_services', function (Blueprint $table) {
            $table->decimal('price_per_session', 8, 2)->nullable()->after('service_id');
            $table->string('price_currency', 3)->default('INR')->after('price_per_session');
            $table->string('price_unit', 20)->default('per_session')->after('price_currency');
        });
    }

    public function down(): void
    {
        Schema::table('user_services', function (Blueprint $table) {
            $table->dropColumn(['price_per_session', 'price_currency', 'price_unit']);
        });
    }
};
