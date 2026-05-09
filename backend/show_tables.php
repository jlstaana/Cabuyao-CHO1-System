<?php
try {
    $db = new PDO('mysql:host=127.0.0.1;port=3306;dbname=cabuyao_cho', 'root', '');
    $stmt = $db->query('SHOW TABLES;');
    while($row = $stmt->fetch(PDO::FETCH_NUM)) {
        echo $row[0] . "\n";
    }
} catch (PDOException $e) {
    echo 'Error: ' . $e->getMessage();
}
