import { useState, useCallback } from "react";
import { supabase } from "../../utils/supabase.js";

export function useVendorDetails() {
	const [vendor, setVendor] = useState(null);
	const [accounts, setAccounts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [notFound, setNotFound] = useState(false);

	const fetchVendorDetails = useCallback(async (vendorId) => {
		if (!vendorId) {
			setError("Vendor ID is required.");
			setVendor(null);
			setAccounts([]);
			setNotFound(false);
			return;
		}

		setLoading(true);
		setError("");
		setVendor(null);
		setAccounts([]);
		setNotFound(false);

		try {
			const { data, error: invokeError } = await supabase.functions.invoke(
				"read-vendor-details",
				{
					method: "POST",
					body: { vendorId },
				},
			);

			if (invokeError) {
				if (invokeError.context?.status === 404) {
					setNotFound(true);
					return;
				}
				throw invokeError;
			}

			if (data?.error === "Vendor not found") {
				setNotFound(true);
				return;
			}

			if (data?.error) {
				throw new Error(data.error);
			}

			setVendor(data?.vendor ?? null);
			setAccounts(data?.accounts ?? []);
			return data;
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Unable to retrieve vendor details.";

			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		vendor,
		accounts,
		loading,
		error,
		notFound,
		fetchVendorDetails,
	};
}
