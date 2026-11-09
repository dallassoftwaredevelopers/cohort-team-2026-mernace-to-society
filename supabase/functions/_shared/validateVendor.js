export function validateVendor(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be an object" };
  }

  // status is set by the server, id/created_at by the DB.
  const {
    name,
    aliases,
    portal_url,
    email,
    phone_number,
    account_number,
    service,
    property_id,
  } = body;

  if (typeof name !== "string" || name.trim().length === 0) {
    return { ok: false, error: "Name is required" };
  }
  if (name.trim().length > 100) {
    return { ok: false, error: "Name must be 100 characters or less" };
  }

  //email is optional
  if (email !== undefined && email !== null && email !== "") {
    if (typeof email !== "string") {
      return { ok: false, error: "Please enter a valid email address" };
    }

    const trimmedEmail = email.trim();
    if (
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
    if (typeof phone_number !== "string") {
      return { ok: false, error: "Please enter a valid phone number" };
    }

    const trimmedPhone = phone_number.trim();
    const digits = trimmedPhone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
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

  const hasAccountInformation = [account_number, service, property_id].some(
    (value) => value !== undefined && value !== null && value !== "",
  );
  let account = null;

  if (hasAccountInformation) {
    if (
      typeof account_number !== "string" ||
      account_number.trim().length === 0 ||
      typeof service !== "string" ||
      service.trim().length === 0 ||
      typeof property_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        property_id,
      )
    ) {
      return {
        ok: false,
        error:
          "Account number, service type, and property are all required to create a vendor account",
      };
    }

    account = {
      account_number: account_number.trim(),
      service: service.trim(),
      property_id,
    };
  }

  return {
    ok: true,
    value: {
      name: name.trim(),
      aliases: cleaned,
      portal_url: url,
      email: typeof email === "string" ? email.trim() || null : null,
      phone_number:
        typeof phone_number === "string" ? phone_number.trim() || null : null,
      account,
    },
  };
}
