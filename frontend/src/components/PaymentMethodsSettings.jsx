function PaymentMethodsSettings({
  isOrganizationAdmin,
  paymentColumns,
  methodTypes,
  methodType,
  setMethodType,
  fieldsByType,
  inputClass,
}) {
  return (
    <>
      {/* Payment methods list — stacks into cards below md */}
      <section className="card mt-8">
        <div className="section-header">
          <div>
            <h2 className="text-lg font-bold">Payment Methods</h2>
            <p className="mt-1 text-sm">
              The accounts your organization pays bills from. Each vendor
              account picks one of these.
            </p>
          </div>
          {isOrganizationAdmin && (
            <a href="#add-method" className="btn-primary px-5 py-3 text-sm">
              + Add Payment Method
            </a>
          )}
        </div>

        {!isOrganizationAdmin && (
          <p className="mt-4 text-sm text-gray-600">
            Only organization admins can manage payment methods.
          </p>
        )}

        <table className="mt-4 w-full text-left text-sm">
          <thead className="hidden md:table-header-group">
            <tr className="text-xs uppercase">
              {paymentColumns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-semibold">
                  {col.label}
                </th>
              ))}
              {isOrganizationAdmin && (
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              )}
            </tr>
          </thead>

          <tbody className="block md:table-row-group">
            {/* Placeholder row — replace with mapped payment method data later */}
            <tr className="mb-4 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:bg-transparent md:p-0">
              {paymentColumns.map((col) => (
                <td
                  key={col.key}
                  className="flex justify-between py-1 md:table-cell md:px-4 md:py-4"
                >
                  <span className="font-semibold md:hidden">{col.label}</span>
                  {col.key === "status" ? (
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                      Active
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              ))}
              {isOrganizationAdmin && (
                <td className="block pt-3 md:table-cell md:px-4 md:py-4">
                  <div className="flex gap-2 md:justify-end">
                    <button className="btn-secondary flex-1 px-4 py-3 text-sm md:flex-none">
                      Make Default
                    </button>
                    <button className="btn-secondary flex-1 px-4 py-3 text-sm md:flex-none">
                      Edit
                    </button>
                    <button className="btn-secondary flex-1 px-4 py-3 text-sm md:flex-none">
                      Remove
                    </button>
                  </div>
                </td>
              )}
            </tr>
          </tbody>
        </table>

        <p className="mt-4 text-xs">
          A method still used by vendor accounts can't be removed until those
          accounts are switched to another method.
        </p>
      </section>

      {/* Add payment method form */}
      {isOrganizationAdmin && (
        <section id="add-method" className="card mt-8">
          <h2 className="section-title">Add Payment Method</h2>

          <form onSubmit={(e) => e.preventDefault()} className="mt-4">
            <fieldset>
              <legend className="label">Type</legend>
              <div className="mt-2 flex flex-col gap-2 md:flex-row">
                {methodTypes.map(({ label, key }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 rounded-lg border bg-white px-4 py-3 text-sm ${
                      methodType === key ? "border-primary" : "border-secondary"
                    }`}
                  >
                    <input
                      type="radio"
                      name="method_type"
                      value={key}
                      checked={methodType === key}
                      onChange={() => setMethodType(key)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {fieldsByType[methodType].map(({ label, id, placeholder }) => (
                <div key={id}>
                  <label htmlFor={id} className="label">
                    {label}
                  </label>
                  <input
                    id={id}
                    type="text"
                    placeholder={placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>

            <label className="mt-6 flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_default" />
              Make this the default method
            </label>

            <button
              type="submit"
              className="btn-primary mt-6 px-5 py-3 text-sm"
            >
              Save Method
            </button>
          </form>
        </section>
      )}
    </>
  );
}

export default PaymentMethodsSettings;
