<?php

$pdo = new PDO('sqlite:' . __DIR__ . '/database/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$sql = "SELECT c.id as consultation_id, c.patient_id, p.user_id, u.name as patient_name, u.email, c.scheduled_at, c.status
        FROM consultations c
        LEFT JOIN patients p ON c.patient_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY c.id";

$rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

echo "=== ALL CONSULTATIONS WITH PATIENT NAMES (" . count($rows) . ") ===" . PHP_EOL;
foreach ($rows as $r) {
    echo "Consultation #{$r['consultation_id']} | Patient ID: {$r['patient_id']} | User ID: {$r['user_id']} | Name: {$r['patient_name']} | Status: {$r['status']}" . PHP_EOL;
}
