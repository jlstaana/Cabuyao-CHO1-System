<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 20px;
            box-sizing: border-box;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid #f1f5f9;
        }
        .header {
            background-color: #0ea5e9;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #0f172a;
            margin-top: 0;
            margin-bottom: 10px;
        }
        .message {
            font-size: 15px;
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .info-container {
            background-color: #f0f9ff;
            border: 1px solid #7dd3fc;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: left;
        }
        .info-text {
            font-size: 14px;
            color: #0369a1;
            margin: 0;
            line-height: 1.5;
        }
        .action-button {
            display: inline-block;
            background-color: #0ea5e9;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 20px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            font-size: 12px;
            color: #cbd5e1;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Cabuyao CHO1</h1>
            </div>
            <div class="content">
                <h2 class="greeting">{{ $title }}</h2>
                <p class="message">{{ $subtitle }}</p>
                
                @if(isset($details))
                <div class="info-container">
                    <p class="info-text">{!! nl2br(e($details)) !!}</p>
                </div>
                @endif
                
                @if(isset($actionUrl))
                <a href="{{ $actionUrl }}" class="action-button">{{ $actionText ?? 'View Details' }}</a>
                @endif
            </div>
            <div class="footer">
                &copy; {{ date('Y') }} Cabuyao City Health Office 1. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
