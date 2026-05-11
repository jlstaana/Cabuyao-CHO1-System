<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>E-Prescription</title>
    <style>
        @page {
            margin: 24px;
        }
        body {
            font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
            color: #111827;
            line-height: 1.45;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }
        .container {
            width: 100%;
            margin: 0 auto;
            padding: 24px 28px;
            box-sizing: border-box;
            border: 1px solid #cbd5e1;
        }
        .header {
            border-bottom: 4px solid #0369a1;
            padding-bottom: 14px;
            margin-bottom: 18px;
            text-align: center;
        }
        .header .republic {
            color: #475569;
            font-size: 11px;
            margin: 0 0 2px 0;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .header h1 {
            color: #075985;
            margin: 0;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 0.7px;
        }
        .header h2 {
            color: #0f172a;
            margin: 2px 0 4px 0;
            font-size: 15px;
            text-transform: uppercase;
        }
        .header p {
            margin: 1px 0;
            color: #475569;
            font-size: 11px;
        }
        .meta-bar {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 12px;
        }
        .meta-bar td {
            padding: 4px 0;
            vertical-align: top;
        }
        .patient-box {
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            margin-bottom: 14px;
        }
        .patient-grid {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        .patient-grid td {
            padding: 5px 6px;
            vertical-align: bottom;
        }
        .label {
            color: #475569;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            font-weight: bold;
        }
        .line-value {
            border-bottom: 1px solid #94a3b8;
            min-height: 18px;
            color: #0f172a;
            font-size: 13px;
            font-weight: bold;
        }
        .rx-symbol {
            font-size: 70px;
            font-weight: bold;
            font-family: DejaVu Serif, serif;
            color: #0f172a;
            margin: 8px 0 4px 0;
            line-height: 1;
        }
        .medicines-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 18px;
            font-size: 12px;
        }
        .medicines-table th {
            background-color: #e0f2fe;
            color: #0c4a6e;
            font-weight: bold;
            text-align: left;
            padding: 9px 10px;
            border: 1px solid #bae6fd;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.4px;
        }
        .medicines-table td {
            padding: 11px 10px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .medicine-name {
            font-weight: bold;
            color: #0f172a;
            font-size: 15px;
            margin-bottom: 4px;
        }
        .medicine-desc {
            font-size: 11px;
            color: #64748b;
        }
        .instructions {
            border: 1px solid #cbd5e1;
            padding: 12px 14px;
            margin-bottom: 22px;
            min-height: 54px;
        }
        .instructions h3 {
            margin-top: 0;
            color: #0f172a;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .instructions p {
            margin: 0;
            color: #475569;
            font-size: 12px;
        }
        .footer {
            margin-top: 28px;
            padding-top: 18px;
            border-top: 2px solid #cbd5e1;
        }
        .validity {
            float: left;
            width: 45%;
            font-size: 10px;
            color: #475569;
        }
        .signature-box {
            float: right;
            text-align: center;
            width: 280px;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            height: 34px;
            margin-bottom: 8px;
        }
        .doctor-name {
            font-weight: bold;
            color: #0f172a;
            margin: 0 0 2px 0;
            text-transform: uppercase;
        }
        .doctor-license {
            font-size: 12px;
            color: #64748b;
            margin: 0 0 2px 0;
        }
        .stamp {
            color: #b91c1c;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid #b91c1c;
            display: inline-block;
            padding: 4px 9px;
            transform: rotate(-5deg);
            opacity: 0.75;
            margin-top: 12px;
        }
        .small-note {
            color: #64748b;
            font-size: 10px;
            margin-top: 16px;
            text-align: center;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
    </style>
</head>
<body>
    @php
        $patient = $prescription->patient;
        $patientUser = optional($patient)->user;
        $doctor = $prescription->doctor;
        $doctorUser = optional($doctor)->user;
        $patientAge = optional($patient)->dob ? \Carbon\Carbon::parse($patient->dob)->age : null;
    @endphp

    <div class="container">
        <div class="header">
            <p class="republic">Republic of the Philippines</p>
            <p class="republic">Province of Laguna</p>
            <h1>City Government of Cabuyao</h1>
            <h2>City Health Office I</h2>
            <p>Brgy. Poblacion, City of Cabuyao, Laguna</p>
            <p>Tel. No.: (049) 534-1234 | Email: cho@cabuyao.gov.ph</p>
        </div>

        <table class="meta-bar">
            <tr>
                <td><strong>Prescription No.:</strong> RX-{{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }}</td>
                <td style="text-align: right;"><strong>Date:</strong> {{ $prescription->created_at->format('F d, Y') }}</td>
            </tr>
            <tr>
                <td><strong>Patient ID:</strong> PT-{{ str_pad($prescription->patient_id, 5, '0', STR_PAD_LEFT) }}</td>
                <td style="text-align: right;"><strong>Consultation ID:</strong> CN-{{ str_pad($prescription->consultation_id, 6, '0', STR_PAD_LEFT) }}</td>
            </tr>
        </table>

        <div class="patient-box">
            <table class="patient-grid">
                <tr>
                    <td width="56%">
                        <div class="label">Name</div>
                        <div class="line-value">{{ optional($patientUser)->name ?? 'Unknown Patient' }}</div>
                    </td>
                    <td width="14%">
                        <div class="label">Age</div>
                        <div class="line-value">{{ $patientAge ?: 'N/A' }}</div>
                    </td>
                    <td width="14%">
                        <div class="label">Sex</div>
                        <div class="line-value">N/A</div>
                    </td>
                    <td width="16%">
                        <div class="label">Date</div>
                        <div class="line-value">{{ $prescription->created_at->format('m/d/Y') }}</div>
                    </td>
                </tr>
                <tr>
                    <td colspan="4">
                        <div class="label">Address</div>
                        <div class="line-value">{{ optional($patient)->address ?: 'N/A' }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="rx-symbol">Rx</div>

        <table class="medicines-table">
            <thead>
                <tr>
                    <th width="40%">Medicine</th>
                    <th width="20%">Dosage</th>
                    <th width="40%">Frequency / Instructions</th>
                </tr>
            </thead>
            <tbody>
                @foreach($prescription->items as $item)
                <tr>
                    <td>
                        <div class="medicine-name">{{ optional($item->medicine)->name ?? 'Medicine unavailable' }}</div>
                        <div class="medicine-desc">
                            {{ optional($item->medicine)->category ?? 'General Medicine' }}
                            @if(optional($item->medicine)->dosage_form)
                                | {{ optional($item->medicine)->dosage_form }}
                            @endif
                        </div>
                    </td>
                    <td><strong>{{ $item->dosage ?: 'As directed' }}</strong></td>
                    <td>
                        {{ $item->frequency ?: 'As directed by physician' }}
                        @if($item->duration)
                            <br><strong>Duration:</strong> {{ $item->duration }}
                        @endif
                        @if($item->instructions)
                            <br>{{ $item->instructions }}
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="instructions">
            <h3>Diagnosis / Clinical Notes</h3>
            <p>{{ $prescription->notes ?: 'Please take all medications exactly as prescribed. For adverse reactions or worsening symptoms, contact the City Health Office or proceed to the nearest health facility.' }}</p>
        </div>

        <div class="footer clearfix">
            <div class="validity">
                <p><strong>Reminder:</strong> Present this prescription with a valid ID when claiming medicines or purchasing from a pharmacy.</p>
                <p>This electronically generated prescription is issued through the Cabuyao CHO-I Telehealth System.</p>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <p class="doctor-name">Dr. {{ optional($doctorUser)->name ?? 'Attending Physician' }}</p>
                <p class="doctor-license">PRC Lic. No.: {{ optional($doctor)->license_no ?: 'PRC-' . str_pad($prescription->doctor_id, 6, '0', STR_PAD_LEFT) }}</p>
                <p class="doctor-license">{{ optional($doctor)->specialization ?? 'General Practice' }}</p>
                <p class="doctor-license">PTR No.: ____________ &nbsp; S2 No.: ____________</p>
                <div class="stamp">E-SIGNED</div>
            </div>
        </div>

        <div class="small-note">
            This document was generated electronically and is valid without a wet signature when verified through Cabuyao CHO-I records.
        </div>
    </div>
</body>
</html>
