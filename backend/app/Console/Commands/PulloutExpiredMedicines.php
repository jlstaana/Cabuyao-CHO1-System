<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class PulloutExpiredMedicines extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:pullout-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically pull out all expired medicine batches by setting their stock to 0.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = now()->format('Y-m-d');
        
        $expiredBatches = \App\Models\MedicineBatch::where('expiration_date', '<', $today)
            ->where('stock', '>', 0)
            ->get();

        if ($expiredBatches->isEmpty()) {
            $this->info('No expired batches found to pull out.');
            return;
        }

        foreach ($expiredBatches as $batch) {
            $this->info("Pulling out batch {$batch->batch_number} (Expired on {$batch->expiration_date}) - Deducted {$batch->stock} units.");
            $batch->update(['stock' => 0]);
        }

        $this->info('Successfully pulled out ' . $expiredBatches->count() . ' expired batches.');
    }
}
