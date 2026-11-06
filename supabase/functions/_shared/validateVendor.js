export function validateVendor(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be an object" };
  }

  // Only name, aliases and portal_url are read. status is set by the server, id/created_at by the DB.
  const { name, aliases, portal_url, email, phone_number } = body;

  if (typeof name !== "string" || name.trim().length === 0) {
    return { ok: false, error: "Name is required" };
  }
  if (name.trim().length > 100) {
    return { ok: false, error: "Name must be 100 characters or less" };
  }

  //email is optional
 if (email !== undefined && email !== null && email !== "") {
   const trimmedEmail = email.trim();

   if (
     typeof email !== "string" ||
     !trimmedEmail.includes("@") ||
     !trimmedEmail.includes(".") ||
     trimmedEmail.startsWith("@") ||
     trimmedEmail.endsWith("@") ||
     trimmedEmail.includes(" ")
   ) {
     return { ok: false, error: "Please enter a valid email address" };
   }
 }

  //phone number is optional
 if (
   phone_number !== undefined &&
   phone_number !== null &&
   phone_number !== ""
 ) {
   const trimmedPhone = phone_number.trim();

   const digits = trimmedPhone.replace(/\D/g, "");

   if (
     typeof phone_number !== "string" ||
     digits.length < 7 ||
     digits.length > 15
   ) {
     return { ok: false, error: "Please enter a valid phone number" };
   }
 }

  // aliases are optional alternate spellings, e.g. "ConEd" for "Consolidated Edison"
  const list = aliases === undefined || aliases === null ? [] : aliases;
  if (!Array.isArray(list)) {
    return { ok: false, error: "Aliases must be an array" };
  }
  if (list.length > 20) {
    return { ok: false, error: "No more than 20 aliases" };
  }
  // Seed with the name so an alias that just repeats it gets dropped
  const seen = [name.trim().toLowerCase()];
  const cleaned = [];
  for (const alias of list) {
    if (typeof alias !== "string" || alias.trim().length === 0) {
      return { ok: false, error: "Each alias must be a non-empty string" };
    }
    if (alias.trim().length > 100) {
      return { ok: false, error: "Each alias must be 100 characters or less" };
    }
    // "ConEd" and "coned" are the same vendor, keep the first spelling
    if (!seen.includes(alias.trim().toLowerCase())) {
      seen.push(alias.trim().toLowerCase());
      cleaned.push(alias.trim());
    }
  }

  // portal_url is optional; missing or empty string becomes null
  let url = null;
  if (portal_url !== undefined && portal_url !== null && portal_url !== "") {
    if (typeof portal_url !== "string" || portal_url.length > 2048) {
      return { ok: false, error: "Portal URL must be a string" };
    }
    let parsed;
    try {
      parsed = new URL(portal_url.trim());
    } catch {
      return { ok: false, error: "Portal URL is not a valid URL" };
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return {
        ok: false,
        error: "Portal URL must start with http:// or https://",
      };
    }
    url = parsed.href;
  }

  return {
    ok: true,
    value: { 
      name: name.trim(),
      aliases: cleaned, 
      portal_url: url, 
      email:email?.trim() || null, 
      phone_number:phone_number?.trim() || null,
    },
  };
}
