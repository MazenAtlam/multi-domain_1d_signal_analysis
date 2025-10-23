/**
 * Calls the backend API to classify voice gender from audio data.
 * @param {File} file The audio file blob/object to upload.
 * @returns {Promise<Object>} A promise that resolves to the classification results.
 */
export async function classifyVoiceGender(file) {
    if (!file) {
        throw new Error("No audio file available for voice gender classification.");
    }
    
    // Use the voice gender classification endpoint
    const url = '/api/voice_gender/classify'; 
    
    const formData = new FormData();
    formData.append('file', file);

    console.log(`Calling Voice Gender Classification API: ${url}`);
    console.log(`File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        let errorBody = await response.text();
        try {
            const errorJson = JSON.parse(errorBody);
            errorBody = errorJson.error || errorJson.message || `Server error: ${response.status} ${response.statusText}`;
        } catch {
            // If JSON parsing fails, use the plain text
        }
        throw new Error(`Voice gender classification failed: ${errorBody}`);
    }

    // Return the classification results as JSON
    return await response.json();
}

/**
 * Validates if the file is a supported audio format
 * @param {File} file The file to validate
 * @returns {boolean} True if the file is a supported audio format
 */
export function validateAudioFile(file) {
    if (!file) return false;
    
    const supportedFormats = ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'aac'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const mimeType = file.type.toLowerCase();
    
    const isSupportedFormat = supportedFormats.includes(fileExtension) || 
                             mimeType.includes('audio') ||
                             mimeType.includes('wav') ||
                             mimeType.includes('mpeg');
    
    if (!isSupportedFormat) {
        console.warn(`Unsupported audio format: ${file.name} (${file.type})`);
        return false;
    }
    
    return true;
}

/**
 * Formats the classification results for consistent display
 * @param {Object} apiResponse The raw API response
 * @returns {Object} Formatted results with consistent structure
 */
export function formatVoiceResults(apiResponse) {
    // If the response already has the expected format, return it
    if (apiResponse.status === 'success' && apiResponse.gender) {
        return apiResponse;
    }

    // Handle different response structures
    let formattedResponse = {
        status: 'success',
        gender: 'unknown',
        confidence: 0,
        probabilities: {
            male: 0,
            female: 0
        },
        message: 'Classification completed'
    };

    // Map different API response formats to our standard format
    if (apiResponse.gender !== undefined) {
        formattedResponse.gender = apiResponse.gender;
    }

    if (apiResponse.confidence !== undefined) {
        formattedResponse.confidence = apiResponse.confidence;
    }

    if (apiResponse.probabilities !== undefined) {
        formattedResponse.probabilities = apiResponse.probabilities;
    } else if (apiResponse.probability !== undefined) {
        // Handle single probability value
        if (typeof apiResponse.probability === 'number') {
            formattedResponse.probabilities = {
                male: 100 - apiResponse.probability,
                female: apiResponse.probability
            };
        }
    }

    if (apiResponse.message !== undefined) {
        formattedResponse.message = apiResponse.message;
    }

    // Ensure confidence is set if not provided
    if (formattedResponse.confidence === 0 && formattedResponse.probabilities) {
        const maxProb = Math.max(
            formattedResponse.probabilities.male,
            formattedResponse.probabilities.female
        );
        formattedResponse.confidence = maxProb;
    }

    return formattedResponse;
}

/**
 * Sample mock data for demonstration purposes
 * @returns {Object} Mock classification results
 */
export function getMockVoiceResults() {
    return {
        status: 'success',
        gender: Math.random() > 0.5 ? 'male' : 'female',
        confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
        probabilities: {
            male: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 30),
            female: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 30)
        },
        features: {
            pitch: Math.random() > 0.5 ? 'Low frequency range' : 'High frequency range',
            timbre: Math.random() > 0.5 ? 'Rich and resonant' : 'Bright and clear',
            duration: (Math.random() * 5 + 1).toFixed(1) + ' seconds'
        },
        message: 'Sample voice data analyzed successfully.'
    };
}