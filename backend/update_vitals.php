<?php
$vitals = App\Models\VitalSign::whereNull('patient_id')->whereNotNull('consultation_id')->with('consultation')->get();
foreach($vitals as $v){ 
    if($v->consultation) {
        $v->patient_id = $v->consultation->patient_id; 
        $v->save(); 
    }
}
echo "Done";
