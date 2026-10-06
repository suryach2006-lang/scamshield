/**
 * ScamShield Frontend API Client
 * Sends analysis requests strictly to the Node/Express backend.
 * Never calls SerpApi directly from the browser.
 */

// Uses Vite proxy '/api' by default, with fallback to local backend port 5000
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Submits a job listing payload to the backend analysis engine.
 * @param {Object} listingData
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeJob = async (listingData) => {
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(listingData)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ||
        data?.message ||
        `Backend returned error status ${response.status} (${response.statusText})`;
      const error = new Error(errorMessage);
      error.code = data?.error?.code || 'API_ERROR';
      error.status = response.status;
      throw error;
    }

    // Return the response data payload
    return data.data || data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const connectionError = new Error(
        'Unable to connect to the ScamShield backend service. Ensure the Node/Express server is running on port 5000.'
      );
      connectionError.code = 'BACKEND_OFFLINE';
      throw connectionError;
    }
    throw err;
  }
};

/**
 * Checks backend health status.
 * @returns {Promise<Object>}
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) return { online: false };
    const data = await response.json();
    return { online: true, ...data };
  } catch {
    return { online: false };
  }
};

/**
 * Saves a completed analysis scan to the MongoDB database.
 * @param {Object} scanPayload - { input, results }
 * @returns {Promise<Object>} Saved scan document
 */
export const saveScan = async (scanPayload) => {
  try {
    const response = await fetch(`${API_BASE}/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scanPayload)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.error?.message || 'Failed to save scan analysis.');
      error.code = data?.error?.code || 'SAVE_SCAN_ERROR';
      throw error;
    }

    return data.data || data;
  } catch (err) {
    console.error('saveScan error:', err);
    throw err;
  }
};

/**
 * Retrieves a list of recent scan analyses.
 * @param {number} limit
 * @returns {Promise<Array>} List of scan summary objects
 */
export const getRecentScans = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE}/scans?limit=${limit}`);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Failed to load recent scans.');
    }

    return data.data || [];
  } catch (err) {
    console.error('getRecentScans error:', err);
    return [];
  }
};

/**
 * Retrieves a single scan with its complete results by ID.
 * @param {string} id - Scan ID
 * @returns {Promise<Object>} Complete scan document
 */
export const getScanById = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/scans/${encodeURIComponent(id)}`);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error?.message || `Failed to retrieve scan ${id}.`);
    }

    return data.data || data;
  } catch (err) {
    console.error('getScanById error:', err);
    throw err;
  }
};

