<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Prescription;

$p = Prescription::latest()->first();
$svg = $p->doctor_signature_svg;

// Strip complex attributes
$svg = preg_replace('/stroke-width="[^"]*"/i', 'stroke-width="2"', $svg);
$svg = preg_replace('/stroke-linecap="[^"]*"/i', '', $svg);
$svg = preg_replace('/stroke-linejoin="[^"]*"/i', '', $svg);
$svg = preg_replace('/preserveAspectRatio="[^"]*"/i', '', $svg);
$svg = preg_replace('/(<svg[^>]*?)\s+width="[^"]*"/i', '$1', $svg);
$svg = preg_replace('/(<svg[^>]*?)\s+height="[^"]*"/i', '$1', $svg);

// Dynamic transform
if (preg_match('/viewBox="([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)"/i', $svg, $matches)) {
    $minX = (float) $matches[1];
    $minY = (float) $matches[2];
    $vWidth = (float) $matches[3];
    $vHeight = (float) $matches[4];
    
    $scaleX = 80 / max(1, $vWidth);
    $scaleY = 24 / max(1, $vHeight);
    $scale = min($scaleX, $scaleY);
    
    // Scale stroke-width to compensate
    // if scale is 0.15, stroke-width 2 becomes 0.3. We want it to be around 2.
    // So stroke-width should be 2 / scale.
    $sw = round(2 / $scale, 1);
    $svg = preg_replace('/stroke-width="[^"]*"/i', 'stroke-width="' . $sw . '"', $svg);
    
    $svg = preg_replace('/(<svg[^>]*?)\s+viewBox="[^"]*"/i', '$1', $svg);
    $svg = preg_replace('/(<path)/i', '<g transform="scale(' . $scale . ') translate(-' . $minX . ', -' . $minY . ')">$1', $svg);
    $svg = preg_replace('/(<\/svg>)/i', '</g>$1', $svg);
    $svg = preg_replace('/(<svg)/i', '$1 viewBox="0 0 80 24" width="80" height="24"', $svg, 1);
}

$base64 = base64_encode($svg);
$img = '<img src="data:image/svg+xml;base64,' . $base64 . '" width="80" height="24" style="border: none; outline: none; vertical-align: bottom;"/>';

$html = '<html><head><style>
.footer-table { width: 100%; margin-top: 30px; font-size: 9pt; }
.footer-table td { vertical-align: bottom; }
.signature-col { width: 45%; text-align: center; }
</style></head><body>
<table class="footer-table">
    <tr>
        <td style="width:55%;">Text</td>
        <td class="signature-col">
            <table width="160" align="center" style="margin: 0 auto; border-collapse: collapse;">
                <tr>
                    <td align="center" style="height: 30px; border-bottom: 1px solid #000; text-align: center; vertical-align: bottom; padding: 0;">
                        ' . $img . '
                    </td>
                </tr>
            </table>
            <p style="text-align:center;">Dr. Name</p>
        </td>
    </tr>
</table>
</body></html>';

$pdf = Pdf::loadHTML($html);
$pdf->save('test_align8.pdf');

echo "Saved test_align8.pdf\n";
