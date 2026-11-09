import { useState, useCallback } from "react";
import { supabase } from "../../utils/supabase.js";

export function usePropertyDetails() {
    const [property, setProperty] = useState(null);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchPropertyDetails = useCallback(async (propertyId) => {
        if (!propertyId) {
            setError("Property ID is required.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase.functions.invoke(
                "read-property-details",
                {
                    method: "POST",
                    body: { propertyId },
                }
            );

            if (error) throw error;

            if (data?.error) {
                throw new Error(data.error);
            }

            setProperty(data?.property ?? null);
            setBills(data?.bills ?? []);

            return data;
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Unable to retrieve property details.";

            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        property,
        bills,
        loading,
        error,
        fetchPropertyDetails,
    };
}