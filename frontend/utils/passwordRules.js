// Keep N'Sync with config.toml
// minimum_password_length = 8
// password_requirements = "lower_upper_letters_digits_symbols"
// If you change those settings, change this file too.

export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_RULES = [
    { id: "length", label: `At least ${MIN_PASSWORD_LENGTH} characters`, test: (p) => p.length >= MIN_PASSWORD_LENGTH },
    { id: "lower", label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
    { id: "upper", label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { id: "digit", label: "A number", test: (p) => /[0-9]/.test(p) },
    { id: "symbol", label: "A symbol (! @ # $ etc.)", test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(p) },
];

export function passwordMeetsRules(password) {
    return PASSWORD_RULES.every((rule) => rule.test(password));
}