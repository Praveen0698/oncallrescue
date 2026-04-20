// Reverse geocode using OpenStreetMap Nominatim (free, no API key)
export async function reverseGeocode(lat, lng) {
  if (!lat || !lng) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: { "User-Agent": "OnCallRescue Emergency App" },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    if (data && data.display_name) {
      // Build a shorter readable address
      const addr = data.address || {};
      const parts = [
        addr.road || addr.pedestrian || addr.neighbourhood,
        addr.suburb || addr.village || addr.town,
        addr.city || addr.county,
        addr.state,
      ].filter(Boolean);

      return {
        fullAddress: data.display_name,
        shortAddress: parts.join(", ") || data.display_name,
        road: addr.road || addr.pedestrian || "",
        area: addr.suburb || addr.neighbourhood || addr.village || "",
        city: addr.city || addr.town || addr.county || "",
        state: addr.state || "",
        pincode: addr.postcode || "",
      };
    }
    return null;
  } catch (err) {
    console.error("Geocode failed:", err.message);
    return null;
  }
}

// Generate Google Maps link
export function getGoogleMapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// Format location for display
export function formatLocation(location) {
  if (!location) return "Location unavailable";
  if (location.address) return location.address;
  if (location.lat && location.lng) return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  return "Location unavailable";
}
