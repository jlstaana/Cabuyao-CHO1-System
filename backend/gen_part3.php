<?php
$file = __DIR__ . '/bootstrap/app.php';
$content = file_get_contents($file);
if (strpos($content, "'role' =>") === false) {
    $content = str_replace(
        "->withMiddleware(function (Middleware \$middleware) {",
        "->withMiddleware(function (Middleware \$middleware) {\n        \$middleware->alias(['role' => \\App\\Http\\Middleware\\RoleMiddleware::class]);",
        $content
    );
    file_put_contents($file, $content);
    echo "Middleware alias registered.\n";
} else {
    echo "Middleware alias already registered.\n";
}
