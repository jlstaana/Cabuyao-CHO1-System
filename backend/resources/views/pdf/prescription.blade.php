<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>E-Prescription</title>
    <style>
        @page {
            margin: 14px 20px;
        }

        body {
            font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
            color: #111827;
            font-size: 8.5px;
            line-height: 1.15;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        .container {
            width: 100%;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        .header {
            border-bottom: 1.5px solid #0369a1;
            padding-bottom: 6px;
            margin-bottom: 6px;
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
            width: 70px;
            text-align: center;
        }

        .heading-cell {
            text-align: center;
        }

        .header-logo {
            width: 55px;
            height: 55px;
            object-fit: contain;
        }

        .seal-fallback {
            width: 55px;
            height: 55px;
            border: 1.5px solid #0369a1;
            border-radius: 50%;
            color: #075985;
            font-size: 8px;
            font-weight: bold;
            line-height: 1.1;
            padding-top: 18px;
            box-sizing: border-box;
            text-align: center;
            text-transform: uppercase;
        }

        .header .republic {
            color: #475569;
            font-size: 8px;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        .header h1 {
            color: #000000;
            margin: 1px 0;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .header h2 {
            color: #0369a1;
            margin: 2px 0 0 0;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .header p {
            margin: 1px 0;
            color: #475569;
            font-size: 8px;
        }

        .meta-bar {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
            font-size: 8.5px;
        }

        .meta-bar td {
            padding: 1px 0;
            vertical-align: top;
        }

        .patient-box {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            margin-bottom: 4px;
        }

        .patient-grid {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
        }

        .patient-grid td {
            padding: 1.5px 3px;
            vertical-align: bottom;
            text-align: left;
        }

        .label {
            color: #475569;
            font-size: 7.5px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: bold;
        }

        .line-value {
            border-bottom: 1px solid #94a3b8;
            min-height: 11px;
            color: #0f172a;
            font-size: 8.5px;
            font-weight: bold;
        }

        .rx-symbol {
            text-align: left;
            font-size: 22px;
            font-weight: bold;
            font-family: DejaVu Serif, serif;
            color: #075985;
            margin: 1px 0 0 0;
            line-height: 1;
        }

        .rx-title {
            text-align: center;
            color: #0f172a;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 3px 0;
        }

        .rx-divider {
            border: 0;
            border-top: 1px solid #94a3b8;
            margin: 0 0 4px 0;
        }

        .medicines-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2px;
            margin-bottom: 5px;
            font-size: 8px;
            table-layout: fixed;
        }

        .medicines-table th {
            background-color: #e0f2fe;
            color: #0c4a6e;
            font-weight: bold;
            text-align: left;
            padding: 3px 5px;
            border: 1px solid #bae6fd;
            text-transform: uppercase;
            font-size: 8px;
            letter-spacing: 0.3px;
        }

        .medicines-table td {
            padding: 3.5px 5px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
            text-align: left;
            word-wrap: break-word;
        }

        .medicines-table tr {
            page-break-inside: avoid;
        }
        
        .instructions, .footer-table {
            page-break-inside: avoid;
        }

        .medicine-name {
            font-weight: bold;
            color: #0f172a;
            font-size: 8.5px;
            margin-bottom: 1px;
        }

        .medicine-desc {
            font-size: 7.5px;
            color: #64748b;
        }

        .instructions {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            margin-bottom: 5px;
            min-height: 20px;
            text-align: left;
        }

        .instructions h3 {
            margin-top: 0;
            margin-bottom: 2px;
            color: #0f172a;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .instructions p {
            margin: 0;
            color: #475569;
            font-size: 8px;
            line-height: 1.15;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2px;
            font-size: 8px;
        }

        .footer-table td {
            vertical-align: top;
            padding: 0;
        }

        .validity {
            width: 58%;
            padding-right: 10px;
            color: #64748b;
            font-size: 7.5px;
            line-height: 1.15;
        }

        .validity p {
            margin: 1px 0;
        }

        .signature-col {
            width: 42%;
            text-align: center;
        }

        .doctor-name {
            font-weight: bold;
            color: #0f172a;
            font-size: 9px;
            margin: 2px 0 0 0;
            text-transform: uppercase;
        }

        .doctor-license {
            font-size: 7.5px;
            color: #475569;
            margin: 1px 0 0 0;
        }

        .stamp {
            font-size: 7.5px;
            color: #b91c1c;
            font-weight: bold;
            border: 1.5px solid #b91c1c;
            display: inline-block;
            padding: 2px 6px;
            transform: rotate(-4deg);
            opacity: 0.8;
            margin-top: 3px;
        }

        .small-note {
            color: #64748b;
            font-size: 7.5px;
            margin-top: 4px;
            text-align: center;
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
                        <h2>Office of the City Health Officer</h2>
                    </td>
                    <td class="logo-cell">
                        @if(file_exists($choLogoPath))
                            <img class="header-logo" src="{{ $choLogoPath }}" alt="CHO-I Logo">
                        @else
                            <div class="seal-fallback">CHO-I<br>Cabuyao</div>
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <table class="meta-bar">
            <tr>
                <td><strong>Prescription No.:</strong> RX-{{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }}</td>
                <td style="text-align: right;"><strong>Date:</strong> {{ $prescription->created_at ? $prescription->created_at->format('F d, Y') : date('F d, Y') }}</td>
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
                        <div class="line-value">{{ $patientAge ? $patientAge . ' yrs' : 'N/A' }}</div>
                    </td>
                    <td width="14%">
                        <div class="label">Sex</div>
                        <div class="line-value">N/A</div>
                    </td>
                    <td width="16%">
                        <div class="label">Date</div>
                        <div class="line-value">{{ $prescription->created_at ? $prescription->created_at->format('m/d/Y') : date('m/d/Y') }}</div>
                    </td>
                </tr>
                <tr>
                    <td colspan="4">
                        <div class="label">Address</div>
                        <div class="line-value">{{ optional($patient)->address ?: 'City of Cabuyao, Laguna' }}</div>
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
                    <th width="42%">Medicine & Description</th>
                    <th width="20%">Dosage</th>
                    <th width="38%">Frequency / Duration</th>
                </tr>
            </thead>
            <tbody>
                @foreach($prescription->items as $item)
                    <tr>
                        <td>
                            <div class="medicine-name">
                                {{ optional($item->medicine)->name ?? 'Medicine unavailable' }}
                                @if(optional($item->medicine)->generic_name)
                                    <span style="font-weight: normal; font-size: 8px; color: #475569;">({{ optional($item->medicine)->generic_name }})</span>
                                @endif
                            </div>
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

        <table class="footer-table">
            <tr>
                <td class="validity">
                    <p><strong>Reminder:</strong> Follow the prescribed dosage and consult your physician or the City Health Office for any adverse reaction.</p>
                    <p>This electronically generated prescription is officially issued through the Cabuyao CHO-I Telehealth System.</p>
                </td>
                <td class="signature-col">
                    <table width="140" align="center" style="margin: 0 auto; border-collapse: collapse;">
                        <tr>
                            <td align="center" style="height: 24px; border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; padding: 0;">
                                @if(!empty($doctorSignatureSrc))
                                    {!! $doctorSignatureSrc !!}
                                @endif
                            </td>
                        </tr>
                    </table>
                    <p class="doctor-name">Dr. {{ optional($doctorUser)->name ?? 'Attending Physician' }}</p>
                    <p class="doctor-license">PRC Lic. No.: {{ optional($doctor)->license_no ?: 'PRC-' . str_pad($prescription->doctor_id, 6, '0', STR_PAD_LEFT) }}</p>
                    <p class="doctor-license">{{ optional($doctor)->specialization ?? 'General Practice' }}</p>
                    <p class="doctor-license">PTR No.: ____________ &nbsp; S2 No.: ____________</p>
                    <div class="stamp">E-SIGNED</div>
                </td>
            </tr>
        </table>

        <div class="small-note">
            This electronically signed document is officially verified by the Cabuyao CHO-I Telehealth System.
        </div>
    </div>
</body>

</html>
