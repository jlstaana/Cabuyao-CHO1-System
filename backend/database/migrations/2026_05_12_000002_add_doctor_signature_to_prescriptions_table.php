<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('prescriptions', 'doctor_signature_svg')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->longText('doctor_signature_svg')->nullable()->after('notes');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('prescriptions', 'doctor_signature_svg')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->dropColumn('doctor_signature_svg');
            });
        }
    }
};
