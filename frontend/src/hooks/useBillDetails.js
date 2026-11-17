import { useCallback, useState } from "react";
import { supabase } from "../../utils/supabase";

// Loads one bill with its property and vendor account
export function useBillDetails() {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBillDetails = useCallback(async (billId) => {
    if (!billId) {
      setError("Bill ID is required.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("bill")
        .select(
          `
          *,
          property(id, name, street, city, state, zip),
          vendor_account(
            id,
            account_number,
            service,
            vendor(name)
          )
        `,
        )
        .eq("id", billId)
        .single();

      if (fetchError) throw fetchError;

      setBill(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to retrieve bill details.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { bill, loading, error, fetchBillDetails };
}
