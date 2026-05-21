<?php

namespace App\Http\Controllers;

use App\Models\MedicalImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MedicalImageController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'Patient' || !$user->patient) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $images = MedicalImage::where('patient_id', $user->patient->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($images);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'Patient' || !$user->patient) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'image' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'document_type' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000'
        ]);

        $file = $request->file('image');
        $path = $file->store('medical_images', 'public');

        $medicalImage = MedicalImage::create([
            'patient_id' => $user->patient->id,
            'consultation_id' => null, // No longer required
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'file_type' => $file->getClientOriginalExtension(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'document_type' => $request->document_type ?? 'Other',
            'notes' => $request->notes
        ]);

        return response()->json([
            'message' => 'File uploaded successfully',
            'image' => $medicalImage
        ], 201);
    }
}
