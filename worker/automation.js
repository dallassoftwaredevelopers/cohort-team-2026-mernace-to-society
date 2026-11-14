
import { localBrowser, Stagehand } from "@browserbasehq/stagehand";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ==================================================
// 1. LOAD ENVIRONMENT VARIABLES
// ==================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

// ==================================================
// 2. VALIDATE ENVIRONMENT VARIABLES
// ==================================================

const requiredVariables = [
  "OPENROUTER_API_KEY",
  "VITE_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PORTAL_EMAIL",
  "PORTAL_PASSWORD",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    console.error(`Missing environment variable: ${variable}`);
    process.exit(1);
  }
}

const MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

console.log(`Using OpenRouter model: ${MODEL}`);

// ==================================================
// 3. INITIALIZE SUPABASE
// ==================================================

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==================================================
// 4. OPENROUTER CUSTOM MODEL CALLBACK
// ==================================================

async function generateWithOpenRouter(params) {
  console.log("[OpenRouter] Sending inference request...");

  if (params.responseFormat?.type !== "json_schema") {
    throw new Error(
      "Stagehand requested an unsupported response format."
    );
  }

  // Convert Stagehand messages into OpenRouter messages.
  const messages = [];

  if (params.systemPrompt) {
    messages.push({
      role: "system",
      content: params.systemPrompt,
    });
  }

  for (const message of params.messages) {
    const blocks = Array.isArray(message.content)
      ? message.content
      : [message.content];

    const content = blocks.map((block) => {
      if (block.type === "text") {
        return {
          type: "text",
          text: block.text,
        };
      }

      if (block.type === "image") {
        return {
          type: "image_url",
          image_url: {
            url: `data:${block.mimeType};base64,${block.data}`,
          },
        };
      }

      throw new Error(
        `Unsupported message content type: ${block.type}`
      );
    });

    messages.push({
      role: message.role,
      content,
    });
  }

  // Send request to OpenRouter.
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Cedar Valley Payment Automation",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: params.temperature ?? 0,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: params.responseFormat.name,
            strict: true,
            schema: params.responseFormat.schema,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `OpenRouter API error (${response.status}): ${errorBody}`
    );
  }

  const result = await response.json();

  const responseText =
    result.choices?.[0]?.message?.content;

  if (
    typeof responseText !== "string" ||
    !responseText.trim()
  ) {
    throw new Error(
      "OpenRouter returned an empty or invalid response."
    );
  }

  let structuredContent;

  try {
    structuredContent = JSON.parse(responseText);
  } catch {
    throw new Error(
      "OpenRouter did not return valid JSON."
    );
  }

  console.log("[OpenRouter] Inference successful.");

  // Return the exact structure Stagehand v4 expects.
  return {
    role: "assistant",
    content: {
      type: "text",
      text: responseText,
    },
    outputFormat: "json_schema",
    structuredContent,
  };
}

// ==================================================
// 5. MAIN AUTOMATION FUNCTION
// ==================================================

async function runStagehandPayment(billId) {
  let browser;
  let stagehand;

  try {
    // ------------------------------------------------
    // A. FETCH BILL FROM SUPABASE
    // ------------------------------------------------

    console.log("\n=================================");
    console.log("FETCHING BILL FROM SUPABASE");
    console.log("=================================\n");

    console.log(`Querying Supabase for bill ID: ${billId}`);

    const { data: bill, error: billError } =
      await supabase
        .from("bill")
        .select(
          "id, amount, status, bill_url, extracted_url, invoice_number"
        )
        .eq("id", billId)
        .single();

    if (billError || !bill) {
      throw new Error(
        `Failed to fetch bill: ${billError?.message}`
      );
    }

    console.log(
      `Successfully found bill! Invoice: ${bill.invoice_number}, Amount: $${bill.amount}`
    );

    // ------------------------------------------------
    // B. VALIDATE BILL URL
    // ------------------------------------------------

    const targetUrl = bill.bill_url || bill.extracted_url;

    if (!targetUrl) {
      throw new Error(
        "No portal URL found in the bill record."
      );
    }

    const parsedUrl = new URL(targetUrl);

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !==
        "cedar-valley-utility-demo.vercel.app"
    ) {
      throw new Error(
        "The bill URL does not match the trusted demo portal."
      );
    }

    // ------------------------------------------------
    // C. VALIDATE BILL AMOUNT
    // ------------------------------------------------

    const billAmount = Number(bill.amount);

    if (!Number.isFinite(billAmount) || billAmount <= 0) {
      throw new Error("Invalid bill amount.");
    }

    console.log(`Verified invoice: ${bill.invoice_number}`);
    console.log(
      `Verified amount: $${billAmount.toFixed(2)}`
    );

    // ------------------------------------------------
    // D. LAUNCH LOCAL BROWSER
    // ------------------------------------------------

    console.log("\n=================================");
    console.log("STARTING BROWSER");
    console.log("=================================\n");

    browser = await localBrowser.launch({
      headless: false,
    });

    console.log("Browser launched successfully.");

    // ------------------------------------------------
    // E. INITIALIZE STAGEHAND
    // ------------------------------------------------

    console.log("\nInitializing Stagehand...");

    stagehand = await Stagehand.create({
      browser,
      model: {
        generate: generateWithOpenRouter,
      },
    });

    console.log("Stagehand initialized successfully.");

    // ------------------------------------------------
    // F. GET ACTIVE PAGE
    // ------------------------------------------------

    const page = await browser.context.activePage();

    if (!page) {
      throw new Error("No active browser page found.");
    }

    // ------------------------------------------------
    // G. NAVIGATE TO PORTAL
    // ------------------------------------------------

    console.log("\n=================================");
    console.log("OPENING CUSTOMER PORTAL");
    console.log("=================================\n");

    console.log(`Navigating to: ${targetUrl}`);

    await page.goto(targetUrl);

    console.log("Portal loaded successfully.");

    // ------------------------------------------------
    // H. LOGIN
    // ------------------------------------------------

    console.log("\n=================================");
    console.log("SIGNING INTO CUSTOMER PORTAL");
    console.log("=================================\n");

    const emailInput = page.locator(
      'input[type="email"]'
    );

    const passwordInput = page.locator(
      'input[type="password"]'
    );

    // Verify login fields.
    const emailCount = await emailInput.count();
    const passwordCount = await passwordInput.count();

    console.log(`Email fields found: ${emailCount}`);
    console.log(`Password fields found: ${passwordCount}`);

    if (emailCount !== 1 || passwordCount !== 1) {
      throw new Error(
        "Could not identify the expected login fields."
      );
    }

    // Fill credentials directly in the browser.
    // They are never included in OpenRouter prompts.

    await emailInput.fill(process.env.PORTAL_EMAIL);

    await passwordInput.fill(process.env.PORTAL_PASSWORD);

    console.log("Login credentials entered.");

    // Find the submit button.
    const submitButton = page.locator(
      'button[type="submit"]'
    );

    if (await submitButton.count() !== 1) {
      throw new Error(
        "Could not identify exactly one login submit button."
      );
    }

    await submitButton.click();

    console.log("Sign-in button clicked.");

    // Allow the application to complete its response.
    await new Promise((resolve) =>
      setTimeout(resolve, 1500)
    );

    // ------------------------------------------------
    // I. VERIFY LOGIN RESULT
    // ------------------------------------------------

    console.log("\n=================================");
    console.log("VERIFYING LOGIN");
    console.log("=================================\n");

    const currentUrl = await page.url();

    console.log("Current URL:", currentUrl);

    const dashboardText = await page
      .locator("body")
      .innerText();

    if (
      dashboardText.includes("Sign in to your account") &&
      await emailInput.count() > 0
    ) {
      throw new Error(
        "Login may have failed. The sign-in page is still displayed."
      );
    }

    console.log("Portal response received.");

    // ------------------------------------------------
    // J. DISPLAY DASHBOARD
    // ------------------------------------------------

    console.log("\n=================================");
    console.log("CUSTOMER DASHBOARD");
    console.log("=================================\n");

    console.log(dashboardText);

    // ------------------------------------------------
    // K. TEST OPENROUTER INFERENCE
    // ------------------------------------------------

    console.log("\n=================================");
    console.log("TESTING OPENROUTER INTEGRATION");
    console.log("=================================\n");

    // Harmless AI observation.
    // No credentials or card details are included.
    await stagehand.act(
      "Inspect the current customer portal page. Identify whether the customer is signed in and describe the visible dashboard sections. Do not click anything, navigate away, or submit any forms."
    );

    console.log(
      "Stagehand and OpenRouter inference test completed."
    );

    // ------------------------------------------------
    // L. STOP BEFORE PAYMENT
    // ------------------------------------------------

    console.log("\n=================================");
    console.log("AUTOMATION CHECKPOINT");
    console.log("=================================\n");

    console.log(`Invoice: ${bill.invoice_number}`);
    console.log(`Amount: $${billAmount.toFixed(2)}`);
    console.log("Portal login: completed");
    console.log("OpenRouter inference: completed");

    console.log(
      "\nAutomation paused before payment submission."
    );

    console.log(
      "Next step: inspect the dashboard and locate the matching invoice."
    );

  } catch (err) {
    console.error(
      "\nAutomation error during execution:",
      err
    );

  } finally {
    // ------------------------------------------------
    // CLEANUP
    // ------------------------------------------------

    if (stagehand) {
      try {
        await stagehand.close();
        console.log("Stagehand closed.");
      } catch (err) {
        console.error(
          "Error closing Stagehand:",
          err.message
        );
      }
    }

    if (browser) {
      try {
        await browser.close();
        console.log("Browser closed.");
      } catch (err) {
        console.error(
          "Error closing browser:",
          err.message
        );
      }
    }
  }
}

// ==================================================
// 6. RUN AUTOMATION
// ==================================================

runStagehandPayment(
  "50b157a7-cf2b-4174-9897-dcd65b453860"
);
