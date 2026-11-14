function VendorSummary({
  totalVendorCount,
  vendorAccountCount,
  serviceTypeCount,
  vendorsWithAccountsCount,
  activeVendorCount,
  inactiveVendorCount,
  isLoadingVendors,
  vendorError,
  openBillCount,
  isLoadingOpenBillCount,
  openBillCountError,
}) {
  const cards = [
    {
      title: "Total Vendors",
      value: isLoadingVendors ? "…" : vendorError ? "—" : totalVendorCount,
      note: `Across ${serviceTypeCount} service types`,
    },
    {
      title: "Vendor Accounts",
      value: isLoadingVendors ? "…" : vendorError ? "—" : vendorAccountCount,
      note: `Linked to ${vendorsWithAccountsCount} vendors`,
    },
    {
      title: "Open Bills",
      value: isLoadingOpenBillCount
        ? "…"
        : openBillCountError
          ? "—"
          : openBillCount,
      note: openBillCountError
        ? `Could not load open bills: ${openBillCountError}`
        : undefined,
    },
    {
      title: "Active Vendors",
      value: isLoadingVendors ? "…" : vendorError ? "—" : activeVendorCount,
      note: `${inactiveVendorCount} inactive`,
    },
  ];

  return (
    <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
      {cards.map(({ title, value, note }) => (
        <div key={title} className="card">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-3 text-3xl font-bold">{value}</p>
          {note && (
            <p
              className={`mt-1 text-xs ${
                title === "Open Bills" && openBillCountError
                  ? "text-red-700"
                  : ""
              }`}
              role={
                title === "Open Bills" && openBillCountError
                  ? "alert"
                  : undefined
              }
            >
              {note}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}

export default VendorSummary;
