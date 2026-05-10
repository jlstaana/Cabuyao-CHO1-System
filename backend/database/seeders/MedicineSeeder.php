<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Medicine;

class MedicineSeeder extends Seeder {
    public function run(): void {
        $medicines = [
            ['name' => 'Paracetamol 500mg', 'category' => 'Analgesic', 'description' => 'For fever and mild pain', 'stock_quantity' => 1500, 'status' => true],
            ['name' => 'Amoxicillin 250mg', 'category' => 'Antibiotic', 'description' => 'For bacterial infections', 'stock_quantity' => 800, 'status' => true],
            ['name' => 'Loratadine 10mg', 'category' => 'Antihistamine', 'description' => 'For allergies', 'stock_quantity' => 450, 'status' => true],
            ['name' => 'Metformin 500mg', 'category' => 'Antidiabetic', 'description' => 'For blood sugar control', 'stock_quantity' => 600, 'status' => true],
            ['name' => 'Amlodipine 5mg', 'category' => 'Antihypertensive', 'description' => 'For blood pressure management', 'stock_quantity' => 500, 'status' => true],
        ];

        foreach ($medicines as $medicine) {
            Medicine::updateOrCreate(['name' => $medicine['name']], $medicine);
        }
    }
}
