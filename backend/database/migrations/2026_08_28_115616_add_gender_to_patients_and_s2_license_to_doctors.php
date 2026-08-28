<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->enum('gender', ['Male', 'Female'])->nullable()->after('dob');
        });

        Schema::table('doctors', function (Blueprint $table) {
            $table->string('s2_license_no')->nullable()->after('ptr_no');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn('gender');
        });

        Schema::table('doctors', function (Blueprint $table) {
            $table->dropColumn('s2_license_no');
        });
    }
};
