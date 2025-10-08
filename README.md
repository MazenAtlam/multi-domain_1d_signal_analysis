# Signal Viewer: Multi-Signal Viewer with Basic Processing

## About the Project

Signal Viewer is a comprehensive web application designed for visualizing and analyzing various types of signals including medical (ECG/EEG), acoustic, and radiofrequency signals. The application provides multiple visualization modes and integrates AI models for signal classification and abnormality detection.

This project was developed as part of a Digital Signal Processing course, demonstrating practical implementation of signal processing techniques combined with machine learning for real-world signal analysis.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Modern web browser with JavaScript enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MazenAtlam/multi-domain_1d_signal_analysis.git
cd multi-domain_1d_signal_analysis
```

2. Install frontend dependencies:
```bash
cd Signal-Analysis  # From root
npm install
```

3. Install backend dependencies:
```bash
cd Backend-API  # From root
pip install -r requirements.txt
```

4. Start the development server:
```bash
cd Signal-Analysis  # From root
npm start
```

5. Start the backend API (in a separate terminal):
```bash
cd Backend-API  # From root
python app.py
```

## Usage Examples

- **Medical Signals**: Upload ECG/EEG data files to visualize signals and receive AI-powered abnormality detection
- **Acoustic Analysis**: Generate Doppler effect sounds or analyze real vehicle recordings to estimate velocity and frequency
- **Radar Classification**: Process SAR images to classify terrain types or detect drone signals
- **Multiple Viewers**: Switch between continuous-time, XOR, polar, and recurrence plot visualizations

## Technologies Used

### Frontend
- React.js
- Vanilla JavaScript
- HTML5/CSS3
- Bootstrap
- Tailwind CSS

### Backend
- Python

## Features Explanation

### ECG (Electrocardiogram)
- Multi-channel ECG signal visualization
- Four types of abnormality detection
- Multiple viewing modes (continuous, XOR, polar, recurrence)
- Real-time AI-based diagnosis
- Zoom, pan, and playback controls

### EEG (Electroencephalogram)
- Multi-channel EEG signal display
- Brain activity pattern recognition
- Abnormality classification (seizure, sleep disorders, etc.)
- Customizable channel selection and color mapping

### Doppler Effect
- Synthetic Doppler sound generation with customizable parameters (velocity, frequency, duration)
- Real vehicle passing sound analysis
- AI-based velocity and frequency estimation
- Interactive parameter controls

### Radar Signals
- SAR (Synthetic Aperture Radar) image classification
- Terrain type recognition (urban, forest, agricultural land, etc.)
- Drone signal detection among similar sounds
- Cosmic signal analysis and information extraction

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Digital Signal Processing course instructors and teaching assistants

---

*Note: This project is for educational purposes as part of a Digital Signal Processing course. Medical diagnoses should not be relied upon for actual medical decisions.*