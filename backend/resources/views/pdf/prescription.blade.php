<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>E-Prescription</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #fff;
        }
        .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            box-sizing: border-box;
        }
        .header {
            border-bottom: 2px solid #0284c7;
            padding-bottom: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            color: #0284c7;
            margin: 0 0 5px 0;
            font-size: 28px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header p {
            margin: 0;
            color: #64748b;
            font-size: 14px;
        }
        .rx-symbol {
            font-size: 64px;
            font-weight: bold;
            font-family: serif;
            color: #0284c7;
            margin-bottom: 20px;
            line-height: 1;
        }
        .info-grid {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
        }
        .info-grid td {
            padding: 8px 0;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
            width: 120px;
        }
        .info-value {
            color: #0f172a;
        }
        .medicines-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
            margin-bottom: 40px;
        }
        .medicines-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            text-align: left;
            padding: 12px;
            border-bottom: 2px solid #cbd5e1;
        }
        .medicines-table td {
            padding: 15px 12px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .medicine-name {
            font-weight: bold;
            color: #0f172a;
            font-size: 16px;
            margin-bottom: 4px;
        }
        .medicine-desc {
            font-size: 13px;
            color: #64748b;
        }
        .instructions {
            background-color: #f8fafc;
            border-left: 4px solid #0284c7;
            padding: 15px 20px;
            margin-bottom: 40px;
        }
        .instructions h3 {
            margin-top: 0;
            color: #0f172a;
            font-size: 16px;
        }
        .instructions p {
            margin: 0;
            color: #475569;
        }
        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        .signature-box {
            float: right;
            text-align: center;
            width: 250px;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            height: 40px;
            margin-bottom: 10px;
        }
        .doctor-name {
            font-weight: bold;
            color: #0f172a;
            margin: 0;
        }
        .doctor-license {
            font-size: 12px;
            color: #64748b;
            margin: 0;
        }
        .stamp {
            color: #ef4444;
            font-size: 14px;
            font-weight: bold;
            border: 2px solid #ef4444;
            display: inline-block;
            padding: 5px 10px;
            transform: rotate(-5deg);
            opacity: 0.7;
            margin-top: 20px;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Cabuyao City Health Office</h1>
            <p>123 National Highway, City of Cabuyao, Laguna</p>
            <p>Contact: (049) 534-1234 | Email: cho@cabuyao.gov.ph</p>
        </div>

        <table class="info-grid">
            <tr>
                <td class="info-label">Patient Name:</td>
                <td class="info-value"><strong>{{ optional(optional($prescription->patient)->user)->name ?? 'Unknown Patient' }}</strong></td>
                <td class="info-label">Date Issued:</td>
                <td class="info-value">{{ $prescription->created_at->format('M d, Y') }}</td>
            </tr>
            <tr>
                <td class="info-label">Patient ID:</td>
                <td class="info-value">PT-{{ str_pad($prescription->patient_id, 5, '0', STR_PAD_LEFT) }}</td>
                <td class="info-label">Prescription #:</td>
                <td class="info-value">RX-{{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }}</td>
            </tr>
        </table>

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
                        <div class="medicine-desc">{{ optional($item->medicine)->category ?? 'General Medicine' }}</div>
                    </td>
                    <td><strong>{{ $item->dosage }}</strong></td>
                    <td>{{ $item->frequency }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="instructions">
            <h3>Clinical Diagnosis / Notes</h3>
            <p>{{ $prescription->notes ?: 'Please take all medications exactly as prescribed above. If you experience any severe allergic reactions, contact the clinic immediately.' }}</p>
        </div>

        <div class="footer clearfix">
            <div style="float: left; width: 40%;">
                <p style="font-size: 12px; color: #94a3b8; margin-top: 40px;">
                    * This is a digitally generated e-prescription.<br>
                    Valid for dispensing at any pharmacy.
                </p>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <p class="doctor-name">Dr. {{ optional(optional($prescription->doctor)->user)->name ?? 'Attending Physician' }}</p>
                <p class="doctor-license">Lic No: {{ optional($prescription->doctor)->license_no ?: 'PRC-' . str_pad($prescription->doctor_id, 6, '0', STR_PAD_LEFT) }}</p>
                <p class="doctor-license">{{ optional($prescription->doctor)->specialization ?? 'General Practice' }}</p>
                <div class="stamp">E-SIGNED VALID</div>
            </div>
        </div>
    </div>
</body>
</html>
