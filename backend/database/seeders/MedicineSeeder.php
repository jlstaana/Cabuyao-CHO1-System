<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Medicine;

class MedicineSeeder extends Seeder {
    public function run(): void {
        $medicines = [
            // General Medicine / Analgesic
            ['name' => 'Biogesic 500mg', 'generic_name' => 'Paracetamol', 'category' => 'General Medicine / Analgesic', 'dosage_form' => 'Tablet', 'description' => 'For fever and mild pain.', 'status' => true],
            ['name' => 'Tempra 250mg/5mL', 'generic_name' => 'Paracetamol', 'category' => 'General Medicine / Pediatrics - Analgesic', 'dosage_form' => 'Syrup', 'description' => 'Pediatric fever and pain relief.', 'status' => true],
            ['name' => 'Advil 200mg', 'generic_name' => 'Ibuprofen', 'category' => 'General Medicine / NSAID', 'dosage_form' => 'Softgel', 'description' => 'For pain, inflammation, and fever.', 'status' => true],
            ['name' => 'Medicol Advance 400mg', 'generic_name' => 'Ibuprofen', 'category' => 'General Medicine / NSAID', 'dosage_form' => 'Softgel', 'description' => 'For severe headache and body pain.', 'status' => true],
            ['name' => 'Ponstan 500mg', 'generic_name' => 'Mefenamic Acid', 'category' => 'General Medicine / NSAID', 'dosage_form' => 'Tablet', 'description' => 'For short-term mild to moderate pain or dysmenorrhea.', 'status' => true],
            ['name' => 'Celebrex 200mg', 'generic_name' => 'Celecoxib', 'category' => 'General Medicine / NSAID', 'dosage_form' => 'Capsule', 'description' => 'For acute pain or osteoarthritis.', 'status' => true],
            ['name' => 'Flanax 275mg', 'generic_name' => 'Naproxen Sodium', 'category' => 'General Medicine / NSAID', 'dosage_form' => 'Tablet', 'description' => 'For muscle pain and arthritis.', 'status' => true],

            // Allergies / Antihistamine
            ['name' => 'Zyrtec 10mg', 'generic_name' => 'Cetirizine', 'category' => 'General Medicine / Antihistamine', 'dosage_form' => 'Tablet', 'description' => 'For allergic rhinitis or urticaria.', 'status' => true],
            ['name' => 'Virlix 10mg', 'generic_name' => 'Cetirizine', 'category' => 'General Medicine / Antihistamine', 'dosage_form' => 'Tablet', 'description' => 'For allergies.', 'status' => true],
            ['name' => 'Claritin 10mg', 'generic_name' => 'Loratadine', 'category' => 'General Medicine / Antihistamine', 'dosage_form' => 'Tablet', 'description' => 'Non-drowsy allergy relief.', 'status' => true],
            ['name' => 'Benadryl 25mg', 'generic_name' => 'Diphenhydramine', 'category' => 'General Medicine / Antihistamine', 'dosage_form' => 'Capsule', 'description' => 'For acute allergy symptoms.', 'status' => true],
            ['name' => 'Allerta 10mg', 'generic_name' => 'Loratadine', 'category' => 'General Medicine / Antihistamine', 'dosage_form' => 'Tablet', 'description' => 'For allergies and rhinitis.', 'status' => true],

            // Pulmonology / Cough & Cold
            ['name' => 'Ventolin Inhaler 100mcg', 'generic_name' => 'Salbutamol', 'category' => 'Pulmonology / Bronchodilator', 'dosage_form' => 'Inhaler', 'description' => 'For bronchospasm relief.', 'status' => true],
            ['name' => 'Symbicort 160/4.5mcg', 'generic_name' => 'Budesonide + Formoterol', 'category' => 'Pulmonology / Inhaler', 'dosage_form' => 'Inhaler', 'description' => 'Asthma and COPD maintenance.', 'status' => true],
            ['name' => 'Singulair 10mg', 'generic_name' => 'Montelukast', 'category' => 'Pulmonology / Leukotriene', 'dosage_form' => 'Tablet', 'description' => 'Asthma maintenance.', 'status' => true],
            ['name' => 'Robitussin Expectorant', 'generic_name' => 'Guaifenesin', 'category' => 'General Medicine / Expectorant', 'dosage_form' => 'Syrup', 'description' => 'For productive cough.', 'status' => true],
            ['name' => 'Solmux 500mg', 'generic_name' => 'Carbocisteine', 'category' => 'Pulmonology / Mucolytic', 'dosage_form' => 'Capsule', 'description' => 'Melts sticky phlegm.', 'status' => true],
            ['name' => 'Ascof Forte 600mg', 'generic_name' => 'Lagundi', 'category' => 'Pulmonology / Herbal Cough', 'dosage_form' => 'Tablet', 'description' => 'Herbal relief for cough.', 'status' => true],
            ['name' => 'Fluimucil 600mg', 'generic_name' => 'Acetylcysteine', 'category' => 'Pulmonology / Mucolytic', 'dosage_form' => 'Sachet', 'description' => 'For mucus clearance.', 'status' => true],

            // Gastroenterology
            ['name' => 'Erceflora 2 Billion', 'generic_name' => 'Bacillus Clausii', 'category' => 'Gastroenterology / Probiotic', 'dosage_form' => 'Vial', 'description' => 'Probiotic for diarrhea.', 'status' => true],
            ['name' => 'Imodium 2mg', 'generic_name' => 'Loperamide', 'category' => 'Gastroenterology / Antidiarrheal', 'dosage_form' => 'Capsule', 'description' => 'For acute diarrhea.', 'status' => true],
            ['name' => 'Losec 20mg', 'generic_name' => 'Omeprazole', 'category' => 'Gastroenterology / PPI', 'dosage_form' => 'Capsule', 'description' => 'For GERD and ulcers.', 'status' => true],
            ['name' => 'Kremil-S', 'generic_name' => 'Aluminum Hydroxide + Magnesium Hydroxide', 'category' => 'Gastroenterology / Antacid', 'dosage_form' => 'Tablet', 'description' => 'For hyperacidity.', 'status' => true],
            ['name' => 'Motilium 10mg', 'generic_name' => 'Domperidone', 'category' => 'Gastroenterology / Antiemetic', 'dosage_form' => 'Tablet', 'description' => 'For nausea and vomiting.', 'status' => true],

            // Antibiotics & Infectious Disease
            ['name' => 'Amoxil 500mg', 'generic_name' => 'Amoxicillin', 'category' => 'Infectious Disease / Antibiotic', 'dosage_form' => 'Capsule', 'description' => 'For susceptible bacterial infections.', 'status' => true],
            ['name' => 'Augmentin 625mg', 'generic_name' => 'Co-Amoxiclav', 'category' => 'Infectious Disease / Antibiotic', 'dosage_form' => 'Tablet', 'description' => 'For severe bacterial infections.', 'status' => true],
            ['name' => 'Zithromax 500mg', 'generic_name' => 'Azithromycin', 'category' => 'Infectious Disease / Antibiotic', 'dosage_form' => 'Tablet', 'description' => 'For respiratory infections.', 'status' => true],
            ['name' => 'Cipro 500mg', 'generic_name' => 'Ciprofloxacin', 'category' => 'Infectious Disease / Antibiotic', 'dosage_form' => 'Tablet', 'description' => 'For urinary and systemic infections.', 'status' => true],
            ['name' => 'Flagyl 500mg', 'generic_name' => 'Metronidazole', 'category' => 'Infectious Disease / Antiprotozoal', 'dosage_form' => 'Tablet', 'description' => 'For anaerobic infections.', 'status' => true],

            // Cardiology & Hypertension
            ['name' => 'Norvasc 5mg', 'generic_name' => 'Amlodipine', 'category' => 'Cardiology / Antihypertensive', 'dosage_form' => 'Tablet', 'description' => 'For hypertension.', 'status' => true],
            ['name' => 'Cozaar 50mg', 'generic_name' => 'Losartan', 'category' => 'Cardiology / Antihypertensive', 'dosage_form' => 'Tablet', 'description' => 'For hypertension.', 'status' => true],
            ['name' => 'Lipitor 20mg', 'generic_name' => 'Atorvastatin', 'category' => 'Cardiology / Lipid-Lowering', 'dosage_form' => 'Tablet', 'description' => 'For high cholesterol.', 'status' => true],
            ['name' => 'Neobloc 50mg', 'generic_name' => 'Metoprolol', 'category' => 'Cardiology / Beta Blocker', 'dosage_form' => 'Tablet', 'description' => 'For rate control and hypertension.', 'status' => true],

            // Diabetes / Endocrinology
            ['name' => 'Glucophage 500mg', 'generic_name' => 'Metformin', 'category' => 'Endocrinology / Antidiabetic', 'dosage_form' => 'Tablet', 'description' => 'For type 2 diabetes.', 'status' => true],
            ['name' => 'Diamicron 80mg', 'generic_name' => 'Gliclazide', 'category' => 'Endocrinology / Antidiabetic', 'dosage_form' => 'Tablet', 'description' => 'For type 2 diabetes.', 'status' => true],
            ['name' => 'Forxiga 10mg', 'generic_name' => 'Dapagliflozin', 'category' => 'Endocrinology / Antidiabetic', 'dosage_form' => 'Tablet', 'description' => 'For diabetes management.', 'status' => true],

            // Vitamins & Minerals
            ['name' => 'Centrum Advance', 'generic_name' => 'Multivitamins + Minerals', 'category' => 'Vitamins', 'dosage_form' => 'Tablet', 'description' => 'Daily multivitamin.', 'status' => true],
            ['name' => 'Poten-Cee 500mg', 'generic_name' => 'Ascorbic Acid', 'category' => 'Vitamins', 'dosage_form' => 'Tablet', 'description' => 'Vitamin C supplement.', 'status' => true],
            ['name' => 'Neurobion', 'generic_name' => 'Vitamin B Complex', 'category' => 'Vitamins', 'dosage_form' => 'Tablet', 'description' => 'For nerve health.', 'status' => true],
            ['name' => 'Hemarate FA', 'generic_name' => 'Ferrous Sulfate + Folic Acid', 'category' => 'Vitamins', 'dosage_form' => 'Tablet', 'description' => 'For anemia and pregnancy.', 'status' => true],
            ['name' => 'Caltrate Plus', 'generic_name' => 'Calcium + Vitamin D', 'category' => 'Vitamins', 'dosage_form' => 'Tablet', 'description' => 'Bone health supplement.', 'status' => true],

            // Dermatology
            ['name' => 'Canesten 1%', 'generic_name' => 'Clotrimazole', 'category' => 'Dermatology / Antifungal', 'dosage_form' => 'Cream', 'description' => 'For fungal infections.', 'status' => true],
            ['name' => 'Bactroban 2%', 'generic_name' => 'Mupirocin', 'category' => 'Dermatology / Antibiotic', 'dosage_form' => 'Ointment', 'description' => 'For skin infections.', 'status' => true],
            ['name' => 'Dermovate', 'generic_name' => 'Clobetasol Propionate', 'category' => 'Dermatology / Corticosteroid', 'dosage_form' => 'Ointment', 'description' => 'High-potency topical steroid.', 'status' => true]
        ];

        foreach ($medicines as &$medicine) {
            $stockRand = rand(1, 100);
            $stock = 0;
            if ($stockRand <= 10) {
                $stock = 0;
            } elseif ($stockRand <= 30) {
                $stock = rand(1, 15);
            } else {
                $stock = rand(50, 300);
            }

            $expRand = rand(1, 100);
            if ($expRand <= 15) {
                $expDate = now()->addDays(rand(1, 29))->format('Y-m-d');
            } elseif ($expRand <= 40) {
                $expDate = now()->addMonths(rand(1, 6))->format('Y-m-d');
            } else {
                $expDate = now()->addYears(rand(1, 3))->addDays(rand(1, 300))->format('Y-m-d');
            }

            $medicineData = [
                'name' => $medicine['name'],
                'generic_name' => $medicine['generic_name'],
                'category' => $medicine['category'],
                'dosage_form' => $medicine['dosage_form'],
                'description' => $medicine['description'],
                'status' => $medicine['status']
            ];

            $m = Medicine::updateOrCreate(
                ['name' => $medicine['name']], 
                $medicineData
            );
            
            if ($stock > 0 && $m->batches()->count() === 0) {
                // Create a couple of batches
                $m->batches()->create([
                    'batch_number' => 'LOT-' . rand(100000, 999999),
                    'stock' => ceil($stock / 2),
                    'expiration_date' => $expDate
                ]);
                $m->batches()->create([
                    'batch_number' => 'PH' . rand(1000, 9999) . 'X',
                    'stock' => floor($stock / 2),
                    'expiration_date' => now()->addYears(rand(1, 4))->format('Y-m-d')
                ]);
            }
        }
    }
}
