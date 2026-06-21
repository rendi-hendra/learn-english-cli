import fs from 'fs';
import path from 'path';

function resolvePath(allowedRoot: string, inputPath: string): string {
  const resolvedPath = path.resolve(allowedRoot, inputPath);
  
  const relativePath = path.relative(allowedRoot, resolvedPath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Access denied: Path '${inputPath}' is outside the allowed root`);
  }
  
  return resolvedPath;
}

const allowedRoot = process.cwd();
console.log('Allowed root:', allowedRoot);

try {
  console.log('Testing valid paths:');
  console.log('- Relative path "test.txt":', resolvePath(allowedRoot, 'test.txt'));
  console.log('- Relative path "./test.txt":', resolvePath(allowedRoot, './test.txt'));
  console.log('- Relative path "subdir/test.txt":', resolvePath(allowedRoot, 'subdir/test.txt'));
  
  console.log('\nTesting invalid paths:');
  try {
    console.log('- Absolute path "/etc/passwd":', resolvePath(allowedRoot, '/etc/passwd'));
  } catch (error: any) {
    console.log('- Absolute path "/etc/passwd":', error.message);
  }
  
  try {
    console.log('- Parent directory "../test.txt":', resolvePath(allowedRoot, '../test.txt'));
  } catch (error: any) {
    console.log('- Parent directory "../test.txt":', error.message);
  }
} catch (error: any) {
  console.error('Error:', error.message);
}
