<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('medical_images', function (Blueprint $table) {
            if (!Schema::hasColumn('medical_images', 'original_name')) {
                $table->string('original_name')->nullable()->after('file_path');
            }
            if (!Schema::hasColumn('medical_images', 'mime_type')) {
                $table->string('mime_type')->nullable()->after('file_type');
            }
            if (!Schema::hasColumn('medical_images', 'document_type')) {
                $table->string('document_type')->nullable()->after('mime_type');
            }
            if (!Schema::hasColumn('medical_images', 'notes')) {
                $table->text('notes')->nullable()->after('document_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('medical_images', function (Blueprint $table) {
            $columns = ['original_name', 'mime_type', 'document_type', 'notes'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('medical_images', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
