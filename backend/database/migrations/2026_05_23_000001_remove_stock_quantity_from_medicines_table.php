<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('medicines', 'stock_quantity')) {
            Schema::table('medicines', function (Blueprint $table) {
                $table->dropColumn('stock_quantity');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('medicines', 'stock_quantity')) {
            Schema::table('medicines', function (Blueprint $table) {
                $table->integer('stock_quantity')->default(0)->after('dosage_form');
            });
        }
    }
};
