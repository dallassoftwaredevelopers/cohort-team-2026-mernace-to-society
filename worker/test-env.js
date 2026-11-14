import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from the parent directory just like automation.js
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("🔍 Testing .env configuration loading...\n");

console.log("SUPABASE URL:", process.env.VITE_SUPABASE_URL ? "Loaded ✅" : "Missing ❌");
console.log("OPENROUTER MODEL:", process.env.OPENROUTER_MODEL || "Not set ❌");

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.log("OPENROUTER_API_KEY: Missing or empty ❌");
} else {
  console.log("OPENROUTER_API_KEY: Found ✅");
  console.log(`  - Total Length: ${apiKey.length} characters (real keys are usually 70+ chars)`);
  console.log(`  - Preview: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
}