const isAudioFile = (file) => {
    // Check MIME type first
    const audioMimeTypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/webm',
        'audio/flac',
        'audio/x-m4a',
        'audio/mp4',
        'audio/opus'
    ];

    if (audioMimeTypes.includes(file.type)) {
        return true;
    }

    // Fallback: Check file extension
    const audioExtensions = [
        '.mp3', '.wav', '.ogg', '.aac',
        '.webm', '.flac', '.m4a', '.mp4',
        '.wma', '.aiff', '.opus'
    ];

    const fileName = file.name.toLowerCase();
    return audioExtensions.some(ext => fileName.endsWith(ext));
};

// Function to format time (seconds to MM:SS)
const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export { isAudioFile, formatTime };