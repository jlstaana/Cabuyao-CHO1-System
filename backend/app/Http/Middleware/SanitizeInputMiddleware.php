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
            array_walk_recursive($input, function (&$value) {
                if (is_string($value)) {
                    // Remove dangerous HTML/script tags and script execution patterns
                    $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $value);
                    $value = preg_replace('/javascript:/i', '', $value);
                    $value = preg_replace('/on[a-z]+\s*=/i', '', $value);
                    $value = trim(strip_tags($value));
                }
            });

            $request->merge($input);
        }

        return $next($request);
    }
}
