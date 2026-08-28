<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Medicine;

class MedicineSeeder extends Seeder {
    public function run(): void {
        $medicines = [
            // PhilHealth YAKAP / General Outpatient Care
            ['name' => 'Biogesic 500mg', 'generic_name' => 'Paracetamol', 'category' => 'PhilHealth YAKAP / Analgesic (General Outpatient Care)', 'dosage_form' => 'Tablet', 'description' => 'For fever and mild pain relief.', 'status' => true],
            ['name' => 'Tempra 250mg/5mL', 'generic_name' => 'Paracetamol', 'category' => 'PhilHealth YAKAP / Pediatrics - Analgesic', 'dosage_form' => 'Syrup', 'description' => 'Pediatric fever and pain relief.', 'status' => true],
            ['name' => 'Advil 200mg', 'generic_name' => 'Ibuprofen', 'category' => 'PhilHealth YAKAP / NSAID (General Outpatient Care)', 'dosage_form' => 'Softgel', 'description' => 'For pain, inflammation, and fever.', 'status' => true],
            ['name' => 'Medicol Advance 400mg', 'generic_name' => 'Ibuprofen', 'category' => 'PhilHealth YAKAP / NSAID (General Outpatient Care)', 'dosage_form' => 'Softgel', 'description' => 'For severe headache and body pain.', 'status' => true],
            ['name' => 'Ponstan 500mg', 'generic_name' => 'Mefenamic Acid', 'category' => 'PhilHealth YAKAP / NSAID (General Outpatient Care)', 'dosage_form' => 'Tablet', 'description' => 'For short-term mild to moderate pain or dysmenorrhea.', 'status' => true],
            ['name' => 'Celebrex 200mg', 'generic_name' => 'Celecoxib', 'category' => 'PhilHealth YAKAP / NSAID (General Outpatient Care)', 'dosage_form' => 'Capsule', 'description' => 'For acute pain or osteoarthritis.', 'status' => true],
            ['name' => 'Flanax 275mg', 'generic_name' => 'Naproxen Sodium', 'category' => 'PhilHealth YAKAP / NSAID (General Outpatient Care)', 'dosage_form' => 'Tablet', 'description' => 'For muscle pain and arthritis.', 'status' => true],

            // Allergies / Antihistamine
            ['name' => 'Zyrtec 10mg', 'generic_name' => 'Cetirizine', 'category' => 'PhilHealth YAKAP / Antihistamine (General Outpatient Care)', 'dosage_form' => 'Tablet', 'description' => 'For allergic rhinitis or urticaria.', 'status' => true],
            ['name' => 'Virlix 10mg', 'generic_name' => 'Cetirizine', 'category' => 'PhilHealth YAKAP / Antihistamine (General Outpatient Care)', 'dosage_form' => 'Tablet', 'description' => 'For allergies.', 'status' => true],
            ['name' => 'Claritin 10mg', 'generic_name' => 'Loratadine', 'category' => 'PhilHealth YAKAP / Antihistamine (General Outpatient Care)', 'dosage_form' => 'Tablet', 'description' => 'Non-drowsy allergy relief.', 'status' => true],
            ['name' => 'Benadryl 25mg', 'generic_name' => 'Diphenhydramine', 'category' => 'PhilHealth YAKAP / Antihistamine (General Outpatient Care)', 'dosage_form' => 'Capsule', 'description' => 'For acute allergy symptoms.', 'status' => true],
            ['name' => 'Allerta 10mg', 'generic_name' => 'Loratadine', 'category' => 'PhilHealth YAKAP / Antihistamine (General Outpatient Care)', 'dosage_form' => 'Tablet', 'description' => 'For allergies and rhinitis.', 'status' => true],

            // Pulmonology / Cough & Cold
            ['name' => 'Ventolin Inhaler 100mcg', 'generic_name' => 'Salbutamol', 'category' => 'PhilHealth YAKAP / Pulmonology (Bronchodilator)', 'dosage_form' => 'Inhaler', 'description' => 'For bronchospasm relief.', 'status' => true],
            ['name' => 'Symbicort 160/4.5mcg', 'generic_name' => 'Budesonide + Formoterol', 'category' => 'PhilHealth YAKAP / Pulmonology (Inhaler)', 'dosage_form' => 'Inhaler', 'description' => 'Asthma and COPD maintenance.', 'status' => true],
            ['name' => 'Singulair 10mg', 'generic_name' => 'Montelukast', 'category' => 'PhilHealth YAKAP / Pulmonology (Leukotriene)', 'dosage_form' => 'Tablet', 'description' => 'Asthma maintenance.', 'status' => true],
            ['name' => 'Robitussin Expectorant', 'generic_name' => 'Guaifenesin', 'category' => 'PhilHealth YAKAP / Expectorant (General Outpatient Care)', 'dosage_form' => 'Syrup', 'description' => 'For productive cough.', 'status' => true],
            ['name' => 'Solmux 500mg', 'generic_name' => 'Carbocisteine', 'category' => 'PhilHealth YAKAP / Pulmonology (Mucolytic)', 'dosage_form' => 'Capsule', 'description' => 'Melts sticky phlegm.', 'status' => true],
            ['name' => 'Ascof Forte 600mg', 'generic_name' => 'Lagundi', 'category' => 'PhilHealth YAKAP / Pulmonology (Herbal Cough)', 'dosage_form' => 'Tablet', 'description' => 'Herbal relief for cough.', 'status' => true],
            ['name' => 'Fluimucil 600mg', 'generic_name' => 'Acetylcysteine', 'category' => 'PhilHealth YAKAP / Pulmonology (Mucolytic)', 'dosage_form' => 'Sachet', 'description' => 'For mucus clearance.', 'status' => true],

            // Gastroenterology
            ['name' => 'Erceflora 2 Billion', 'generic_name' => 'Bacillus Clausii', 'category' => 'Gastroenterology / Probiotic', 'dosage_form' => 'Vial', 'description' => 'Probiotic for diarrhea.', 'status' => true],
            ['name' => 'Imodium 2mg', 'generic_name' => 'Loperamide', 'category' => 'Gastroenterology / Antidiarrheal', 'dosage_form' => 'Capsule', 'description' => 'For acute diarrhea.', 'status' => true],
            ['name' => 'Losec 20mg', 'generic_name' => 'Omeprazole', 'category' => 'PhilHealth YAKAP / Gastroenterology (PPI)', 'dosage_form' => 'Capsule', 'description' => 'For GERD and ulcers.', 'status' => true],
            ['name' => 'Kremil-S', 'generic_name' => 'Aluminum Hydroxide + Magnesium Hydroxide', 'category' => 'Gastroenterology / Antacid', 'dosage_form' => 'Tablet', 'description' => 'For hyperacidity.', 'status' => true],
            ['name' => 'Motilium 10mg', 'generic_name' => 'Domperidone', 'category' => 'Gastroenterology / Antiemetic', 'dosage_form' => 'Tablet', 'description' => 'For nausea and vomiting.', 'status' => true],

            // DOH TB-DOTS Program (Tuberculosis)
            ['name' => 'Rifadin 300mg', 'generic_name' => 'Rifampicin', 'category' => 'TB-DOTS Program (Tuberculosis)', 'dosage_form' => 'Capsule', 'description' => 'Anti-TB drug (First Line).', 'status' => true],
            ['name' => 'Laniazid 100mg', 'generic_name' => 'Isoniazid', 'category' => 'TB-DOTS Program (Tuberculosis)', 'dosage_form' => 'Tablet', 'description' => 'Anti-TB drug (First Line).', 'status' => true],
            ['name' => 'Pyrazinamide 500mg', 'generic_name' => 'Pyrazinamide', 'category' => 'TB-DOTS Program (Tuberculosis)', 'dosage_form' => 'Tablet', 'description' => 'Anti-TB drug (First Line).', 'status' => true],
            ['name' => 'Myambutol 400mg', 'generic_name' => 'Ethambutol', 'category' => 'TB-DOTS Program (Tuberculosis)', 'dosage_form' => 'Tablet', 'description' => 'Anti-TB drug (First Line).', 'status' => true],

            // DOH Family Planning & Reproductive Health
            ['name' => 'Microlut 30mcg', 'generic_name' => 'Levonorgestrel', 'category' => 'Family Planning & Reproductive Health', 'dosage_form' => 'Tablet', 'description' => 'Progestogen-only contraceptive pill.', 'status' => true],
            ['name' => 'Depot Trust Injection', 'generic_name' => 'Medroxyprogesterone Acetate', 'category' => 'Family Planning & Reproductive Health', 'dosage_form' => 'Vial', 'description' => 'Contraceptive depot injection (3-month efficacy).', 'status' => true],
            ['name' => 'Lactofem', 'generic_name' => 'Ethinylestradiol + Levonorgestrel', 'category' => 'Family Planning & Reproductive Health', 'dosage_form' => 'Tablet', 'description' => 'Combined oral contraceptive pill.', 'status' => true],

            // Maternal Health & Pediatrics Supplements
            ['name' => 'Hemarate FA', 'generic_name' => 'Ferrous Sulfate + Folic Acid', 'category' => 'PhilHealth YAKAP / Vitamin (Maternal Health)', 'dosage_form' => 'Tablet', 'description' => 'For anemia prevention and prenatal care.', 'status' => true],
            ['name' => 'Neurobion', 'generic_name' => 'Vitamin B Complex', 'category' => 'PhilHealth YAKAP / Vitamin', 'dosage_form' => 'Tablet', 'description' => 'For nerve health.', 'status' => true],
            ['name' => 'Caltrate Plus', 'generic_name' => 'Calcium + Vitamin D', 'category' => 'Vitamin', 'dosage_form' => 'Tablet', 'description' => 'Bone health supplement.', 'status' => true],
            ['name' => 'Poten-Cee 500mg', 'generic_name' => 'Ascorbic Acid', 'category' => 'Vitamin', 'dosage_form' => 'Tablet', 'description' => 'Vitamin C supplement.', 'status' => true],

            // DOH National Immunization Program (EPI)
            ['name' => 'Pentavalent Vaccine', 'generic_name' => 'DPT-HepB-Hib Vaccine', 'category' => 'National Immunization Program (EPI)', 'dosage_form' => 'Vial', 'description' => 'Protects against Diphtheria, Pertussis, Tetanus, HepB, and Hib.', 'status' => true],
            ['name' => 'MMR Vaccine', 'generic_name' => 'Measles, Mumps, Rubella Vaccine', 'category' => 'National Immunization Program (EPI)', 'dosage_form' => 'Vial', 'description' => 'EPI vaccine for infants.', 'status' => true],
            ['name' => 'BCG Vaccine', 'generic_name' => 'Bacillus Calmette-Guérin', 'category' => 'National Immunization Program (EPI)', 'dosage_form' => 'Vial', 'description' => 'Anti-tuberculosis vaccine for newborns.', 'status' => true],

            // Animal Bite Treatment Program
            ['name' => 'Rabipur Vaccine', 'generic_name' => 'Rabies Vaccine (Purified Chick Embryo)', 'category' => 'Animal Bite Treatment Program', 'dosage_form' => 'Vial', 'description' => 'Active immunization against Rabies.', 'status' => true],
            ['name' => 'Equirab 200IU/mL', 'generic_name' => 'Rabies Immunoglobulin (Equine)', 'category' => 'Animal Bite Treatment Program', 'dosage_form' => 'Vial', 'description' => 'Passive immunization for Category III rabies exposure.', 'status' => true],

            // DOH Mental Health Program
            ['name' => 'Risperdal 2mg', 'generic_name' => 'Risperidone', 'category' => 'Mental Health Program', 'dosage_form' => 'Tablet', 'description' => 'Atypical antipsychotic for schizophrenia or bipolar disorder.', 'status' => true],
            ['name' => 'Prozac 20mg', 'generic_name' => 'Fluoxetine', 'category' => 'Mental Health Program', 'dosage_form' => 'Capsule', 'description' => 'SSRI antidepressant.', 'status' => true],

            // DOH NCD Care Program / Cardiology & Diabetes (PhilHealth YAKAP)
            ['name' => 'Norvasc 5mg', 'generic_name' => 'Amlodipine', 'category' => 'PhilHealth YAKAP / Cardiology (Antihypertensive)', 'dosage_form' => 'Tablet', 'description' => 'For NCD Hypertension control.', 'status' => true],
            ['name' => 'Cozaar 50mg', 'generic_name' => 'Losartan', 'category' => 'PhilHealth YAKAP / Cardiology (Antihypertensive)', 'dosage_form' => 'Tablet', 'description' => 'For NCD Hypertension control.', 'status' => true],
            ['name' => 'Lipitor 20mg', 'generic_name' => 'Atorvastatin', 'category' => 'PhilHealth YAKAP / Cardiology (Lipid-Lowering)', 'dosage_form' => 'Tablet', 'description' => 'For cholesterol control.', 'status' => true],
            ['name' => 'Neobloc 50mg', 'generic_name' => 'Metoprolol', 'category' => 'PhilHealth YAKAP / Cardiology (Beta Blocker)', 'dosage_form' => 'Tablet', 'description' => 'For rate control and hypertension.', 'status' => true],
            ['name' => 'Glucophage 500mg', 'generic_name' => 'Metformin', 'category' => 'PhilHealth YAKAP / Endocrinology (Antidiabetic)', 'dosage_form' => 'Tablet', 'description' => 'For NCD Type 2 Diabetes control.', 'status' => true],
            ['name' => 'Diamicron 80mg', 'generic_name' => 'Gliclazide', 'category' => 'PhilHealth YAKAP / Endocrinology (Antidiabetic)', 'dosage_form' => 'Tablet', 'description' => 'For NCD Type 2 Diabetes control.', 'status' => true],
            ['name' => 'Forxiga 10mg', 'generic_name' => 'Dapagliflozin', 'category' => 'PhilHealth YAKAP / Endocrinology (Antidiabetic)', 'dosage_form' => 'Tablet', 'description' => 'For diabetes management.', 'status' => true],

            // Antibiotics & Infectious Disease (PhilHealth YAKAP)
            ['name' => 'Amoxil 500mg', 'generic_name' => 'Amoxicillin', 'category' => 'PhilHealth YAKAP / Infectious Disease (Antibiotic)', 'dosage_form' => 'Capsule', 'description' => 'For susceptible bacterial infections.', 'status' => true],
            ['name' => 'Augmentin 625mg', 'generic_name' => 'Co-Amoxiclav', 'category' => 'PhilHealth YAKAP / Infectious Disease (Antibiotic)', 'dosage_form' => 'Tablet', 'description' => 'For severe bacterial infections.', 'status' => true],
            ['name' => 'Zithromax 500mg', 'generic_name' => 'Azithromycin', 'category' => 'PhilHealth YAKAP / Infectious Disease (Antibiotic)', 'dosage_form' => 'Tablet', 'description' => 'For respiratory infections.', 'status' => true],
            ['name' => 'Cipro 500mg', 'generic_name' => 'Ciprofloxacin', 'category' => 'PhilHealth YAKAP / Infectious Disease (Antibiotic)', 'dosage_form' => 'Tablet', 'description' => 'For urinary and systemic infections.', 'status' => true],
            ['name' => 'Flagyl 500mg', 'generic_name' => 'Metronidazole', 'category' => 'Infectious Disease / Antiprotozoal', 'dosage_form' => 'Tablet', 'description' => 'For anaerobic infections.', 'status' => true],

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
