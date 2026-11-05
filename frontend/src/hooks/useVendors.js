import { useState, useCallback } from "react";
import { supabase } from "../../utils/supabase.js";

export function useVendors() {
	const [vendors, setVendors] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// READ VENDORS
	const fetchVendors = useCallback(async () => {
		setLoading(true);
		setError("");

		try {
			const { data, error: invokeError } = await supabase.functions.invoke(
				"read-vendors",
				{ method: "GET" },
			);

			if (invokeError) {
				throw invokeError;
			}

			if (data?.error) {
				throw new Error(data.error);
			}

			// Only overwrite on success so a failed fetch is not mistaken for an empty list.
			setVendors(data?.data || []);
			return data?.data || [];
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Unable to retrieve vendors.";
			setError(message);
			// Re-throw so callers can react, but never leave an unhandled rejection:
			// callers are responsible for .catch()-ing.
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		vendors,
		loading,
		error,
		fetchVendors,
	};
}
