<?php
namespace App\Http\Controllers;
use App\Models\Medicine;
use Illuminate\Http\Request;

class MedicineController extends Controller {
    public function index(Request $request) {
        $user = $request->user();
        if ($user->role === 'Admin' || $user->role === 'Staff') {
            return response()->json(Medicine::all());
        }
        return response()->json(Medicine::where('status', true)->get());
    }
    public function store(Request $request) {
        $data = $request->validate([
            'name' => 'required|string',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'dosage_form' => 'nullable|string',
        ]);
        $m = Medicine::create(array_merge($data, ['status' => true]));
        return response()->json($m, 201);
    }
    public function update(Request $request, $id) {
        $m = Medicine::findOrFail($id);
        $data = $request->validate([
            'name' => 'required|string',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'dosage_form' => 'nullable|string',
            'status' => 'nullable|boolean',
        ]);
        $m->update($data);
        return response()->json($m);
    }
    public function deactivate($id) {
        Medicine::findOrFail($id)->update(['status' => false]);
        return response()->json(['message' => 'Deactivated']);
    }
}
