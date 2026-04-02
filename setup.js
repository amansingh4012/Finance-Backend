// Setup script to create directories
const fs = require('fs');
const path = require('path');

const baseDir = 'd:\\PROJECTS\\assignment';

const directories = [
  'src/config',
  'src/middlewares',
  'src/modules/auth',
  'src/modules/users',
  'src/modules/records',
  'src/modules/dashboard',
  'src/shared/types',
  'src/shared/utils',
  'src/shared/errors',
  'prisma',
  'tests/unit',
  'tests/integration',
];

directories.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log(`Created: ${fullPath}`);
});

console.log('\\nAll directories created successfully!');
