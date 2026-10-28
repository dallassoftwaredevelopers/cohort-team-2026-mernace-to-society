
import { useState } from "react"


function ExtractedInfo(){

    const [formData, setFormData] = useState({
      property: "",
      vendor: "",
      invoiceNumber:"",
      amount: "",
      invoiceDate:"",
      dueDate:"",
      category: "",
      approver:""
  })

 async function handleSubmit(e){
      e.preventDefault()

      const res = await fetch("/api/bills", {
        method:"POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if(!res.ok){
        throw new Error("Failed to submit bill")
      }


  }

 return (

 

<form  className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="property"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Property
                  </label>

                  {/* <select
                    id="property"
                    defaultValue=""
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Select property
                    </option>
                    <option value="property1">Oakwood Aparments</option>
                    <option value="property2">Roya Oaks Apartments</option>
                  </select> */}
                    <input
                      id="property"
                      type="text"
                      placeholder="Royal Oaks Apartments"
                      value={formData.property}
                      onChange={(e) => setFormData((prev) => ({...prev, property:e.target.value}))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vendor"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Vendor
                    </label>

                    <input
                      id="vendor"
                      type="text"
                      placeholder="Florida Power & Light"
                      value={formData.vendor}
                      onChange={(e) => setFormData((prev) => ({...prev, vendor:e.target.value}))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="invoiceNumber"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Invoice Number
                    </label>

                    <input
                      id="invoiceNumber"
                      type="text"
                      placeholder="Enter invoice number"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData((prev) => ({...prev, invoiceNumber:e.target.value}))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="amount"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Amount
                    </label>

                    <input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData((prev) => ({...prev, amount:e.target.value}))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="invoiceDate"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Invoice Date
                    </label>

                    <input
                      id="invoiceDate"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData((prev) => ({...prev, date:e.target.value}))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="dueDate"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Due Date
                    </label>

                    <input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData((prev) => ({...prev, dueDate:e.target.value}))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Category
                    </label>

                    <select
                      id="category"
                      defaultValue=""
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({...prev, category:e.target.value}))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      <option value="utilities">Utilities</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="insurance">Insurance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                
                <div>
                  <label
                    htmlFor="approver"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Approver
                  </label>

                  <select
                    id="approver"
                    defaultValue=""
                    value={formData.approver}
                      onChange={(e) => setFormData((prev) => ({...prev, approver:e.target.value}))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Select approver
                    </option>
                    <option value="Robert">Robert</option>
                    <option value="John">John</option>
                  </select>
                </div>

              
                <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded-md bg-[#2460D5] px-4 py-2 text-sm font-medium text-white hover:bg-[#194DB4]"
                  >
                    Review &amp; Submit
                  </button>
                </div>
              </form>
)

}

export default ExtractedInfo