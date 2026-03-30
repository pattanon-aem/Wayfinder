/**
 * Save a search location to user's search history
 * @param address - The address string
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 */
export async function saveSearchHistory(
  address: string,
  latitude: number,
  longitude: number
): Promise<void> {
  try {
    await fetch("/api/user/search-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, latitude, longitude }),
    });
  } catch (error) {
    // Silently fail - search history is non-critical
    console.error("Failed to save search history:", error);
  }
}
