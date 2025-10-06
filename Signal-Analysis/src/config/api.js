// src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const API_ENDPOINTS = {
  EEG_CLASSIFY: `${API_BASE_URL}/api/eeg/classify`,
  EEG_RESULTS: `${API_BASE_URL}/api/eeg/results`,
  EEG_STREAM: `${API_BASE_URL}/api/eeg/stream`,
};