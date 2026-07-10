<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropColumn(['stock', 'expiration_date', 'batch_code']);
        });
    }

    public function down()
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->integer('stock')->default(0);
            $table->date('expiration_date')->nullable();
            $table->string('batch_code')->nullable();
        });
    }
};
