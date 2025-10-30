# Signal Viewer: Multi-Signal Viewer with Basic Processing

<!-- TOC -->
* [Signal Viewer: Multi-Signal Viewer with Basic Processing](#signal-viewer-multi-signal-viewer-with-basic-processing)
  * [About the Project](#about-the-project)
  * [Getting Started](#getting-started)
    * [Prerequisites](#prerequisites)
    * [Installation](#installation)
  * [Usage Examples](#usage-examples)
  * [Technologies Used](#technologies-used)
    * [Frontend](#frontend)
    * [Backend](#backend)
  * [Platform Pages](#platform-pages)
    * [Landing Page](#landing-page)
    * [ECG (Electrocardiogram)](#ecg-electrocardiogram)
      * [In-App](#in-app)
    * [EEG (Electroencephalogram)](#eeg-electroencephalogram)
      * [In-App](#in-app-1)
    * [Doppler Effect](#doppler-effect)
      * [In-App](#in-app-2)
    * [Radar Signals](#radar-signals)
      * [In-App](#in-app-3)
    * [Voice Recognition](#voice-recognition)
      * [In-App](#in-app-4)
  * [License](#license)
  * [Acknowledgments](#acknowledgments)
<!-- TOC -->

## About the Project

Signal Viewer is a comprehensive web application designed for visualizing and analyzing various types of signals including medical (ECG/EEG), acoustic, and radioFrequency signals. The application provides multiple visualization modes and integrates AI models for signal classification and abnormality detection.

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
    npm run dev
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
- **Voice Recognition**: Analyze voice samples to detect speaker gender with aliasing and antialiasing capabilities
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
- Flask
- TensorFlow/PyTorch (for AI models)
- NumPy/SciPy (for signal processing)

## Platform Pages

### Landing Page

- Hero Section

![Landing Hero Section](deliverables/Home/hero.jpg)

- About Section provides features summary for each page

|                                 EEG and ECG                                 |                                   Doppler and Radar                                    |
|:---------------------------------------------------------------------------:|:--------------------------------------------------------------------------------------:|
| ![Landing About Section: EEG and ECG](deliverables/Home/about_eeg_ecg.jpg)  | ![Landing About Section: Doppler and Radar](deliverables/Home/about_doppler_radar.jpg) |

---

### ECG (Electrocardiogram)

![ECG](deliverables/ECG/regular.jpg)

- Multi-channel ECG signal visualization
- Four types of abnormality detection
- Multiple viewing modes (continuous, XOR, polar, recurrence)
- Real-time AI-based diagnosis
- Zoom, pan, and playback controls
- Aliasing effects demonstration in standard mode

#### In-App

- [ECG Polar Graph](https://github.com/user-attachments/assets/49696ec2-cf48-4ee8-ada8-4e7a1017b80f)

- [ECG XOR Graph](https://github.com/user-attachments/assets/1202889e-fcfa-485c-85ea-c503a3ac5fcc)

![Channels](deliverables/ECG/channels.jpg)

![Features Cards and Requirements](deliverables/ECG/features_requirements.jpg)

---

### EEG (Electroencephalogram)

![EEG](deliverables/EEG/regular.jpg)

- Multi-channel EEG signal display
- Brain activity pattern recognition
- Abnormality classification (seizure, sleep disorders, etc.)
- Customizable channel selection and color mapping
- Aliasing effects demonstration in standard mode

#### In-App

- [EEG Polar Graph](https://github.com/user-attachments/assets/ab507126-af28-434b-8c97-5d0813e97a32)

- [EEG XOR Graph](https://github.com/user-attachments/assets/016bcc41-0216-47ff-9b03-dc802c8c92be)

![Classification Output](deliverables/EEG/classification.jpg)

![Channels and Channel Analysis](deliverables/EEG/channels_analysis.jpg)

![Features Cards and Requirements](deliverables/EEG/features_requirements.jpg)

---

### Doppler Effect

![Doppler](deliverables/Doppler/input_forms.jpg)

- Synthetic Doppler sound generation with customizable parameters (velocity, frequency, duration)
- Real vehicle passing sound analysis
- AI-based velocity and frequency estimation
- Interactive parameter controls
- Aliasing effects demonstration

#### In-App

- [Audio Aliasing](https://github.com/user-attachments/assets/f2e9969a-a630-45d0-951f-e5789644b9a6)

|                    Doppler Sound Generation                    |                    Doppler Analysis                     |
|:--------------------------------------------------------------:|:-------------------------------------------------------:|
| ![Doppler Sound Generation](deliverables/Doppler/generate.jpg) | ![Doppler Analysis](deliverables/Doppler/analysis.jpg)  |

![Features Cards and Guidelines](deliverables/Doppler/features_guidelines.jpg)

---

### Radar Signals

![Radar](deliverables/Radar/input_forms.jpg)

- SAR (Synthetic Aperture Radar) image classification
- Terrain type recognition (urban, forest, agricultural land, etc.)
- Drone signal detection among similar sounds
- Cosmic signal analysis and information extraction

#### In-App

![Drone Detection](deliverables/Radar/drone.jpg)

![Features Cards and Guidelines](deliverables/Radar/features_guidelines.jpg)

---

### Voice Recognition

![Voice Recognition](deliverables/Voice_Recognition/input_forms.jpg)

- Voice sample analysis for gender detection (male/female)
- Real-time audio processing and feature extraction
- Aliasing effects demonstration
- Anti-aliasing implementation to correct aliased female voices to restore original characteristics
- Spectral analysis and voice pattern visualization

#### In-App

- [Voice Analysis & Aliasing Results](https://github.com/user-attachments/assets/209cf6c3-2ecb-44e2-a0b0-954a762fdff9)
- [Anti-aliasing Process](https://github.com/user-attachments/assets/7d64d3c7-4e43-455d-8319-b9878dd0092e)

![Features Cards and Guidelines](deliverables/Voice_Recognition/features_guidelines.jpg)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Digital Signal Processing course instructors and teaching assistants

---

*Note: This project is for educational purposes as part of a Digital Signal Processing course. Medical diagnoses should not be relied upon for actual medical decisions.*