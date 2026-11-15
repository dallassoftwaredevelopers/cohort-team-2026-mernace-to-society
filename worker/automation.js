// ==========================================
// 1. IMPORTS
// ==========================================

import { localBrowser, Stagehand } from "@browserbasehq/stagehand";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

// ==========================================
// 2. ENVIRONMENT CONFIGURATION
// ==========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

console.log("Environment variables loaded.");

// ==========================================
// 3. VALIDATE ENVIRONMENT VARIABLES
// ==========================================

const requiredVariables = [
  "OPENROUTER_API_KEY",
  "VITE_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PORTAL_EMAIL",
  "PORTAL_PASSWORD",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    console.error(
      `Missing environment variable: ${variable}`
    );

    process.exit(1);
  }
}

// ==========================================
// 4. MODEL CONFIGURATION
// ==========================================

const MODEL =
  process.env.OPENROUTER_MODEL ||
  "openai/gpt-4o-mini";

console.log("Using OpenRouter model:", MODEL);

console.log("Environment validation successful.");

// ==========================================
// 5. INITIALIZE SUPABASE
// ==========================================

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("Supabase client initialized.");

// ==========================================
// 6. FETCH BILL FROM SUPABASE
// ==========================================

async function fetchBill(billId) {

  console.log("\n=================================");
  console.log("FETCHING BILL FROM SUPABASE");
  console.log("=================================\n");

  const { data: bill, error } = await supabase
    .from("bill")
    .select(`
      id,
      amount,
      status,
      bill_url,
      extracted_url,
      invoice_number,
      extracted_invoice_number,
      extracted_vendor_name,
      extracted_account_number,
      due_date,
      extracted_due_date,
      vendor_account_id
    `)
    .eq("id", billId)
    .single();

  if (error || !bill) {
    throw new Error(
      `Failed to retrieve bill: ${error?.message || "Bill not found"}`
    );
  }

  const targetUrl = bill.bill_url || bill.extracted_url;

  if (!targetUrl) {
    throw new Error("No bill payment URL found.");
  }

  const parsedUrl = new URL(targetUrl);

  if (parsedUrl.protocol !== "https:") {
    throw new Error("Bill URL must use HTTPS.");
  }

  const amount = Number(bill.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid bill amount.");
  }

  if (!bill.extracted_vendor_name) {
    throw new Error("Vendor name is missing.");
  }

  console.log("Bill retrieved successfully.");
  console.log("Vendor:", bill.extracted_vendor_name);
  console.log("Invoice:", bill.invoice_number);
  console.log("Amount:", amount.toFixed(2));
  console.log("Website:", targetUrl);

  return {
    ...bill,
    targetUrl,
    amount
  };
}

// ==========================================
// 7. OPENROUTER CUSTOM MODEL CALLBACK
// ==========================================

async function generateWithOpenRouter(params) {

  console.log("[OpenRouter] Sending inference request...");

  if (params.responseFormat?.type !== "json_schema") {
    throw new Error(
      "Stagehand requested an unsupported response format."
    );
  }

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
        `Unsupported content type: ${block.type}`
      );
    });

    messages.push({
      role: message.role,
      content,
    });
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Universal Bill Portal Automation",
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
      "OpenRouter returned an empty response."
    );
  }

  let structuredContent;

  try {
    structuredContent = JSON.parse(responseText);
  } catch {
    throw new Error(
      "OpenRouter returned invalid JSON."
    );
  }

  console.log("[OpenRouter] Inference successful.");

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

// ==========================================
// 8. INITIALIZE BROWSER AND STAGEHAND
// ==========================================

async function initializeBrowser() {

  console.log("\n=================================");
  console.log("STARTING BROWSER");
  console.log("=================================\n");

  let browser;
  let stagehand;

  try {

    browser = await localBrowser.launch({
      headless: false,
    });

    console.log("Browser launched successfully.");

    stagehand = await Stagehand.create({
      browser,

      model: {
        generate: generateWithOpenRouter,
      },
    });

    console.log("Stagehand initialized successfully.");

    const page = await browser.context.activePage();

    if (!page) {
      throw new Error(
        "Could not retrieve active browser page."
      );
    }

    return {
      browser,
      stagehand,
      page,
    };

  } catch (error) {

    if (stagehand) {
      try {
        await stagehand.close();
      } catch {}
    }

    if (browser) {
      try {
        await browser.close();
      } catch {}
    }

    throw error;
  }
}

// ==========================================
// 9. UNIVERSAL WEBSITE INSPECTOR
// ==========================================

async function inspectCurrentPage(
  page,
  stagehand,
  vendorName
) {
  console.log("\n=================================");
  console.log("INSPECTING WEBSITE");
  console.log("=================================\n");

  const currentUrl = await page.url();
  const pageTitle = await page.title();

  console.log("Company:", vendorName);
  console.log("URL:", currentUrl);
  console.log("Title:", pageTitle);

  // Check for common login fields.

  const emailCount = await page
    .locator('input[type="email"]')
    .count();

  const passwordCount = await page
    .locator('input[type="password"]')
    .count();

  // Ask Stagehand to classify the page.

  const { data: inspection } = await stagehand.extract(
    `You are inspecting the website for ${vendorName}.

Current URL: ${currentUrl}
Page title: ${pageTitle}

Classify the current page.

LOGIN_PAGE:
A customer sign-in form is visible.

LOGIN_NAVIGATION:
A link, button, or menu leads to customer login.

DASHBOARD:
The customer appears to be authenticated.

BILLPAY_PAGE:
The customer can view their bill, balance,
or payment options.

MFA_REQUIRED:
An additional authentication step is required.

OTHER:
None of the above.

Do not click anything.
Do not submit any forms.
Do not initiate payments.

Use visible page evidence.
Do not assume authentication succeeded merely
because a login form is absent.`,
    z.object({
      pageType: z.enum([
        "LOGIN_PAGE",
        "LOGIN_NAVIGATION",
        "DASHBOARD",
        "BILLPAY_PAGE",
        "MFA_REQUIRED",
        "OTHER"
      ]),
      explanation: z.string()
    })
  );

  console.log("\nPage classification:");
  console.log(inspection.pageType);

  console.log("Explanation:", inspection.explanation);

  // Verify login fields independently.

  if (emailCount > 0 && passwordCount > 0) {
    console.log("Login fields detected.");

    return {
      pageType: "LOGIN_PAGE",
      explanation: "Email and password fields detected."
    };
  }

  return inspection;
}

// ==========================================
// 10. UNIVERSAL LOGIN NAVIGATION
// ==========================================

async function navigateToLogin(
  page,
  stagehand,
  vendorName,
  trustedDomains
) {
  console.log("\n=================================");
  console.log("STARTING UNIVERSAL LOGIN NAVIGATION");
  console.log("=================================\n");

  const visitedUrls = new Set();

  for (
    let step = 1;
    step <= 5;
    step++
  ) {
    console.log(`\nNavigation step ${step} of 5`);

    const currentUrl = await page.url();

    // Prevent navigation loops.

    if (visitedUrls.has(currentUrl)) {
      throw new Error(
        "Navigation loop detected. Stopping automation."
      );
    }

    visitedUrls.add(currentUrl);

    // Verify current website domain.

    if (!isTrustedDomain(currentUrl, trustedDomains)) {
      throw new Error(
        `Untrusted website encountered: ${currentUrl}`
      );
    }

    // Inspect the current page.

    const inspection = await inspectCurrentPage(
      page,
      stagehand,
      vendorName
    );

    // Stop when the login form is found.

    if (inspection.pageType === "LOGIN_PAGE") {
      console.log("\nLOGIN PAGE FOUND!");

      return {
        success: true,
        pageType: "LOGIN_PAGE",
        url: currentUrl
      };
    }

    // Stop if additional authentication is required.

    if (inspection.pageType === "MFA_REQUIRED") {
      return {
        success: false,
        pageType: "MFA_REQUIRED",
        url: currentUrl
      };
    }

    console.log(
      "Login form not found. Looking for login navigation..."
    );

    // Ask Stagehand to identify and click
    // ONLY the customer login navigation element.

    const action = await stagehand.act(
      `You are navigating the official customer website
      for ${vendorName}.

      Current URL: ${currentUrl}

      Your objective is to reach the existing customer's
      login form.

      Inspect the visible page and identify the most
      appropriate customer login navigation element.

      It may be labeled:
      Login, Log in, Sign in, My Account,
      Customer Portal, Online Account, or Account Access.

      Click only a navigation element that clearly
      leads to customer sign-in.

      Do not click:
      - Pay Bill
      - Make a Payment
      - Submit Payment
      - Register
      - Create Account
      - Sign Up
      - Forgot Password
      - Advertisements
      - Unrelated navigation links

      Do not enter credentials.
      Do not submit forms.
      Do not initiate payments.

      If no appropriate login navigation element exists,
      report that no suitable element was found.`
    );

    console.log("Stagehand navigation result:", action);

    if (action?.data?.success !== true) {
      throw new Error(
        "Stagehand could not find a suitable login navigation element."
      );
    }

    // Allow the website to respond.

    await new Promise(resolve =>
      setTimeout(resolve, 2000)
    );

    const newUrl = await page.url();

    console.log("New URL:", newUrl);

    // Never enter credentials on an unapproved domain.

    if (!isTrustedDomain(newUrl, trustedDomains)) {
      throw new Error(
        `Navigation reached an unapproved domain: ${newUrl}`
      );
    }

    // Prevent clicking the same page repeatedly.

    if (newUrl === currentUrl) {
      throw new Error(
        "Navigation did not change the page. Manual inspection required."
      );
    }
  }

  throw new Error(
    "Login page was not found within five navigation steps."
  );
}

// ==========================================
// 11. LOGIN AND CREDENTIAL ENTRY
// ==========================================

async function authenticateCustomer(page, stagehand) {

  console.log("\n=================================");
  console.log("AUTHENTICATING CUSTOMER");
  console.log("=================================\n");

  // Find login fields.

  const emailInput = page.locator(
    'input[type="email"]'
  );

  const passwordInput = page.locator(
    'input[type="password"]'
  );

  const emailCount = await emailInput.count();
  const passwordCount = await passwordInput.count();

  console.log("Email fields:", emailCount);
  console.log("Password fields:", passwordCount);

  if (emailCount !== 1 || passwordCount !== 1) {
    throw new Error(
      "Could not identify exactly one email and password field."
    );
  }

  // Enter credentials locally.

  await emailInput.fill(
    process.env.PORTAL_EMAIL
  );

  await passwordInput.fill(
    process.env.PORTAL_PASSWORD
  );

  console.log("Credentials entered successfully.");

  // Ask Stagehand to identify the actual
  // customer login button.

  console.log("Identifying login button...");

  const loginAction = await stagehand.act(
    "Identify the actual Sign In or Login button belonging to the customer login form. The email and password fields have already been filled. Click only that login button. Do not click registration, password recovery, payment, or unrelated buttons."
  );

  console.log("Login action:", loginAction);

  if (loginAction?.data?.success !== true) {
    throw new Error(
      "Stagehand could not confirm the login button action."
    );
  }

  // Wait for authentication response.

  console.log("Waiting for authentication response...");

  await new Promise(resolve =>
    setTimeout(resolve, 3000)
  );

  // Check for remaining login fields.

  const remainingEmail = await page
    .locator('input[type="email"]')
    .count();

  const remainingPassword = await page
    .locator('input[type="password"]')
    .count();

  const pageText = (
    await page.locator("body").innerText()
  ).toLowerCase();

  // Detect common authentication errors.

  const loginErrors = [
    "invalid password",
    "incorrect password",
    "invalid credentials",
    "login failed",
    "unable to sign in",
    "incorrect email"
  ];

  const hasLoginError = loginErrors.some(
    error => pageText.includes(error)
  );

  if (hasLoginError) {
    throw new Error(
      "The website reported a login error."
    );
  }

  // Detect MFA.

  const mfaKeywords = [
    "verification code",
    "two-factor authentication",
    "multi-factor authentication",
    "authenticator app",
    "verify your identity"
  ];

  const requiresMFA = mfaKeywords.some(
    keyword => pageText.includes(keyword)
  );

  if (requiresMFA) {
    return {
      success: false,
      status: "MFA_REQUIRED"
    };
  }

  // Do not assume that disappearance of the
  // login form proves successful authentication.

  if (remainingEmail > 0 || remainingPassword > 0) {
    throw new Error(
      "Login form remains visible. Authentication not confirmed."
    );
  }

  // Ask Stagehand to verify the resulting page.

  const { data: verification } = await stagehand.extract(
    "Inspect the current website after the login submission. Determine whether the customer is authenticated. Look for visible account identity, account dashboard, account menu, or sign-out controls. Do not click anything. Do not assume authentication succeeded merely because the login form disappeared.",
    z.object({
      authenticated: z.boolean(),
      evidence: z.string(),
      mfaRequired: z.boolean()
    })
  );

  console.log("Authentication verification:");
  console.log(verification);

  if (verification.mfaRequired) {
    return {
      success: false,
      status: "MFA_REQUIRED"
    };
  }

  if (!verification.authenticated) {
    throw new Error(
      "Customer authentication could not be verified."
    );
  }

  console.log("Customer authentication verified.");

  return {
    success: true,
    status: "AUTHENTICATED"
  };
}

// ==========================================
// 12. FIND CUSTOMER BILL-PAY PAGE
// ==========================================

async function navigateToBillPay(
  page,
  stagehand,
  vendorName,
  trustedDomains
) {
  console.log("\n=================================");
  console.log("FINDING BILL-PAY PAGE");
  console.log("=================================\n");

  const visitedUrls = new Set();

  const maxSteps = 5;

  for (let step = 1; step <= maxSteps; step++) {

    console.log(`Bill-pay navigation step ${step}/${maxSteps}`);

    const currentUrl = await page.url();

    // Prevent navigation loops.

    if (visitedUrls.has(currentUrl)) {
      throw new Error(
        "Repeated page detected during bill-pay navigation."
      );
    }

    visitedUrls.add(currentUrl);

    // Validate current domain.

    if (!isTrustedDomain(currentUrl, trustedDomains)) {
      throw new Error(
        `Unapproved domain: ${currentUrl}`
      );
    }

    // Inspect the current page.

    const inspection = await inspectCurrentPage(
      page,
      stagehand,
      vendorName
    );

    // Stop if the bill-pay page is identified.

    if (inspection.pageType === "BILLPAY_PAGE") {

      console.log("\nBILL-PAY PAGE IDENTIFIED!");

      return {
        success: true,
        url: currentUrl,
        pageType: "BILLPAY_PAGE"
      };
    }

    console.log(
      "Bill-pay page not identified. Searching for billing navigation..."
    );

    // Ask Stagehand to locate the appropriate
    // billing navigation element.

    const action = await stagehand.act(
      `You are navigating the authenticated customer
      account for ${vendorName}.

      Your objective is to find the customer's bill
      viewing and payment page.

      Look for navigation elements labeled:
      - Billing
      - View Bill
      - Pay My Bill
      - Account Balance
      - Outstanding Balance
      - Payments
      - Make a Payment

      Only click a navigation link that opens the
      billing or payment information section.

      Do not click:
      - Submit Payment
      - Confirm Payment
      - Pay Now
      - Process Payment
      - Authorize Payment
      - Any final payment confirmation button.

      Do not enter payment information.
      Do not select a payment method.
      Do not initiate a transaction.

      If no appropriate billing navigation exists,
      do not click anything.`
    );

    console.log("Stagehand navigation result:", action);

    if (action?.data?.success !== true) {
      throw new Error(
        "Could not identify a suitable billing navigation element."
      );
    }

    // Wait for the website to respond.

    await new Promise(resolve =>
      setTimeout(resolve, 2000)
    );

    const newUrl = await page.url();

    console.log("New URL:", newUrl);

    // Validate destination.

    if (!isTrustedDomain(newUrl, trustedDomains)) {
      throw new Error(
        `Billing navigation reached an unapproved domain: ${newUrl}`
      );
    }

    if (newUrl === currentUrl) {
      throw new Error(
        "Billing navigation did not change the page."
      );
    }
  }

  throw new Error(
    "Bill-pay page was not found within five navigation steps."
  );
}

// ==========================================
// 13. TRUSTED DOMAIN VALIDATION
// ==========================================

function isTrustedDomain(url, trustedDomains) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    return trustedDomains.has(hostname);
  } catch {
    return false;
  }
}

// ==========================================
// 14. MAIN AUTOMATION FUNCTION
// ==========================================

async function runStagehandAutomation(billId) {

  let browser;
  let stagehand;

  try {

    // STEP 1: FETCH BILL

    const bill = await fetchBill(billId);

    const vendorName = bill.extracted_vendor_name;

    // STEP 2: CONFIGURE TRUSTED DOMAINS

    const initialDomain = new URL(
      bill.targetUrl
    ).hostname.toLowerCase();

    const trustedDomains = new Set([
      initialDomain
    ]);

    // Additional authentication domains must
    // be explicitly configured in the .env file.

    const additionalDomains =
      process.env.TRUSTED_AUTH_DOMAINS || "";

    additionalDomains
      .split(",")
      .map(domain => domain.trim().toLowerCase())
      .filter(Boolean)
      .forEach(domain => trustedDomains.add(domain));

    console.log("Trusted domains:", [
      ...trustedDomains
    ]);

    // STEP 3: INITIALIZE BROWSER

    const browserSession = await initializeBrowser();

    browser = browserSession.browser;
    stagehand = browserSession.stagehand;

    const page = browserSession.page;

    // STEP 4: OPEN BILLER WEBSITE

    console.log("\n=================================");
    console.log("OPENING BILLER WEBSITE");
    console.log("=================================\n");

    await page.goto(bill.targetUrl);

    console.log("Website opened.");
    console.log("URL:", await page.url());

    // STEP 5: FIND LOGIN PAGE

    const loginResult = await navigateToLogin(
      page,
      stagehand,
      vendorName,
      trustedDomains
    );

    if (!loginResult.success) {
      console.log(
        "Login requires additional authentication:",
        loginResult.pageType
      );

      return;
    }

    // STEP 6: AUTHENTICATE CUSTOMER

    const authentication = await authenticateCustomer(
      page,
      stagehand
    );

    if (authentication.status === "MFA_REQUIRED") {
      console.log(
        "Additional authentication is required."
      );

      console.log(
        "Automation paused for customer verification."
      );

      return;
    }

    if (!authentication.success) {
      throw new Error(
        "Customer authentication was unsuccessful."
      );
    }

    // STEP 7: FIND BILL-PAY PAGE

    console.log("\n=================================");
    console.log("FINDING BILL-PAY PAGE");
    console.log("=================================\n");

    const billPayResult = await navigateToBillPay(
      page,
      stagehand,
      vendorName,
      trustedDomains
    );

    if (!billPayResult.success) {
      throw new Error(
        "Could not locate the bill-payment page."
      );
    }

    // STEP 8: VERIFY BILL INFORMATION

    console.log("\n=================================");
    console.log("VERIFYING BILL INFORMATION");
    console.log("=================================\n");

    const pageText = await page
      .locator("body")
      .innerText();

    const invoiceNumber =
      bill.invoice_number ||
      bill.extracted_invoice_number;

    const amountText = bill.amount.toFixed(2);

    const invoiceFound = invoiceNumber
      ? pageText.includes(invoiceNumber)
      : false;

    const amountFound =
      pageText.includes(amountText);

    console.log(
      "Invoice number found:",
      invoiceFound
    );

    console.log(
      "Bill amount found:",
      amountFound
    );

    // STEP 9: FINAL REPORT

    console.log("\n=================================");
    console.log("AUTOMATION COMPLETE");
    console.log("=================================\n");

    console.log("Vendor:", vendorName);
    console.log("Invoice:", invoiceNumber || "Not available");
    console.log("Expected amount:", amountText);
    console.log("Current URL:", await page.url());

    console.log(
      "Login: AUTHENTICATED"
    );

    console.log(
      "Bill-pay navigation: COMPLETED"
    );

    console.log(
      "Invoice verification:",
      invoiceFound ? "MATCHED" : "NOT CONFIRMED"
    );

    console.log(
      "Amount verification:",
      amountFound ? "MATCHED" : "NOT CONFIRMED"
    );

    console.log(
      "\nPayment submission: NOT PERFORMED"
    );

    console.log(
      "The browser will remain open until cleanup."
    );

  } catch (error) {

    console.error(
      "\nAUTOMATION ERROR:",
      error.message
    );

  } finally {

    // STEP 10: CLEANUP

    console.log("\n=================================");
    console.log("CLEANING UP");
    console.log("=================================\n");

    if (stagehand) {
      try {
        await stagehand.close();
        console.log("Stagehand closed.");
      } catch (error) {
        console.error(
          "Stagehand cleanup error:",
          error.message
        );
      }
    }

    if (browser) {
      try {
        await browser.close();
        console.log("Browser closed.");
      } catch (error) {
        console.error(
          "Browser cleanup error:",
          error.message
        );
      }
    }

    console.log("Automation finished.");
  }
}

// ==========================================
// 15. START AUTOMATION
// ==========================================

const BILL_ID = process.env.BILL_ID;

if (!BILL_ID) {
  throw new Error(
    "Missing BILL_ID environment variable."
  );
}

runStagehandAutomation(BILL_ID);