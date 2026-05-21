<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medical_images', function (Blueprint $table) {
            $table->dropForeign(['consultation_id']);
            $table->unsignedBigInteger('consultation_id')->nullable()->change();
            $table->foreign('consultation_id')->references('id')->on('consultations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('medical_images', function (Blueprint $table) {
            $table->dropForeign(['consultation_id']);
            $table->unsignedBigInteger('consultation_id')->nullable(false)->change();
            $table->foreign('consultation_id')->references('id')->on('consultations')->cascadeOnDelete();
        });
    }
};
