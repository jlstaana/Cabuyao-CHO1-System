<?php
namespace App\Http\Controllers;
use App\Models\Medicine;
use Illuminate\Http\Request;

class MedicineController extends Controller {
    public function index(Request $request) {
        $user = $request->user();
        if ($user->role === 'Admin' || $user->role === 'Staff') {
            return response()->json(Medicine::with('batches')->get());
        }
        return response()->json(Medicine::with('batches')->where('status', true)->get());
    }
    public function store(Request $request) {
        $data = $request->validate([
            'name' => 'required|string',
            'generic_name' => 'nullable|string',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'dosage_form' => 'nullable|string',
        ]);
        $m = Medicine::create(array_merge($data, ['status' => true]));
        
        // Also handle optional initial batch creation if provided
        if ($request->has('batch_number') && $request->has('stock') && $request->has('expiration_date')) {
            $m->batches()->create([
                'batch_number' => $request->batch_number,
                'stock' => $request->stock,
                'expiration_date' => $request->expiration_date,
            ]);
        }
        
        $m->load('batches');
        return response()->json($m, 201);
    }
    public function update(Request $request, $id) {
        $m = Medicine::findOrFail($id);
        $data = $request->validate([
            'name' => 'required|string',
            'generic_name' => 'nullable|string',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'dosage_form' => 'nullable|string',
            'status' => 'nullable|boolean',
        ]);
        $m->update($data);
        $m->load('batches');
        return response()->json($m);
    }
    public function deactivate($id) {
        Medicine::findOrFail($id)->update(['status' => false]);
        return response()->json(['message' => 'Deactivated']);
    }

    public function addBatch(Request $request, $id) {
        $m = Medicine::findOrFail($id);
        $data = $request->validate([
            'batch_number' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'expiration_date' => 'required|date',
        ]);
        $m->batches()->create($data);
        $m->load('batches');
        return response()->json($m);
    }

    public function updateBatch(Request $request, $id, $batchId) {
        $m = Medicine::findOrFail($id);
        $batch = $m->batches()->findOrFail($batchId);
        $data = $request->validate([
            'batch_number' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'expiration_date' => 'required|date',
        ]);
        $batch->update($data);
        $m->load('batches');
        return response()->json($m);
    }
    
    public function deleteBatch($id, $batchId) {
        $m = Medicine::findOrFail($id);
        $m->batches()->findOrFail($batchId)->delete();
        $m->load('batches');
        return response()->json($m);
    }
}
