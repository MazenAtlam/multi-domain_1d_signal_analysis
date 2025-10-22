/**
 * Calls the backend API to resample/filter the EEG data.
 * @param {File} file The original EEG file blob/object to upload.
 * @param {number} targetFmax The maximum frequency component to preserve (f_max) in Hz.
 * @param {'safe' | 'demo'} mode The operation mode: 'safe' (anti-alias filter) or 'demo' (no filter).
 * @param {number} originalSr The original sampling rate of the data (used for context in API).
 * @returns {Promise<Blob>} A promise that resolves to the new resampled file as a Blob.
 */
export async function resampleEEG(file, targetFmax, mode, originalSr) {
    if (!file) {
        throw new Error("No EEG file available for resampling.");
    }
    
    // Use the proxy path like in the documentation examples
    const url = '/api/eeg_aliasing/resample'; 
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Calculate target sampling rate based on Nyquist criterion
    const targetSr = 2 * targetFmax;
    
    // Send parameters exactly as shown in documentation
    formData.append('target_sr', targetSr.toString());
    formData.append('mode', mode);
    // Note: The documentation doesn't show sending original_sr, but it might be helpful

    console.log(`Calling EEG resample API: ${url}`);
    console.log(`Parameters: target_sr=${targetSr}, mode=${mode}`);

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        let errorBody = await response.text();
        try {
            const errorJson = JSON.parse(errorBody);
            errorBody = errorJson.error || `Server error: ${response.status} ${response.statusText}`;
        } catch {
            // If JSON parsing fails, use the plain text
        }
        throw new Error(`EEG resampling failed: ${errorBody}`);
    }

    // Return the resampled EEG file as a Blob for the component to handle download
    return response.blob();
}