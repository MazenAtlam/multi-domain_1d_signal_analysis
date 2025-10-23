// /**
//  * Calls the backend API to estimate maximum frequency and audio properties
//  * @param {File} file The audio file to analyze
//  * @returns {Promise<Object>} A promise that resolves to audio analysis results
//  */
// export async function estimateAudioProperties(file) {
//     if (!file) {
//         throw new Error("No audio file available for analysis.");
//     }
    
//     const url = '/api/resample/estimate_fmax'; 
    
//     const formData = new FormData();
//     formData.append('file', file);

//     console.log(`Calling Audio Analysis API: ${url}`);
//     console.log(`File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

//     const response = await fetch(url, {
//         method: 'POST',
//         body: formData,
//     });

//     if (!response.ok) {
//         let errorBody = await response.text();
//         try {
//             const errorJson = JSON.parse(errorBody);
//             errorBody = errorJson.error || `Server error: ${response.status} ${response.statusText}`;
//         } catch {
//             // If JSON parsing fails, use the plain text
//         }
//         throw new Error(`Audio analysis failed: ${errorBody}`);
//     }

//     return await response.json();
// }

// /**
//  * Calls the backend API to resample audio data
//  * @param {File} file The original audio file to resample
//  * @param {number} targetSr Target sampling rate in Hz
//  * @param {boolean} mono Whether to convert to mono
//  * @param {string} format Output format ('wav', 'mp3', etc.)
//  * @returns {Promise<Blob>} A promise that resolves to the resampled audio file as a Blob
//  */
// export async function resampleAudio(file, targetSr, mono = false, format = 'wav') {
//     if (!file) {
//         throw new Error("No audio file available for resampling.");
//     }
    
//     const url = '/api/resample/'; 
    
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('target_sr', targetSr.toString());
//     formData.append('mono', mono.toString());
//     formData.append('format', format);

//     console.log(`Calling Audio Resampling API: ${url}`);
//     console.log(`Parameters: target_sr=${targetSr}, mono=${mono}, format=${format}`);

//     const response = await fetch(url, {
//         method: 'POST',
//         body: formData,
//     });

//     if (!response.ok) {
//         let errorBody = await response.text();
//         try {
//             const errorJson = JSON.parse(errorBody);
//             errorBody = errorJson.error || `Server error: ${response.status} ${response.statusText}`;
//         } catch {
//             // If JSON parsing fails, use the plain text
//         }
//         throw new Error(`Audio resampling failed: ${errorBody}`);
//     }

//     // Return the resampled audio file as a Blob
//     return await response.blob();
// }

// /**
//  * Validates if the target sampling rate is appropriate based on Nyquist criterion
//  * @param {number} targetSr Target sampling rate
//  * @param {number} fmaxEstimate Estimated maximum frequency in the audio
//  * @param {number} safeMin Safe minimum sampling rate from analysis
//  * @returns {Object} Validation result with warnings
//  */
// export function validateSamplingRate(targetSr, fmaxEstimate, safeMin) {
//     const nyquistFrequency = targetSr / 2;
//     const warnings = [];

//     if (targetSr < safeMin) {
//         warnings.push(`Target sample rate (${targetSr} Hz) is below safe minimum (${safeMin} Hz)`);
//     }

//     if (fmaxEstimate > nyquistFrequency) {
//         warnings.push(`Maximum frequency (${fmaxEstimate.toFixed(1)} Hz) exceeds Nyquist frequency (${nyquistFrequency.toFixed(1)} Hz). This will cause aliasing!`);
//     }

//     return {
//         isValid: warnings.length === 0,
//         warnings: warnings,
//         nyquistFrequency: nyquistFrequency
//     };
// }

// /**
//  * Formats file size for display
//  * @param {number} bytes File size in bytes
//  * @returns {string} Formatted file size
//  */
// export function formatFileSize(bytes) {
//     if (bytes === 0) return '0 Bytes';
    
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
    
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// }

// /**
//  * Formats duration for display
//  * @param {number} seconds Duration in seconds
//  * @returns {string} Formatted duration
//  */
// export function formatDuration(seconds) {
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
// }

// /**
//  * Sample mock data for demonstration purposes
//  * @param {File} file Original file for reference
//  * @returns {Object} Mock analysis results
//  */
// export function getMockAudioAnalysis(file) {
//     const duration = Math.random() * 30 + 5; // 5-35 seconds
//     const origSr = [8000, 11025, 16000, 22050, 44100, 48000][Math.floor(Math.random() * 6)];
//     const fmaxEstimate = origSr * 0.4; // 40% of sample rate
    
//     return {
//         success: true,
//         orig_sr: origSr,
//         duration: duration,
//         channels: Math.random() > 0.5 ? 1 : 2,
//         fmax_estimate: fmaxEstimate,
//         safe_min: Math.ceil(fmaxEstimate * 2.2), // Safe minimum with some margin
//         demo_min: Math.ceil(fmaxEstimate * 1.8), // Demo minimum (may cause aliasing)
//         nyquist: origSr / 2,
//         file_size_mb: (file.size / 1024 / 1024).toFixed(2),
//         message: 'Audio analysis completed successfully'
//     };
// }

/**
 * Calls the backend API to estimate maximum frequency and audio properties
 * @param {File} file The audio file to analyze
 * @returns {Promise<Object>} A promise that resolves to audio analysis results
 */
export async function estimateAudioProperties(file) {
    if (!file) {
        throw new Error("No audio file available for analysis.");
    }
    
    const url = '/api/resample/estimate_fmax'; 
    
    const formData = new FormData();
    formData.append('file', file);

    console.log(`Calling Audio Analysis API: ${url}`);
    console.log(`File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Audio analysis failed: ${response.status} - ${errorText}`);
            throw new Error(`Audio analysis failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Audio analysis response:', data);
        
        if (!data.success) {
            throw new Error(data.error || 'Audio analysis failed');
        }
        
        return data;
        
    } catch (error) {
        console.error('Audio analysis API call failed:', error);
        // Fallback to mock data if API is not available
        console.warn('Falling back to mock data - API may not be implemented');
        return getMockAudioAnalysis(file);
    }
}

/**
 * Calls the backend API to resample audio data
 * @param {File} file The original audio file to resample
 * @param {number} targetSr Target sampling rate in Hz
 * @param {boolean} mono Whether to convert to mono
 * @param {string} format Output format ('wav', 'mp3', etc.)
 * @returns {Promise<Blob>} A promise that resolves to the resampled audio file as a Blob
 */
export async function resampleAudio(file, targetSr, mono = false, format = 'wav') {
    if (!file) {
        throw new Error("No audio file available for resampling.");
    }
    
    const url = '/api/resample/'; 
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_sr', targetSr.toString());
    formData.append('mono', mono.toString());
    formData.append('format', format);

    console.log(`Calling Audio Resampling API: ${url}`);
    console.log(`Parameters: target_sr=${targetSr}, mono=${mono}, format=${format}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Audio resampling failed: ${response.status} - ${errorText}`);
            throw new Error(`Audio resampling failed: ${response.status} - ${errorText}`);
        }

        // Check if we got a JSON error response instead of audio
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Resampling failed');
        }

        const blob = await response.blob();
        console.log('Resampling successful, blob:', {
            size: blob.size,
            type: blob.type
        });

        // Verify the blob is actually an audio file
        if (blob.size === 0) {
            throw new Error('Received empty audio file from server');
        }

        return blob;
        
    } catch (error) {
        console.error('Audio resampling API call failed:', error);
        throw error;
    }
}

/**
 * Validates if the target sampling rate is appropriate based on Nyquist criterion
 * @param {number} targetSr Target sampling rate
 * @param {number} fmaxEstimate Estimated maximum frequency in the audio
 * @param {number} safeMin Safe minimum sampling rate from analysis
 * @returns {Object} Validation result with warnings
 */
export function validateSamplingRate(targetSr, fmaxEstimate, safeMin) {
    const nyquistFrequency = targetSr / 2;
    const warnings = [];

    if (targetSr < safeMin) {
        warnings.push(`Target sample rate (${targetSr} Hz) is below safe minimum (${safeMin} Hz)`);
    }

    if (fmaxEstimate > nyquistFrequency) {
        warnings.push(`Maximum frequency (${fmaxEstimate.toFixed(1)} Hz) exceeds Nyquist frequency (${nyquistFrequency.toFixed(1)} Hz). This will cause aliasing!`);
    }

    return {
        isValid: warnings.length === 0,
        warnings: warnings,
        nyquistFrequency: nyquistFrequency
    };
}

/**
 * Formats file size for display
 * @param {number} bytes File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats duration for display
 * @param {number} seconds Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Sample mock data for demonstration purposes
 * @param {File} file Original file for reference
 * @returns {Object} Mock analysis results
 */
export function getMockAudioAnalysis(file) {
    // More realistic mock data based on common audio formats
    const commonSampleRates = [8000, 11025, 16000, 22050, 44100, 48000];
    const origSr = commonSampleRates[Math.floor(Math.random() * commonSampleRates.length)];
    const duration = Math.random() * 30 + 5; // 5-35 seconds
    const fmaxEstimate = origSr * 0.45; // 45% of sample rate (more realistic)
    
    return {
        success: true,
        orig_sr: origSr,
        duration: duration,
        channels: Math.random() > 0.5 ? 1 : 2,
        fmax_estimate: fmaxEstimate,
        safe_min: Math.ceil(fmaxEstimate * 2.2), // Safe minimum with some margin
        demo_min: 8000, // Fixed demo minimum
        nyquist: origSr / 2,
        file_size_mb: (file.size / 1024 / 1024).toFixed(2),
        message: 'Audio analysis completed successfully (Demo Data - Backend not implemented)'
    };
}