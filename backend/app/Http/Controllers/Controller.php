<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

abstract class Controller
{
    protected function sendActivityAlert($user, $title, $subtitle, $details = null, $actionUrl = null)
    {
        // Fire and forget to avoid delaying the response. In a real app, this should be queued.
        try {
            Mail::send('emails.activity-alert', [
                'title' => $title,
                'subtitle' => $subtitle,
                'details' => $details,
                'actionUrl' => $actionUrl,
            ], function ($message) use ($user, $title) {
                $message->to($user->email)->subject('Cabuyao CHO1: ' . $title);
            });
        } catch (\Throwable $e) {
            Log::warning('Unable to send activity alert email.', [
                'user_id' => $user->id ?? 'unknown',
                'email' => $user->email ?? 'unknown',
                'error' => $e->getMessage(),
            ]);
        }
    }
}
