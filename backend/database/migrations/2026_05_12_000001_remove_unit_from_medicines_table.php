<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('medicines', 'unit')) {
            Schema::table('medicines', function (Blueprint $table) {
                $table->dropColumn('unit');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('medicines', 'unit')) {
            Schema::table('medicines', function (Blueprint $table) {
                $table->string('unit')->nullable()->after('dosage_form');
            });
        }
    }
};
