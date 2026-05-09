<?php
namespace App\Http\Controllers;
use App\Models\Medicine;
use Illuminate\Http\Request;

class MedicineController extends Controller {
    public function index() { return response()->json(Medicine::where('status', true)->get()); }
    public function store(Request $request) {
        $m = Medicine::create($request->all());
        return response()->json($m);
    }
    public function update(Request $request, $id) {
        $m = Medicine::findOrFail($id);
        $m->update($request->all());
        return response()->json($m);
    }
    public function deactivate($id) {
        Medicine::findOrFail($id)->update(['status' => false]);
        return response()->json(['message' => 'Deactivated']);
    }
}
