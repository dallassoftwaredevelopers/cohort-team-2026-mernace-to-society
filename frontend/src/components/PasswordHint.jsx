import { PASSWORD_RULES } from "../../utils/passwordRules";

function PasswordHint({ password }) {
    return (
        <ul
            className="space-y-1 text-xs"
            aria-label="Password requirements"
        >
            {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(password);
                return (
                
                    <li 
                        key={rule.id}
                        className={passed ? "text-green-700" : "text-gray-500"}
                    >
                        <span aria-hidden="true">
                            {passed ? "✓" : "○"}
                        </span>{" "}
                        {rule.label}
                        <span className="sr-only">
                            {passed ? " (met)" : " (not met)"}
                        </span>
                    </li>

                );
            })}
        </ul>
    );
}

export default PasswordHint;