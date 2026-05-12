<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('doctors', function (Blueprint $table) {
            if (!Schema::hasColumn('doctors', 'doctor_type')) {
                $table->string('doctor_type')->default('Resident')->after('license_no');
            }
        });
    }

    public function down(): void {
        Schema::table('doctors', function (Blueprint $table) {
            if (Schema::hasColumn('doctors', 'doctor_type')) {
                $table->dropColumn('doctor_type');
            }
        });
    }
};
