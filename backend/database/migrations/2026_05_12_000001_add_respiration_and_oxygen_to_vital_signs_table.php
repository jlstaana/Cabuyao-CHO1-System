<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('vital_signs', function (Blueprint $table) {
            if (!Schema::hasColumn('vital_signs', 'respiratory')) {
                $table->string('respiratory')->nullable()->after('temperature');
            }
            if (!Schema::hasColumn('vital_signs', 'oxygen')) {
                $table->string('oxygen')->nullable()->after('respiratory');
            }
        });
    }

    public function down(): void {
        Schema::table('vital_signs', function (Blueprint $table) {
            $drops = array_values(array_filter(['respiratory', 'oxygen'], fn ($column) => Schema::hasColumn('vital_signs', $column)));
            if ($drops) {
                $table->dropColumn($drops);
            }
        });
    }
};
