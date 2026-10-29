// Placeholder hardcorded property records.
// Grouping logic used to display records in category tables.

import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

const properties = [
  {
    id: 1,
    type: "Residential",
    name: "Oakwood Apartments",
    address: "124 Main St",
    size: "24 Units",
    status: "Active",
  },
  {
    id: 2,
    type: "Residential",
    name: "Pineview Residences",
    address: "55 Pineview Dr",
    size: "16 Units",
    status: "Active",
  },
  {
    id: 3,
    type: "Residential",
    name: "Sunny Apartments",
    address: "123 Main St",
    size: "12 Units",
    status: "Active",
  },
  {
    id: 4,
    type: "Residential",
    name: "Cedar Grove Homes",
    address: "840 Cedar Ln",
    size: "8 Units",
    status: "Active",
  },
  {
    id: 5,
    type: "Commercial",
    name: "Market Square Plaza",
    address: "300 Market St",
    size: "12,000 sq ft",
    status: "Active",
  },
  {
    id: 6,
    type: "Commercial",
    name: "Riverside Offices",
    address: "18 River Rd",
    size: "6,400 sq ft",
    status: "Active",
  },
  {
    id: 7,
    type: "Commercial",
    name: "Pioneer Shops",
    address: "720 Pioneer Ave",
    size: "4,000 sq ft",
    status: "Active",
  },
  {
    id: 8,
    type: "Multi-Family",
    name: "Harbor View Lofts",
    address: "22 Harbor Way",
    size: "32 Units",
    status: "Active",
  },
  {
    id: 9,
    type: "Multi-Family",
    name: "Riverwalk Commons",
    address: "99 Riverwalk Blvd",
    size: "36 Units",
    status: "Active",
  },
  {
    id: 10,
    type: "Multi-Family",
    name: "Maple Court",
    address: "410 Maple St",
    size: "24 Units",
    status: "Active",
  },
  {
    id: 11,
    type: "Industrial",
    name: "Warehouse District 2",
    address: "210 Depot St",
    size: "38,000 sq ft",
    status: "Active",
  },
  {
    id: 12,
    type: "Industrial",
    name: "Westside Distribution",
    address: "600 Westside Pkwy",
    size: "24,000 sq ft",
    status: "Active",
  },
];

const groupedProperties = [
  {
    type: "Residential",
    properties: properties.filter(
      (property) => property.type === "Residential",
    ),
  },
  {
    type: "Commercial",
    properties: properties.filter((property) => property.type === "Commercial"),
  },
  {
    type: "Multi-Family",
    properties: properties.filter(
      (property) => property.type === "Multi-Family",
    ),
  },
  {
    type: "Industrial",
    properties: properties.filter((property) => property.type === "Industrial"),
  },
];

function PropertiesPage() {
  return (
    <div className="flex min-h-screen bg-white text-black">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-serif text-2xl font-bold">Properties</h1>
            <button type="button" className="btn-primary px-5 py-3 text-sm">
              + Add Property
            </button>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            <div className="card">
              <h3 className="text-sm font-semibold">Total Properties</h3>
              <p className="mt-3 text-3xl font-bold">12</p>
              <p className="mt-1 text-xs">Across 4 property types</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold">Residential</h3>
              <p className="mt-3 text-3xl font-bold">4</p>
              <p className="mt-1 text-xs">60 units total</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold">Commercial</h3>
              <p className="mt-3 text-3xl font-bold">3</p>
              <p className="mt-1 text-xs">22,400 sq ft</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold">Active Properties</h3>
              <p className="mt-3 text-3xl font-bold">12</p>
              <p className="mt-1 text-xs">All properties active</p>
            </div>
          </section>

          <section className="card mt-8">
            <div className="flex items-baseline justify-between border-b border-black pb-4">
              <h2 className="text-lg font-bold">Properties by Type</h2>
              <span className="text-sm">12 total properties</span>
            </div>

            {groupedProperties.map(({ type, properties: typeProperties }) => (
              <div key={type} className="mt-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{type}</h3>
                  <span className="text-xs">
                    {typeProperties.length} properties
                  </span>
                </div>

                <div className="mt-2 overflow-x-auto rounded-lg bg-white">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase">
                        <th className="px-4 py-3 font-semibold">
                          Property Name
                        </th>
                        <th className="px-4 py-3 font-semibold">Address</th>
                        <th className="px-4 py-3 font-semibold">
                          Units / Size
                        </th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeProperties.map((property) => (
                        <tr
                          key={property.id}
                          className="border-t border-section"
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            {property.name}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {property.address}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {property.size}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                              {property.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default PropertiesPage;
