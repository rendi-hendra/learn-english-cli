import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), '.last_model');

export function getLastModel(): string {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const model = fs.readFileSync(CONFIG_FILE, 'utf8').trim();
      if (model) return model;
    }
  } catch (err) {
    // ignore
  }
  return process.env.OPENAI_MODEL || 'qwen3.7-max';
}

export function saveLastModel(model: string): void {
  try {
    fs.writeFileSync(CONFIG_FILE, model, 'utf8');
  } catch (err) {
    // ignore
  }
}
