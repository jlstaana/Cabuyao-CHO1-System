<?php
$file = 'backend/database/seeders/MedicineSeeder.php';
$content = file_get_contents($file);

$replacements = [
    "'category' => 'General /" => "'category' => 'General Medicine /",
    "'category' => 'Pediatrics /" => "'category' => 'General Medicine / Pediatrics - ",
    "'category' => 'Infectious Disease /" => "'category' => 'General Medicine / Infectious Disease - ",
    "'category' => 'Gastroenterology /" => "'category' => 'General Medicine / Gastroenterology - ",
    "'category' => 'Dermatology /" => "'category' => 'General Medicine / Dermatology - ",
    "'category' => 'ENT /" => "'category' => 'General Medicine / ENT - ",
    "'category' => 'Hematology /" => "'category' => 'General Medicine / Hematology - ",
    "'category' => 'OB-GYN /" => "'category' => 'General Medicine / OB-GYN - ",
    "'category' => 'Wound Care /" => "'category' => 'General Medicine / Wound Care - ",
    "'category' => 'Ophthalmology /" => "'category' => 'General Medicine / Ophthalmology - ",
    "'category' => 'Dental /" => "'category' => 'General Medicine / Dental - "
];

$content = str_replace(array_keys($replacements), array_values($replacements), $content);

// Add mental health medicines before the closing bracket of the array
$mentalMeds = "
            // Psychiatric / Mental Health Medicines
            ['name' => 'Sertraline 50mg', 'category' => 'Psychiatry / SSRI', 'dosage_form' => 'Tablet', 'description' => 'For depression and anxiety disorders. Common reference: 50mg once daily.', 'status' => true],
            ['name' => 'Escitalopram 10mg', 'category' => 'Psychiatry / SSRI', 'dosage_form' => 'Tablet', 'description' => 'For depression and generalized anxiety. Common reference: 10mg once daily.', 'status' => true],
            ['name' => 'Fluoxetine 20mg', 'category' => 'Psychiatry / SSRI', 'dosage_form' => 'Capsule', 'description' => 'For depression, OCD, or panic disorder. Common reference: 20mg once daily in the morning.', 'status' => true],
            ['name' => 'Quetiapine 25mg', 'category' => 'Psychiatry / Atypical Antipsychotic', 'dosage_form' => 'Tablet', 'description' => 'For mood stabilization or sleep support in selected cases. Common reference: 25mg nightly.', 'status' => true],
            ['name' => 'Clonazepam 2mg', 'category' => 'Psychiatry / Benzodiazepine', 'dosage_form' => 'Tablet', 'description' => 'For severe acute anxiety or seizure disorder. strictly prescription only.', 'status' => true],
        ];";

$content = str_replace('        ];', $mentalMeds, $content);

file_put_contents($file, $content);
echo "Medicines updated successfully.";
