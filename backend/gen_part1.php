<?php
$base = __DIR__;

function write_file($path, $content) {
    global $base;
    $full = $base . '/' . $path;
    $dir = dirname($full);
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    file_put_contents($full, trim($content) . "\n");
}

// --- MODELS ---
write_file('app/Models/User.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable {
    use HasApiTokens, HasFactory, Notifiable;
    protected $fillable = ['name', 'email', 'password', 'role', 'first_login', 'is_active'];
    protected $hidden = ['password', 'remember_token'];
    protected function casts(): array { return ['email_verified_at' => 'datetime', 'password' => 'hashed', 'first_login' => 'boolean', 'is_active' => 'boolean']; }
    public function patient() { return $this->hasOne(Patient::class); }
    public function doctor() { return $this->hasOne(Doctor::class); }
    public function staff() { return $this->hasOne(Staff::class); }
}
EOF
);

write_file('app/Models/Patient.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model {
    protected $fillable = ['user_id', 'dob', 'address', 'contact_no', 'archived'];
    protected $casts = ['archived' => 'boolean', 'dob' => 'date'];
    public function user() { return $this->belongsTo(User::class); }
    public function record() { return $this->hasOne(PatientRecord::class); }
    public function consultations() { return $this->hasMany(Consultation::class); }
}
EOF
);

write_file('app/Models/PatientRecord.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PatientRecord extends Model {
    protected $fillable = ['patient_id', 'medical_history'];
    public function patient() { return $this->belongsTo(Patient::class); }
}
EOF
);

write_file('app/Models/Doctor.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Doctor extends Model {
    protected $fillable = ['user_id', 'specialization', 'license_no', 'active_until'];
    protected $casts = ['active_until' => 'datetime'];
    public function user() { return $this->belongsTo(User::class); }
    public function availability() { return $this->hasMany(DoctorAvailability::class); }
}
EOF
);

write_file('app/Models/Staff.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Staff extends Model {
    protected $fillable = ['user_id', 'department'];
    public function user() { return $this->belongsTo(User::class); }
}
EOF
);

write_file('app/Models/DoctorAvailability.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DoctorAvailability extends Model {
    protected $fillable = ['doctor_id', 'day_of_week', 'start_time', 'end_time'];
    public function doctor() { return $this->belongsTo(Doctor::class); }
}
EOF
);

write_file('app/Models/Consultation.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model {
    protected $fillable = ['patient_id', 'doctor_id', 'status', 'scheduled_at'];
    protected $casts = ['scheduled_at' => 'datetime'];
    public function patient() { return $this->belongsTo(Patient::class); }
    public function doctor() { return $this->belongsTo(Doctor::class); }
    public function form() { return $this->hasOne(ConsultationForm::class); }
    public function vitalSigns() { return $this->hasOne(VitalSign::class); }
    public function medicalImages() { return $this->hasMany(MedicalImage::class); }
    public function prescription() { return $this->hasOne(Prescription::class); }
}
EOF
);

write_file('app/Models/ConsultationForm.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ConsultationForm extends Model {
    protected $fillable = ['consultation_id', 'symptoms', 'diagnosis', 'notes'];
    public function consultation() { return $this->belongsTo(Consultation::class); }
}
EOF
);

write_file('app/Models/VitalSign.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class VitalSign extends Model {
    protected $fillable = ['consultation_id', 'height', 'weight', 'blood_pressure', 'heart_rate', 'temperature'];
    public function consultation() { return $this->belongsTo(Consultation::class); }
}
EOF
);

write_file('app/Models/MedicalImage.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class MedicalImage extends Model {
    protected $fillable = ['consultation_id', 'patient_id', 'file_path', 'file_type', 'file_size'];
    public function consultation() { return $this->belongsTo(Consultation::class); }
}
EOF
);

write_file('app/Models/Prescription.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model {
    protected $fillable = ['consultation_id', 'patient_id', 'doctor_id', 'notes'];
    public function items() { return $this->hasMany(PrescriptionItem::class); }
    public function consultation() { return $this->belongsTo(Consultation::class); }
}
EOF
);

write_file('app/Models/PrescriptionItem.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PrescriptionItem extends Model {
    protected $fillable = ['prescription_id', 'medicine_id', 'dosage', 'frequency', 'duration', 'instructions'];
    public function prescription() { return $this->belongsTo(Prescription::class); }
    public function medicine() { return $this->belongsTo(Medicine::class); }
}
EOF
);

write_file('app/Models/Medicine.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model {
    protected $fillable = ['name', 'category', 'dosage_form', 'unit', 'description', 'status'];
    protected $casts = ['status' => 'boolean'];
}
EOF
);

write_file('app/Models/AuditLog.php', <<<'EOF'
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model {
    protected $fillable = ['user_id', 'action', 'description', 'ip_address'];
    public function user() { return $this->belongsTo(User::class); }
}
EOF
);

// --- MIGRATION CONSOLIDATION ---
// To avoid conflicts with previously generated migrations, we create one massive migration
// that creates all tables, and we delete the old ones.

$migrationFiles = glob($base . '/database/migrations/*_create_*.php');
foreach($migrationFiles as $file) {
    if(strpos($file, '0001_01_01_000000_create_users_table.php') !== false) continue;
    if(strpos($file, '0001_01_01_000001_create_cache_table.php') !== false) continue;
    if(strpos($file, '0001_01_01_000002_create_jobs_table.php') !== false) continue;
    if(strpos($file, 'personal_access_tokens') !== false) continue;
    unlink($file);
}

write_file('database/migrations/2026_05_09_999999_create_telehealth_tables.php', <<<'EOF'
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['Admin', 'Doctor', 'Staff', 'Patient'])->default('Patient');
                $table->boolean('first_login')->default(true);
                $table->boolean('is_active')->default(true);
            }
        });

        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('dob')->nullable();
            $table->text('address')->nullable();
            $table->string('contact_no')->nullable();
            $table->boolean('archived')->default(false);
            $table->timestamps();
        });

        Schema::create('patient_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->text('medical_history')->nullable();
            $table->timestamps();
        });

        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('specialization');
            $table->string('license_no')->unique();
            $table->timestamp('active_until')->nullable();
            $table->timestamps();
        });

        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('department')->nullable();
            $table->timestamps();
        });

        Schema::create('doctor_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->string('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });

        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained();
            $table->foreignId('doctor_id')->nullable()->constrained();
            $table->enum('status', ['Pending', 'Approved', 'Scheduled', 'Completed', 'Cancelled'])->default('Pending');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('consultation_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->text('symptoms')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('vital_signs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->string('height')->nullable();
            $table->string('weight')->nullable();
            $table->string('blood_pressure')->nullable();
            $table->string('heart_rate')->nullable();
            $table->string('temperature')->nullable();
            $table->timestamps();
        });

        Schema::create('medical_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_type');
            $table->integer('file_size');
            $table->timestamps();
        });

        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('dosage_form')->nullable();
            $table->string('unit')->nullable();
            $table            $table->text('description')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });

        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained();
            $table->foreignId('patient_id')->constrained();
            $table->foreignId('doctor_id')->constrained();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained()->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained();
            $table->string('dosage')->nullable();
            $table->string('frequency')->nullable();
            $table->string('duration')->nullable();
            $table->text('instructions')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained();
            $table->string('action');
            $table->text('description')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('prescription_items');
        Schema::dropIfExists('prescriptions');
        Schema::dropIfExists('medicines');
        Schema::dropIfExists('medical_images');
        Schema::dropIfExists('vital_signs');
        Schema::dropIfExists('consultation_forms');
        Schema::dropIfExists('consultations');
        Schema::dropIfExists('doctor_availabilities');
        Schema::dropIfExists('staff');
        Schema::dropIfExists('doctors');
        Schema::dropIfExists('patient_records');
        Schema::dropIfExists('patients');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'first_login', 'is_active']);
        });
    }
};
EOF
);

echo "Models and Migrations generated.\n";

