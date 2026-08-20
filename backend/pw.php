<?php
$u = \App\Models\User::where('email', 'patient@gmail.com')->first();
$u->password = \Illuminate\Support\Facades\Hash::make('password123');
$u->save();
echo "Done";
