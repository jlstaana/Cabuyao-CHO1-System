const fs = require('fs');
let file = fs.readFileSync('database/seeders/UserSeeder.php', 'utf-8');

const staffBlock = /\/\/\ 3\.\ Create Staff Account[\s\S]*?\]\);/g;
file = file.replace(staffBlock, '');

fs.writeFileSync('database/seeders/UserSeeder.php', file);
console.log('Removed Staff from Seeder');
