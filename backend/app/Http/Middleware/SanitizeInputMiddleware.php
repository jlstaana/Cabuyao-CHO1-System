<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInputMiddleware
{
    /**
     * Sanitize all incoming request inputs against XSS and HTML injection.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();

        if (!empty($input)) {
            $sanitize = function (&$value, $key) use (&$sanitize) {
                if (is_array($value)) {
                    foreach ($value as $k => &$v) {
                        $sanitize($v, $k);
                    }
                } elseif (is_string($value)) {
                    $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $value);
                    $value = preg_replace('/javascript:/i', '', $value);
                    $value = preg_replace('/on[a-z]+\s*=/i', '', $value);
                    
                    if ($key !== 'doctor_signature_svg') {
                        $value = trim(strip_tags($value));
                    } else {
                        $value = trim($value);
                    }
                }
            };
            
            foreach ($input as $key => &$val) {
                $sanitize($val, $key);
            }

            $request->replace($input);
        }

        return $next($request);
    }
}
