<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function profile(Request $request)
    {
        return response()->json($request->user()->load('doctor'));
    }

    public function updateProfile(Request $request)
    {
        if ($request->filled('name')) {
            $request->user()->update(['name' => $request->name]);
        }

        $doctor = $request->user()->doctor;
        if ($doctor) {
            $doctor->update($request->only(['specialization', 'license_no']));
        }

        return response()->json($request->user()->load('doctor'));
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Doctor $doctor)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Doctor $doctor)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Doctor $doctor)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Doctor $doctor)
    {
        //
    }
}
