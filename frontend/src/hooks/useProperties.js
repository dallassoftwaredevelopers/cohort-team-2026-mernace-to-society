
import { useState, useCallback } from "react";
import { supabase } from "../../utils/supabase.js"

export function useProperties() {
	const [properties, setProperties] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// READ PROPERTIES
	const fetchProperties = useCallback(async () => {
		setLoading(true);
		setError("");

		try {
			const { data, error } = await supabase.functions.invoke(
				"read-properties",
				{
					method: "GET",
				}
			);

			if (error) throw error;

			if (data?.error) {
				throw new Error(data.error);
			}

			setProperties(data?.data || []);
			return data?.data || [];
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Unable to retrieve properties.";

			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	// CREATE PROPERTY
	const createProperty = async (propertyData) => {
		setError("");

		try {
			const { data, error } = await supabase.functions.invoke(
				"create-property",
				{
					method: "POST",
					body: propertyData,
				}
			);

			if (error) throw error;

			if (data?.error) {
				throw new Error(data.error);
			}

			await fetchProperties();
			return data.data;
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Unable to create property."
			);
			throw err;
		}
	};

	// UPDATE PROPERTY
	const updateProperty = async (id, updates) => {
		setError("");

		try {
			const { data, error } = await supabase.functions.invoke(
				"update-property",
				{
					method: "PATCH",
					body: { id, ...updates },
				}
			);

			if (error) throw error;

			if (data?.error) {
				throw new Error(data.error);
			}

			await fetchProperties();
			return data.data;
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Unable to update property."
			);
			throw err;
		}
	};

	// DELETE PROPERTY
	const deleteProperty = async (id) => {
		setError("");

		try {
			const { data, error } = await supabase.functions.invoke(
				"delete-property",
				{
					method: "DELETE",
					body: { id },
				}
			);

			if (error) throw error;

			if (data?.error) {
				throw new Error(data.error);
			}

			await fetchProperties();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Unable to delete property."
			);
			throw err;
		}
	};

	return {
		properties,
		loading,
		error,
		fetchProperties,
		createProperty,
		updateProperty,
		deleteProperty,
	};
}
