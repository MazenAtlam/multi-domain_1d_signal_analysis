/**
 * Calls the backend API to resample/filter the ECG data.
 * @param {File} file The original ECG file blob/object to upload.
 * @param {number} targetFmax The maximum frequency component to preserve (f_max) in Hz.
 * @param {'safe' | 'demo'} mode The operation mode: 'safe' (anti-alias filter) or 'demo' (no filter).
 * @param {number} originalSr The original sampling rate of the data (used for context in API).
 * @returns {Promise<Blob>} A promise that resolves to the new resampled file as a Blob.
 */
export async function resampleECG(file, targetFmax, mode, originalSr) {
    if (!file) {
        throw new Error("No ECG file available for resampling.");
    }
    
    // Using the previously identified resampling endpoint structure
    const url = '/api/ecg_aliasing/resample'; 
    
    const formData = new FormData();
    formData.append('file', file);
    
    // NOTE: We assume the backend API expects the target_sr to be 2 * targetFmax (Nyquist rate)
    // or that it takes fmax and calculates the necessary filter/downsampling from that.
    // For this implementation, let's send fmax and the mode.
    formData.append('target_fmax', targetFmax);
    formData.append('mode', mode); 
    formData.append('original_sr', originalSr); // Pass original SR for context/validation

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        // Attempt to parse a JSON error message if the response body is available
        let errorBody = await response.text();
        try {
            const errorJson = JSON.parse(errorBody);
            errorBody = errorJson.error || `Server error: ${response.status} ${response.statusText}`;
        } catch {
            // If JSON parsing fails, use the plain text
        }
        throw new Error(`Resampling failed: ${errorBody}`);
    }

    // Return the resampled file as a Blob for the component to handle download
    return response.blob();
}