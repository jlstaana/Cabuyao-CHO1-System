<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up()
    {
        Schema::create('medicine_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained()->onDelete('cascade');
            $table->string('batch_number');
            $table->integer('stock')->default(0);
            $table->date('expiration_date');
            $table->timestamps();
        });

        // Migrate existing stock into realistic batches
        $medicines = DB::table('medicines')->get();
        foreach ($medicines as $medicine) {
            if ($medicine->stock > 0) {
                // Determine a realistic expiration date
                $expDate = $medicine->expiration_date;
                if (!$expDate || Carbon::parse($expDate)->isPast()) {
                    // Generate random date between now and +5 years (1825 days)
                    $expDate = Carbon::now()->addDays(rand(30, 1825))->format('Y-m-d');
                }
                
                // Determine a batch number
                $batchNo = $medicine->batch_code;
                if (!$batchNo) {
                    $batchNo = 'B' . strtoupper(substr(md5(uniqid()), 0, 6));
                }

                DB::table('medicine_batches')->insert([
                    'medicine_id' => $medicine->id,
                    'batch_number' => $batchNo,
                    'stock' => $medicine->stock,
                    'expiration_date' => $expDate,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down()
    {
        Schema::dropIfExists('medicine_batches');
    }
};
