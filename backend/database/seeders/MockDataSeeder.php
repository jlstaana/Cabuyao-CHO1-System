<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Medicine;

class MockDataSeeder extends Seeder {
    public function run(): void {
        $medicines = Medicine::all();
        foreach ($medicines as $m) {
            $stockRand = rand(1, 100);
            if ($stockRand <= 10) {
                $m->stock = 0;
            } elseif ($stockRand <= 30) {
                $m->stock = rand(1, 15);
            } else {
                $m->stock = rand(50, 300);
            }

            $expRand = rand(1, 100);
            if ($expRand <= 15) {
                $m->expiration_date = now()->addDays(rand(1, 29))->format('Y-m-d');
            } elseif ($expRand <= 40) {
                $m->expiration_date = now()->addMonths(rand(1, 6))->format('Y-m-d');
            } else {
                $m->expiration_date = now()->addYears(rand(1, 3))->addDays(rand(1, 300))->format('Y-m-d');
            }

            // Also assign a random generic name to old ones that have none so it looks nice
            if (is_null($m->generic_name)) {
                $generics = ['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Loratadine', 'Omeprazole', 'Metformin', 'Amlodipine'];
                $m->generic_name = $generics[array_rand($generics)];
            }

            $m->save();
        }
    }
}
