<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Medicine;

class MedicineSeeder extends Seeder {
    public function run(): void {
        Medicine::create(['name' => 'Paracetamol 500mg', 'category' => 'Analgesic', 'description' => 'For fever and mild pain', 'stock_quantity' => 1500, 'status' => true]);
        Medicine::create(['name' => 'Amoxicillin 250mg', 'category' => 'Antibiotic', 'description' => 'For bacterial infections', 'stock_quantity' => 800, 'status' => true]);
        Medicine::create(['name' => 'Loratadine 10mg', 'category' => 'Antihistamine', 'description' => 'For allergies', 'stock_quantity' => 450, 'status' => true]);
    }
}
