<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Medicine;
use App\Models\Consultation;
use App\Models\ConsultationForm;
use App\Models\VitalSign;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\MedicalImage;
use App\Models\ConsultationMessage;
use App\Models\AuditLog;
use App\Models\PatientRecord;
use App\Models\PatientRecordVersion;
use App\Models\PrescriptionVersion;
use App\Models\DoctorAvailability;
use App\Models\DoctorScheduleException;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class ConsultationSeeder extends Seeder {
    public function run(): void {
        // Fetch all doctors (exactly 3 General Medicine doctors)
        $doctors = Doctor::all();
        if ($doctors->isEmpty()) {
            return;
        }

        // Fetch all patients
        $patients = Patient::all();
        if ($patients->isEmpty()) {
            return;
        }

        // Fetch all medicines
        $medicines = Medicine::all();

        // 1. Seed Doctor Availabilities & Exceptions
        $daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        foreach ($doctors as $doctor) {
            foreach ($daysOfWeek as $day) {
                DoctorAvailability::updateOrCreate([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $day,
                ], [
                    'start_time' => '08:00:00',
                    'end_time' => '17:00:00',
                ]);
            }

            // Seed a future vacation/seminar day exception
            DoctorScheduleException::create([
                'doctor_id' => $doctor->id,
                'date' => Carbon::now()->addDays(rand(3, 10))->format('Y-m-d'),
                'type' => 'leave',
                'reason' => 'Attending Annual Medical Board Convention.',
            ]);
        }

        // Symptoms & Diagnosis cases mapping
        $casePool = [
            [
                'ss' => 'Fever, dry cough, and fatigue for 3 days.',
                'diag' => 'Acute Nasopharyngitis (Common Cold)',
                'notes' => 'Drink plenty of fluids. Rest. Take Paracetamol for fever.',
                'temp_min' => 37.8, 'temp_max' => 38.9,
                'bp_sys_min' => 110, 'bp_sys_max' => 125, 'bp_dia_min' => 70, 'bp_dia_max' => 85,
                'hr_min' => 80, 'hr_max' => 95,
                'resp_min' => 16, 'resp_max' => 20,
                'ox_min' => 97, 'ox_max' => 99,
                'med_generic' => 'Paracetamol',
                'med_dosage' => '500mg',
                'med_freq' => 'Every 4-6 hours as needed for fever',
                'med_dur' => '3-5 days'
            ],
            [
                'ss' => 'Headache, lightheadedness, and slight neck stiffness.',
                'diag' => 'Essential Hypertension',
                'notes' => 'Limit sodium and fat intake. Avoid stressful situations. Take daily maintenance drugs.',
                'temp_min' => 36.3, 'temp_max' => 36.8,
                'bp_sys_min' => 140, 'bp_sys_max' => 160, 'bp_dia_min' => 90, 'bp_dia_max' => 105,
                'hr_min' => 65, 'hr_max' => 80,
                'resp_min' => 14, 'resp_max' => 18,
                'ox_min' => 98, 'ox_max' => 100,
                'med_generic' => 'Amlodipine',
                'med_dosage' => '5mg',
                'med_freq' => 'Once daily in the morning',
                'med_dur' => '30 days'
            ],
            [
                'ss' => 'Burning sensation in chest, sour taste in mouth, bloating.',
                'diag' => 'Gastroesophageal Reflux Disease (GERD)',
                'notes' => 'Avoid caffeine, spicy and fatty foods. Do not lie down immediately after eating.',
                'temp_min' => 36.2, 'temp_max' => 36.9,
                'bp_sys_min' => 110, 'bp_sys_max' => 120, 'bp_dia_min' => 70, 'bp_dia_max' => 80,
                'hr_min' => 60, 'hr_max' => 76,
                'resp_min' => 12, 'resp_max' => 16,
                'ox_min' => 99, 'ox_max' => 100,
                'med_generic' => 'Omeprazole',
                'med_dosage' => '20mg',
                'med_freq' => 'Once daily, 30 minutes before breakfast',
                'med_dur' => '14 days'
            ],
            [
                'ss' => 'Sore throat, pain when swallowing, and hoarseness of voice.',
                'diag' => 'Acute Pharyngitis',
                'notes' => 'Warm salt water gargles. Increase hydration. Avoid cold drinks.',
                'temp_min' => 37.2, 'temp_max' => 38.0,
                'bp_sys_min' => 115, 'bp_sys_max' => 125, 'bp_dia_min' => 75, 'bp_dia_max' => 82,
                'hr_min' => 75, 'hr_max' => 88,
                'resp_min' => 15, 'resp_max' => 18,
                'ox_min' => 98, 'ox_max' => 99,
                'med_generic' => 'Amoxicillin',
                'med_dosage' => '500mg',
                'med_freq' => 'Three times daily (completed course)',
                'med_dur' => '7 days'
            ],
            [
                'ss' => 'Sneezing, nasal congestion, runny nose, and watery eyes.',
                'diag' => 'Allergic Rhinitis',
                'notes' => 'Avoid known allergens, dust, and pollen. Take antihistamine as prescribed.',
                'temp_min' => 36.4, 'temp_max' => 36.8,
                'bp_sys_min' => 110, 'bp_sys_max' => 122, 'bp_dia_min' => 70, 'bp_dia_max' => 80,
                'hr_min' => 64, 'hr_max' => 78,
                'resp_min' => 14, 'resp_max' => 17,
                'ox_min' => 98, 'ox_max' => 100,
                'med_generic' => 'Cetirizine',
                'med_dosage' => '10mg',
                'med_freq' => 'Once daily at bedtime',
                'med_dur' => '7 days'
            ],
            [
                'ss' => 'Cough with whitish phlegm, wheezing, and mild dyspnea.',
                'diag' => 'Acute Bronchitis',
                'notes' => 'Take mucolytics. Steam inhalation. Return for review if dyspnea worsens.',
                'temp_min' => 36.8, 'temp_max' => 37.6,
                'bp_sys_min' => 120, 'bp_sys_max' => 130, 'bp_dia_min' => 80, 'bp_dia_max' => 88,
                'hr_min' => 82, 'hr_max' => 94,
                'resp_min' => 18, 'resp_max' => 22,
                'ox_min' => 95, 'ox_max' => 97,
                'med_generic' => 'Carbocisteine',
                'med_dosage' => '500mg',
                'med_freq' => 'Three times daily',
                'med_dur' => '7 days'
            ],
            [
                'ss' => 'Increased thirst, frequent urination, and unexplained weight loss.',
                'diag' => 'Type 2 Diabetes Mellitus',
                'notes' => 'Follow up in 2 weeks with Fasting Blood Sugar (FBS) results. Strict low carb diet.',
                'temp_min' => 36.3, 'temp_max' => 36.7,
                'bp_sys_min' => 120, 'bp_sys_max' => 135, 'bp_dia_min' => 80, 'bp_dia_max' => 85,
                'hr_min' => 70, 'hr_max' => 82,
                'resp_min' => 15, 'resp_max' => 19,
                'ox_min' => 97, 'ox_max' => 99,
                'med_generic' => 'Metformin',
                'med_dosage' => '500mg',
                'med_freq' => 'Twice daily with meals',
                'med_dur' => '30 days'
            ]
        ];

        // Chat message template pool
        $chatTemplates = [
            [
                ['sender' => 'patient', 'msg' => 'Hi doctor, I am uploading my lab report for your review.'],
                ['sender' => 'doctor', 'msg' => 'Thank you. I have received it. Your white blood cell count is slightly elevated, which is consistent with the pharyngitis. Please keep taking the prescribed Amoxicillin.'],
                ['sender' => 'patient', 'msg' => 'Understood, doc. I will finish the full 7-day course. Thank you!']
            ],
            [
                ['sender' => 'patient', 'msg' => 'Hello Doc, I started taking the Amlodipine today, but I feel slightly dizzy.'],
                ['sender' => 'doctor', 'msg' => 'Mild dizziness can occur when starting BP medication. Rest for a bit. Please monitor your blood pressure again tonight and message me the reading.'],
                ['sender' => 'patient', 'msg' => 'Okay, doc. I will do that and update you later. Thanks.']
            ],
            [
                ['sender' => 'patient', 'msg' => 'Good day, Doctor. Can I take the stomach medicine before coffee?'],
                ['sender' => 'doctor', 'msg' => 'It is best to take Omeprazole 30 minutes before your first meal or drink. However, with GERD, you should try to limit coffee intake as it can trigger acid reflux.'],
                ['sender' => 'patient', 'msg' => 'I will try to cut down on coffee, Doc. Thank you for the advice.']
            ],
            [
                ['sender' => 'patient', 'msg' => 'Hi doctor, my cough is much better now, do I still need to take the Carbocisteine?'],
                ['sender' => 'doctor', 'msg' => 'If the phlegm has cleared and you no longer have a chesty cough, you may stop taking the mucolytic.'],
                ['sender' => 'patient', 'msg' => 'Awesome, thank you doctor!']
            ]
        ];

        // 2. Past Consultations: June 1, 2026 to August 25, 2026
        $pastPeriod = CarbonPeriod::create('2026-06-01', '2026-08-25');
        
        foreach ($pastPeriod as $date) {
            // Generate some random audit logs for each day
            $logCount = rand(5, 10);
            for ($k = 0; $k < $logCount; $k++) {
                $randomPatient = $patients->random();
                $randomDoctor = $doctors->random();
                $actions = [
                    ['act' => 'User Login', 'desc' => "Patient {$randomPatient->user->name} logged in from IP."],
                    ['act' => 'User Login', 'desc' => "Doctor {$randomDoctor->user->name} logged in from IP."],
                    ['act' => 'View Patient Profile', 'desc' => "Doctor {$randomDoctor->user->name} viewed patient record ID {$randomPatient->id}."],
                    ['act' => 'Access Medical Gallery', 'desc' => "Patient {$randomPatient->user->name} accessed their medical documents."]
                ];
                $actData = $actions[array_rand($actions)];
                AuditLog::create([
                    'user_id' => rand(0, 1) === 0 ? $randomPatient->user_id : $randomDoctor->user_id,
                    'action' => $actData['act'],
                    'description' => $actData['desc'],
                    'ip_address' => '127.0.0.1',
                    'created_at' => $date->copy()->hour(rand(7, 21))->minute(rand(0, 59)),
                ]);
            }

            foreach ($doctors as $doctor) {
                // 5 to 10 completed patients per doctor per day
                $patientCount = rand(5, 10);
                $selectedPatients = $patients->random($patientCount);

                foreach ($selectedPatients as $patient) {
                    $scheduledAt = $date->copy()->hour(rand(8, 17))->minute(rand(0, 59))->second(rand(0, 59));

                    // Create completed consultation
                    $consultation = Consultation::create([
                        'patient_id' => $patient->id,
                        'doctor_id' => $doctor->id,
                        'requested_specialization' => 'General Medicine',
                        'status' => 'Completed',
                        'scheduled_at' => $scheduledAt,
                        'created_at' => $scheduledAt,
                        'updated_at' => $scheduledAt,
                    ]);

                    $case = $casePool[array_rand($casePool)];

                    // Create Form
                    ConsultationForm::create([
                        'consultation_id' => $consultation->id,
                        'symptoms' => $case['ss'],
                        'diagnosis' => $case['diag'],
                        'notes' => $case['notes'],
                        'created_at' => $scheduledAt,
                        'updated_at' => $scheduledAt,
                    ]);

                    // Vital signs
                    $temp = number_format(rand($case['temp_min'] * 10, $case['temp_max'] * 10) / 10, 1);
                    $bp_sys = rand($case['bp_sys_min'], $case['bp_sys_max']);
                    $bp_dia = rand($case['bp_dia_min'], $case['bp_dia_max']);
                    $bp = "{$bp_sys}/{$bp_dia}";
                    $hr = rand($case['hr_min'], $case['hr_max']);
                    $resp = rand($case['resp_min'], $case['resp_max']);
                    $ox = rand($case['ox_min'], $case['ox_max']);
                    
                    $dob = Carbon::parse($patient->dob);
                    $age = $dob->age;
                    if ($age < 12) {
                        $height = rand(100, 140) . ' cm';
                        $weight = rand(18, 35) . ' kg';
                    } elseif ($age < 18) {
                        $height = rand(145, 165) . ' cm';
                        $weight = rand(40, 55) . ' kg';
                    } else {
                        $height = rand(150, 180) . ' cm';
                        $weight = rand(45, 95) . ' kg';
                    }

                    VitalSign::create([
                        'consultation_id' => $consultation->id,
                        'patient_id' => $patient->id,
                        'height' => $height,
                        'weight' => $weight,
                        'blood_pressure' => $bp,
                        'heart_rate' => $hr . ' bpm',
                        'temperature' => $temp . ' °C',
                        'respiratory' => $resp . ' cpm',
                        'oxygen' => $ox . '%',
                        'created_at' => $scheduledAt,
                        'updated_at' => $scheduledAt,
                    ]);

                    // Prescriptions (75% probability)
                    if (!$medicines->isEmpty() && rand(1, 100) <= 75) {
                        $prescription = Prescription::create([
                            'consultation_id' => $consultation->id,
                            'patient_id' => $patient->id,
                            'doctor_id' => $doctor->id,
                            'notes' => 'Take medicines regularly as directed. Complete courses where applicable.',
                            'created_at' => $scheduledAt,
                            'updated_at' => $scheduledAt,
                        ]);

                        $medMatch = $medicines->first(function($med) use ($case) {
                            return stripos($med->generic_name, $case['med_generic']) !== false ||
                                   stripos($med->name, $case['med_generic']) !== false;
                        });
                        $medId = $medMatch ? $medMatch->id : $medicines->random()->id;

                        $pItem = PrescriptionItem::create([
                            'prescription_id' => $prescription->id,
                            'medicine_id' => $medId,
                            'dosage' => $case['med_dosage'],
                            'frequency' => $case['med_freq'],
                            'duration' => $case['med_dur'],
                            'instructions' => 'Take with plenty of water.',
                            'created_at' => $scheduledAt,
                            'updated_at' => $scheduledAt,
                        ]);

                        // Seed a prescription version for audit trail (10% chance of edit)
                        if (rand(1, 100) <= 10) {
                            PrescriptionVersion::create([
                                'prescription_id' => $prescription->id,
                                'version' => 1,
                                'snapshot' => [
                                    'notes' => $prescription->notes,
                                    'items' => [
                                        [
                                            'medicine_id' => $medId,
                                            'dosage' => $case['med_dosage'],
                                            'frequency' => 'As directed',
                                            'duration' => $case['med_dur']
                                        ]
                                    ]
                                ],
                                'updated_by' => $doctor->user_id,
                                'created_at' => $scheduledAt->copy()->subMinutes(10),
                            ]);
                        }
                    }

                    // Medical Images (10% chance) - X-Rays or Lab Results
                    if (rand(1, 100) <= 10) {
                        $imgTypes = [
                            ['path' => 'medical_gallery/xray_chest_sample.png', 'name' => 'Chest_XRay.png', 'type' => 'image/png', 'doc' => 'X-Ray', 'notes' => 'Chest PA view. Normal lung fields, no infiltrates.'],
                            ['path' => 'medical_gallery/cbc_report.pdf', 'name' => 'CBC_Result.pdf', 'type' => 'application/pdf', 'doc' => 'Lab Result', 'notes' => 'Complete Blood Count report. Hemoglobin levels normal.'],
                            ['path' => 'medical_gallery/urinalysis.jpg', 'name' => 'Urinalysis_Report.jpg', 'type' => 'image/jpeg', 'doc' => 'Lab Result', 'notes' => 'Urinalysis shows no significant abnormalities.']
                        ];
                        $img = $imgTypes[array_rand($imgTypes)];
                        MedicalImage::create([
                            'consultation_id' => $consultation->id,
                            'patient_id' => $patient->id,
                            'file_path' => $img['path'],
                            'original_name' => $img['name'],
                            'file_type' => $img['type'],
                            'mime_type' => $img['type'],
                            'document_type' => $img['doc'],
                            'notes' => $img['notes'],
                            'file_size' => rand(100000, 2000000),
                            'created_at' => $scheduledAt,
                            'updated_at' => $scheduledAt,
                        ]);
                    }

                    // Consultation Messages (8% chance)
                    if (rand(1, 100) <= 8) {
                        $thread = $chatTemplates[array_rand($chatTemplates)];
                        $msgTime = $scheduledAt->copy()->subHours(1);
                        foreach ($thread as $chat) {
                            $msgTime = $msgTime->addMinutes(rand(5, 15));
                            ConsultationMessage::create([
                                'consultation_id' => $consultation->id,
                                'sender_id' => $chat['sender'] === 'patient' ? $patient->user_id : $doctor->user_id,
                                'message' => $chat['msg'],
                                'created_at' => $msgTime,
                                'updated_at' => $msgTime,
                            ]);
                        }
                    }

                    // Patient Record Versioning history (5% chance)
                    if (rand(1, 100) <= 5) {
                        PatientRecordVersion::create([
                            'patient_id' => $patient->id,
                            'snapshot' => [
                                'medical_history' => 'No known drug allergies. Previous checkup normal.',
                            ],
                            'updated_by' => $doctor->user_id,
                            'created_at' => $scheduledAt,
                        ]);
                    }
                }
            }
        }

        // 3. Current & Future Consultations: August 26, 2026 to September 5, 2026
        $futurePeriod = CarbonPeriod::create('2026-08-26', '2026-09-05');

        foreach ($futurePeriod as $date) {
            foreach ($doctors as $doctor) {
                // 2 to 4 consultations per doctor per day
                $upcomingCount = rand(2, 4);
                $selectedPatients = $patients->random($upcomingCount);

                foreach ($selectedPatients as $patient) {
                    $scheduledAt = $date->copy()->hour(rand(8, 16))->minute(rand(0, 5) * 10)->second(0);
                    
                    // Future slots can be Scheduled, Pending, or Cancelled
                    $randStatus = rand(1, 100);
                    if ($randStatus <= 75) {
                        $status = 'Scheduled';
                    } elseif ($randStatus <= 92) {
                        $status = 'Pending';
                    } else {
                        $status = 'Cancelled';
                    }

                    // Create consultation
                    $consultation = Consultation::create([
                        'patient_id' => $patient->id,
                        'doctor_id' => $doctor->id,
                        'requested_specialization' => 'General Medicine',
                        'status' => $status,
                        'scheduled_at' => $scheduledAt,
                        'created_at' => $scheduledAt->copy()->subDays(rand(1, 3)),
                        'updated_at' => $scheduledAt->copy()->subDays(rand(1, 3)),
                    ]);

                    // Add a consultation form with symptoms only for Pending/Scheduled
                    $case = $casePool[array_rand($casePool)];
                    ConsultationForm::create([
                        'consultation_id' => $consultation->id,
                        'symptoms' => $case['ss'],
                        'diagnosis' => $status === 'Cancelled' ? 'Cancelled Appointment' : null,
                        'notes' => $status === 'Cancelled' ? 'Patient cancelled the scheduled slot.' : null,
                    ]);

                    // Cancelled consultations might have cancellation reason/notes
                    if ($status === 'Cancelled') {
                        AuditLog::create([
                            'user_id' => rand(0, 1) === 0 ? $patient->user_id : $doctor->user_id,
                            'action' => 'Cancel Consultation',
                            'description' => "Consultation ID {$consultation->id} between Doctor {$doctor->user->name} and Patient {$patient->user->name} was cancelled.",
                            'ip_address' => '127.0.0.1',
                            'created_at' => $scheduledAt->copy()->subHours(rand(2, 24)),
                        ]);
                    }

                    // A few chats pre-consultation
                    if ($status !== 'Cancelled' && rand(1, 100) <= 25) {
                        ConsultationMessage::create([
                            'consultation_id' => $consultation->id,
                            'sender_id' => $patient->user_id,
                            'message' => 'Hello doctor, I have booked a slot. Is it okay to join 5 minutes early?',
                            'created_at' => $scheduledAt->copy()->subHours(4),
                        ]);
                        ConsultationMessage::create([
                            'consultation_id' => $consultation->id,
                            'sender_id' => $doctor->user_id,
                            'message' => 'Hello! Yes, that is fine. I will call you as soon as I am ready.',
                            'created_at' => $scheduledAt->copy()->subHours(3),
                        ]);
                    }
                }
            }
        }
    }
}
