import { withSupabase } from "jsr:@supabase/server@^1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default {
  fetch: withSupabase({ auth: "user" }, async (req, { supabase }) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Change to POST so we can pass data in the body safely, just like your other functions
    if (req.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      const { propertyId } = await req.json();

      if (!propertyId) {
        return Response.json(
          { error: "Property ID is required" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Retrieve property
      const { data: property, error: propertyError } = await supabase
        .from("property")
        .select("*")
        .eq("id", propertyId)
        .single();

      if (propertyError) {
        if (propertyError.code === "PGRST116") {
          return Response.json(
            { error: "Property not found" },
            { status: 404, headers: corsHeaders }
          );
        }
        throw propertyError;
      }

      // Retrieve all bills associated with this property
      const { data: bills, error: billsError } = await supabase
        .from("bill")
        .select(`
          id,
          property_id,
          invoice_number,
          issue_date,
          due_date,
          amount,
          status,
          extracted_vendor_name,
          vendor_account (
            service,
            vendor (
              name
            )
          )
        `)
        .eq("property_id", propertyId)
        .order("due_date", { ascending: true });

      if (billsError) {
        throw billsError;
      }

      return Response.json(
        { property, bills: bills || [] },
        { status: 200, headers: corsHeaders }
      );

    } catch (err) {
      console.error("Error retrieving property details:", err);
      return Response.json(
        {
          error: err instanceof Error ? err.message : "Unable to retrieve property details.",
        },
        { status: 500, headers: corsHeaders }
      );
    }
  }),
};