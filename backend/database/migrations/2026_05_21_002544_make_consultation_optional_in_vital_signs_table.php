<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vital_signs', function (Blueprint $table) {
            $table->dropForeign(['consultation_id']);
            $table->unsignedBigInteger('consultation_id')->nullable()->change();
            $table->foreign('consultation_id')->references('id')->on('consultations')->cascadeOnDelete();
            
            $table->unsignedBigInteger('patient_id')->nullable()->after('id');
            $table->foreign('patient_id')->references('id')->on('patients')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('vital_signs', function (Blueprint $table) {
            $table->dropForeign(['patient_id']);
            $table->dropColumn('patient_id');
            
            $table->dropForeign(['consultation_id']);
            $table->unsignedBigInteger('consultation_id')->nullable(false)->change();
            $table->foreign('consultation_id')->references('id')->on('consultations')->cascadeOnDelete();
        });
    }
};
