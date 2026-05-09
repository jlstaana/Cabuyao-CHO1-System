<?php

// A script to quickly populate models and basic migrations
$migrationsPath = __DIR__ . '/database/migrations';
$modelsPath = __DIR__ . '/app/Models';

// Update Users migration (find it by name)
$files = scandir($migrationsPath);
foreach ($files as $file) {
    if (strpos($file, 'create_users_table') !== false) {
        $content = file_get_contents("$migrationsPath/$file");
        $content = str_replace(
            "\$table->string('email')->unique();",
            "\$table->string('email')->unique();\n            \$table->enum('role', ['Admin', 'Doctor', 'Staff', 'Patient'])->default('Patient');\n            \$table->boolean('first_login')->default(true);",
            $content
        );
        file_put_contents("$migrationsPath/$file", $content);
    }
}

echo "Scaffolding models and migrations...\n";

// Add relationships to User Model
$userModel = "$modelsPath/User.php";
if (file_exists($userModel)) {
    $content = file_get_contents($userModel);
    $content = str_replace(
        "class User extends Authenticatable",
        "class User extends Authenticatable\n{\n    public function patient() { return \$this->hasOne(Patient::class); }\n    public function doctor() { return \$this->hasOne(Doctor::class); }\n    public function staff() { return \$this->hasOne(Staff::class); }",
        $content
    );
    file_put_contents($userModel, $content);
}

echo "Done.\n";
