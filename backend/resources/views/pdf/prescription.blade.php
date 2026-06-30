<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>E-Prescription</title>
    <style>
        @page {
            margin: 14px 18px;
        }

        body {
            font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
            color: #111827;
            line-height: 1.28;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        .container {
            width: 90%;
            margin: 0 auto;
            padding: 14px 18px;
            box-sizing: border-box;
            border: 1px solid #cbd5e1;
        }

        .header {
            border-bottom: 3px solid #0369a1;
            padding-bottom: 8px;
            margin-bottom: 10px;
            text-align: center;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .header-table td {
            vertical-align: middle;
        }

        .logo-cell {
            width: 96px;
            text-align: center;
        }

        .heading-cell {
            text-align: center;
        }

        .header-logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
        }

        .seal-fallback {
            width: 58px;
            height: 58px;
            border: 2px solid #0369a1;
            border-radius: 50%;
            color: #075985;
            font-size: 9px;
            font-weight: bold;
            line-height: 1.2;
            padding-top: 14px;
            box-sizing: border-box;
            text-align: center;
            text-transform: uppercase;
        }

        .header .republic {
            color: #475569;
            font-size: 11px;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .header h1 {
            color: #075985;
            margin: 0;
            font-size: 21px;
            text-transform: uppercase;
            letter-spacing: 0.7px;
        }

        .header h2 {
            color: #0f172a;
            margin: 1px 0 2px 0;
            font-size: 13px;
            text-transform: uppercase;
        }

        .header p {
            margin: 1px 0;
            color: #475569;
            font-size: 10px;
        }

        .meta-bar {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 12px;
        }

        .meta-bar td {
            padding: 2px 0;
            vertical-align: top;
        }

        .patient-box {
            border: 1px solid #cbd5e1;
            padding: 5px 7px;
            margin-bottom: 6px;
        }

        .patient-grid {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }

        .patient-grid td {
            padding: 2px 4px;
            vertical-align: bottom;
            text-align: left;
        }

        .label {
            color: #475569;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            font-weight: bold;
        }

        .line-value {
            border-bottom: 1px solid #94a3b8;
            min-height: 13px;
            color: #0f172a;
            font-size: 11px;
            font-weight: bold;
        }

        .rx-symbol {
            text-align: left;
            font-size: 38px;
            font-weight: bold;
            font-family: DejaVu Serif, serif;
            color: #075985;
            margin: 2px 0 0 0;
            line-height: 1;
        }

        .rx-title {
            text-align: center;
            color: #0f172a;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            margin: 0 0 5px 0;
        }

        .rx-divider {
            border: 0;
            border-top: 1px solid #94a3b8;
            margin: 0 0 8px 0;
        }

        .medicines-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            margin-bottom: 10px;
            font-size: 12px;
        }

        .medicines-table th {
            background-color: #e0f2fe;
            color: #0c4a6e;
            font-weight: bold;
            text-align: left;
            padding: 4px 6px;
            border: 1px solid #bae6fd;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.4px;
        }

        .medicines-table td {
            padding: 5px 6px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
            text-align: left;
        }

        .medicines-table tr,
        .instructions,
        .footer {
            page-break-inside: avoid;
        }

        .medicine-name {
            font-weight: bold;
            color: #0f172a;
            font-size: 12px;
            margin-bottom: 2px;
        }

        .medicine-desc {
            font-size: 10px;
            color: #64748b;
        }

        .instructions {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            margin-bottom: 8px;
            min-height: 30px;
            text-align: left;
        }

        .instructions h3 {
            margin-top: 0;
            margin-bottom: 3px;
            color: #0f172a;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        .instructions p {
            margin: 0;
            color: #475569;
            font-size: 11px;
        }

        .footer {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 2px solid #cbd5e1;
        }

        .validity {
            float: left;
            width: 45%;
            font-size: 9px;
            color: #475569;
            margin-bottom: 12px;
            text-align: left;
        }

        .signature-box {
            float: right;
            text-align: center;
            width: 220px;
        }

        .signature-space {
            width: 180px;
            height: 24px;
            margin: 0 auto 3px auto;
            border-bottom: 1px solid #000;
            text-align: center;
        }

        .signature-image {
            width: 60px;
            height: auto;
            max-height: 18px;
            margin: 0 auto;
            display: block;
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
            margin: 0 0 1px 0;
        }

        .stamp {
            color: #b91c1c;
            font-size: 10px;
            font-weight: bold;
            border: 2px solid #b91c1c;
            display: inline-block;
            padding: 4px 9px;
            transform: rotate(-5deg);
            opacity: 0.75;
            margin-top: 6px;
        }

        .small-note {
            color: #64748b;
            font-size: 9px;
            margin-top: 9px;
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
        $choLogoPath = public_path('images/cho1-logo.jpg');
        $municipalLogoPath = public_path('images/municipal-logo.jpg');
    @endphp

    <div class="container">
        <div class="header">
            <table class="header-table">
                <tr>
                    <td class="logo-cell">
                        @if(file_exists($municipalLogoPath))
                            <img class="header-logo" src="{{ $municipalLogoPath }}" alt="City Government of Cabuyao Logo">
                        @else
                            <div class="seal-fallback">City of<br>Cabuyao</div>
                        @endif
                    </td>
                    <td class="heading-cell">
                        <p class="republic">Republic of the Philippines</p>
                        <h1>CITY OF CABUYAO</h1>
                        <p class="republic">Province of Laguna</p>

                        <h1>Office of the City Health Doctor</h1>

                    </td>
                    <td class="logo-cell">
                        @if(file_exists($choLogoPath))
                            <img class="header-logo" src="{{ $choLogoPath }}" alt="CHO-I Logo">
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <table class="meta-bar">
            <tr>
                <td><strong>Prescription No.:</strong> RX-{{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }}</td>
                <td style="text-align: right;"><strong>Date:</strong> {{ $prescription->created_at->format('F d, Y') }}
                </td>
            </tr>
            <tr>
                <td><strong>Patient ID:</strong> PT-{{ str_pad($prescription->patient_id, 5, '0', STR_PAD_LEFT) }}</td>
                <td style="text-align: right;"><strong>Consultation ID:</strong>
                    CN-{{ str_pad($prescription->consultation_id, 6, '0', STR_PAD_LEFT) }}</td>
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
        <div class="rx-title">Electronic Prescription</div>
        <hr class="rx-divider">

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
            <p>{{ $prescription->notes ?: 'Please take all medications exactly as prescribed. For adverse reactions or worsening symptoms, contact the City Health Office or proceed to the nearest health facility.' }}
            </p>
        </div>

        <div class="footer clearfix">
            <div class="validity">
                <p><strong>Reminder:</strong> Follow the prescribed dosage and consult your physician or the City Health Office for any adverse reaction.</p>
                <p>This electronically generated prescription is issued through the Cabuyao CHO-I Telehealth System.</p>
            </div>
            <div class="signature-box">
                <div class="signature-space">
                    @if(!empty($doctorSignatureSrc))
                        <img class="signature-image" src="{{ $doctorSignatureSrc }}" alt="Doctor e-signature">
                    @endif
                </div>
                <p class="doctor-name">Dr. {{ optional($doctorUser)->name ?? 'Attending Physician' }}</p>
                <p class="doctor-license">PRC Lic. No.:
                    {{ optional($doctor)->license_no ?: 'PRC-' . str_pad($prescription->doctor_id, 6, '0', STR_PAD_LEFT) }}
                </p>
                <p class="doctor-license">{{ optional($doctor)->specialization ?? 'General Practice' }}</p>
                <p class="doctor-license">PTR No.: ____________ &nbsp; S2 No.: ____________</p>
                <div class="stamp">E-SIGNED</div>
            </div>
        </div>

        <div class="small-note">
            This document was generated electronically and is valid without a wet signature when verified through
            Cabuyao CHO-I records.
        </div>
    </div>
</body>

</html>