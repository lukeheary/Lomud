"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { EventCard } from "@/components/calendar/event-card";

export default function TestIcsPage() {
  const [icsUrl, setIcsUrl] = useState(
    "https://ics.ecal.com/ecal-sub/69681faa171ad600020df551/Big%20Night.ics"
  );
  const [city, setCity] = useState("San Francisco");
  const [state, setState] = useState("CA");
  const [category, setCategory] = useState<
    "music" | "food" | "art" | "sports" | "community" | "nightlife" | "other"
  >("nightlife");
  const [businessId, setBusinessId] = useState<string>("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const importMutation = trpc.event.importFromIcsFeed.useMutation();
  const { data: businesses } = trpc.business.listBusinesses.useQuery({});

  const handleImport = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const result = await importMutation.mutateAsync({
        icsUrl,
        defaultCity: city,
        defaultState: state,
        defaultCategory: category,
        overrideBusinessId: businessId || undefined,
      });
      setResponse(result);
    } catch (error: any) {
      setResponse({
        error: true,
        message: error.message || "Unknown error",
        details: error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">ICS Feed Import Tester</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-yellow-800 mb-2">⚠️ Setup Required</h2>
        <p className="text-sm text-yellow-700 mb-2">
          Before importing without a business, you need to create the system user in your database:
        </p>
        <code className="block bg-yellow-100 p-2 rounded text-xs text-yellow-900 overflow-x-auto">
          {`INSERT INTO users (id, email, username, first_name, last_name, role)
VALUES ('system_ics_importer', 'system@socialcal.internal', 'ics_importer_system', 'ICS', 'Importer', 'admin')
ON CONFLICT (id) DO NOTHING;`}
        </code>
        <p className="text-xs text-yellow-600 mt-2">
          Or select a business from the dropdown to skip this requirement.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">ICS Feed URL</label>
            <input
              type="text"
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value as
                    | "music"
                    | "food"
                    | "art"
                    | "sports"
                    | "community"
                    | "nightlife"
                    | "other"
                )
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="music">Music</option>
              <option value="food">Food</option>
              <option value="art">Art</option>
              <option value="sports">Sports</option>
              <option value="community">Community</option>
              <option value="nightlife">Nightlife</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Business (Optional)
            </label>
            <select
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">None (System Import)</option>
              {businesses?.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select a business to associate these events with, or leave as "None" to create system user first
            </p>
          </div>

          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Importing..." : "Import Events"}
          </button>
        </div>
      </div>

      {response && (
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">
            {response.error ? "Error" : "Import Result"}
          </h2>

          {response.error ? (
            <div className="text-red-600">
              <p className="font-semibold">{response.message}</p>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(response.details, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-100 p-4 rounded">
                  <div className="text-2xl font-bold text-green-800">
                    {response.summary?.imported || 0}
                  </div>
                  <div className="text-sm text-green-600">Imported</div>
                </div>
                <div className="bg-yellow-100 p-4 rounded">
                  <div className="text-2xl font-bold text-yellow-800">
                    {response.summary?.skipped || 0}
                  </div>
                  <div className="text-sm text-yellow-600">Skipped</div>
                </div>
                <div className="bg-red-100 p-4 rounded">
                  <div className="text-2xl font-bold text-red-800">
                    {response.summary?.failed || 0}
                  </div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
                <div className="bg-blue-100 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-800">
                    {response.summary?.totalProcessed || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total</div>
                </div>
              </div>

              {response.errors && response.errors.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-red-600 mb-2">Errors:</h3>
                  <ul className="list-disc pl-5 text-sm text-red-600">
                    {response.errors.map((error: string, idx: number) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {response.events && response.events.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Imported Events:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-auto">
                    {response.events.map((event: any) => (
                      <EventCard
                        key={event.id}
                        event={{
                          ...event,
                          startAt: new Date(event.startAt),
                          endAt: event.endAt ? new Date(event.endAt) : null,
                          business: event.businessId ? { name: "Business", slug: "" } : null,
                          userRsvp: null,
                          friendsGoing: [],
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">
                  View Full Response
                </summary>
                <pre className="mt-2 text-xs overflow-auto bg-gray-100 p-4 rounded">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
