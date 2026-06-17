import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

export function loadEnv(): void {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // The envConfig file is in src/utils/ (2 levels down from root)
  // or dist/utils/ (also 2 levels down from root)
  const envPath = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: envPath });
}
