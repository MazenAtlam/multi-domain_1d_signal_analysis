"""EEG Aliasing Test Blueprint"""

from flask import Blueprint, request, jsonify, send_file
import numpy as np
import io
import math

from utils.eeg_aliasing import (
    generate_multichannel_eeg,
    save_eeg_to_csv,
    load_eeg_from_csv,
    estimate_fmax,
    resample_eeg,
    energy_above_cutoff,
    get_band_powers
)

eeg_aliasing_bp = Blueprint('eeg_aliasing', __name__)

@eeg_aliasing_bp.route('/generate/8ch', methods=['POST', 'GET'])
def generate_8ch_eeg():
    """
    Generate synthetic 8-channel EEG and return as CSV
    
    Query parameters:
        - fs: Sampling frequency (default: 500 Hz)
        - duration: Duration in seconds (default: 10)
        - sources: Number of independent sources (default: 4)
        - seed: Random seed for reproducibility (optional)
    """
    try:
        # Get parameters
        fs = int(request.args.get('fs', 500))
        duration = float(request.args.get('duration', 10.0))
        sources = int(request.args.get('sources', 4))
        seed = request.args.get('seed')
        
        if seed is not None:
            seed = int(seed)
        
        # Validate parameters
        if fs < 100 or fs > 10000:
            return jsonify({"error": "fs must be between 100 and 10000 Hz"}), 400
        if duration < 1 or duration > 60:
            return jsonify({"error": "duration must be between 1 and 60 seconds"}), 400
        if sources < 1 or sources > 8:
            return jsonify({"error": "sources must be between 1 and 8"}), 400
        
        # Generate EEG
        data, fs_out = generate_multichannel_eeg(
            fs=fs,
            duration_s=duration,
            nchannels=8,
            sources=sources,
            seed=seed
        )
        
        # Save to CSV string
        csv_content = save_eeg_to_csv(None, data, fs_out, time_col=True, header_comment=True)
        
        # Create file-like object
        output = io.BytesIO()
        output.write(csv_content.encode('utf-8'))
        output.seek(0)
        
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'synthetic_eeg_8ch_{fs}Hz.csv'
        )
    
    except Exception as e:
        import traceback
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

@eeg_aliasing_bp.route('/generate/32ch', methods=['POST', 'GET'])
def generate_32ch_eeg():
    """
    Generate synthetic 32-channel EEG and return as CSV
    
    Query parameters:
        - fs: Sampling frequency (default: 1000 Hz)
        - duration: Duration in seconds (default: 10)
        - sources: Number of independent sources (default: 8)
        - seed: Random seed for reproducibility (optional)
    """
    try:
        # Get parameters
        fs = int(request.args.get('fs', 1000))
        duration = float(request.args.get('duration', 10.0))
        sources = int(request.args.get('sources', 8))
        seed = request.args.get('seed')
        
        if seed is not None:
            seed = int(seed)
        
        # Validate parameters
        if fs < 100 or fs > 10000:
            return jsonify({"error": "fs must be between 100 and 10000 Hz"}), 400
        if duration < 1 or duration > 60:
            return jsonify({"error": "duration must be between 1 and 60 seconds"}), 400
        if sources < 1 or sources > 32:
            return jsonify({"error": "sources must be between 1 and 32"}), 400
        
        # Generate EEG
        data, fs_out = generate_multichannel_eeg(
            fs=fs,
            duration_s=duration,
            nchannels=32,
            sources=sources,
            seed=seed
        )
        
        # Save to CSV string
        csv_content = save_eeg_to_csv(None, data, fs_out, time_col=True, header_comment=True)
        
        # Create file-like object
        output = io.BytesIO()
        output.write(csv_content.encode('utf-8'))
        output.seek(0)
        
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'synthetic_eeg_32ch_{fs}Hz.csv'
        )
    
    except Exception as e:
        import traceback
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

@eeg_aliasing_bp.route('/generate/64ch', methods=['POST', 'GET'])
def generate_64ch_eeg():
    """
    Generate synthetic 64-channel EEG and return as CSV
    
    Query parameters:
        - fs: Sampling frequency (default: 2000 Hz)
        - duration: Duration in seconds (default: 10)
        - sources: Number of independent sources (default: 12)
        - seed: Random seed for reproducibility (optional)
    """
    try:
        # Get parameters
        fs = int(request.args.get('fs', 2000))
        duration = float(request.args.get('duration', 10.0))
        sources = int(request.args.get('sources', 12))
        seed = request.args.get('seed')
        
        if seed is not None:
            seed = int(seed)
        
        # Validate parameters
        if fs < 100 or fs > 10000:
            return jsonify({"error": "fs must be between 100 and 10000 Hz"}), 400
        if duration < 1 or duration > 60:
            return jsonify({"error": "duration must be between 1 and 60 seconds"}), 400
        if sources < 1 or sources > 64:
            return jsonify({"error": "sources must be between 1 and 64"}), 400
        
        # Generate EEG
        data, fs_out = generate_multichannel_eeg(
            fs=fs,
            duration_s=duration,
            nchannels=64,
            sources=sources,
            seed=seed
        )
        
        # Save to CSV string
        csv_content = save_eeg_to_csv(None, data, fs_out, time_col=True, header_comment=True)
        
        # Create file-like object
        output = io.BytesIO()
        output.write(csv_content.encode('utf-8'))
        output.seek(0)
        
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'synthetic_eeg_64ch_{fs}Hz.csv'
        )
    
    except Exception as e:
        import traceback
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

@eeg_aliasing_bp.route('/analyze', methods=['POST'])
def analyze_eeg():
    """
    Analyze uploaded EEG CSV file
    
    Returns:
        - orig_sr: Original sampling rate
        - duration: Duration in seconds
        - channels: Number of channels
        - fmax_estimate: Estimated maximum frequency
        - safe_min: Safe minimum sample rate (2.1 * fmax)
        - demo_min: Demo minimum sample rate
        - nyquist: Nyquist frequency
        - band_powers: Power in each EEG band (delta, theta, alpha, beta, gamma)
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Read CSV content
        csv_content = file.read().decode('utf-8')
        
        # Load EEG data
        data, fs, meta = load_eeg_from_csv(csv_content)
        
        if fs is None:
            return jsonify({"error": "Could not determine sampling rate from CSV"}), 400
        
        # Get info
        duration = len(data) / fs
        channels = data.shape[1]
        
        # Estimate fmax
        fmax = estimate_fmax(data, fs)
        
        # Calculate bounds
        safe_min = math.ceil(2 * fmax * 1.05)
        demo_min = max(25, int(0.25 * 2 * fmax))  # Lower than ECG for EEG
        nyquist = fs / 2
        
        # Get band powers
        band_powers = get_band_powers(data, fs)
        
        return jsonify({
            "success": True,
            "orig_sr": int(fs),
            "duration": float(duration),
            "channels": int(channels),
            "fmax_estimate": float(fmax),
            "safe_min": int(safe_min),
            "demo_min": int(demo_min),
            "nyquist": float(nyquist),
            "channel_names": meta.get('columns', []),
            "band_powers": {k: float(v) for k, v in band_powers.items()},
            "eeg_bands": {
                "delta": "0.5-4 Hz (deep sleep)",
                "theta": "4-8 Hz (drowsiness)",
                "alpha": "8-12 Hz (relaxed)",
                "beta": "12-30 Hz (active thinking)",
                "gamma": "30-100 Hz (cognitive processing)"
            }
        })
    
    except Exception as e:
        import traceback
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

@eeg_aliasing_bp.route('/resample', methods=['POST'])
def resample_eeg_endpoint():
    """
    Resample EEG CSV file
    
    Form parameters:
        - file: CSV file
        - target_sr: Target sampling rate
        - mode: 'safe' or 'demo' (default: 'safe')
    
    Returns:
        Resampled CSV file
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Get parameters
        target_sr = int(request.form.get('target_sr'))
        mode = request.form.get('mode', 'safe')
        
        if mode not in ['safe', 'demo']:
            return jsonify({"error": "mode must be 'safe' or 'demo'"}), 400
        
        if target_sr < 25 or target_sr > 10000:
            return jsonify({"error": "target_sr must be between 25 and 10000"}), 400
        
        # Read CSV
        csv_content = file.read().decode('utf-8')
        data, orig_sr, meta = load_eeg_from_csv(csv_content)
        
        if orig_sr is None:
            return jsonify({"error": "Could not determine sampling rate"}), 400
        
        # Resample
        resampled_data, new_sr = resample_eeg(data, orig_sr, target_sr, mode=mode)
        
        # Generate CSV
        csv_output = save_eeg_to_csv(None, resampled_data, new_sr, time_col=True, header_comment=True)
        
        # Create file
        output = io.BytesIO()
        output.write(csv_output.encode('utf-8'))
        output.seek(0)
        
        mode_suffix = "_aliased" if mode == 'demo' else "_safe"
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'eeg_resampled_{target_sr}Hz{mode_suffix}.csv'
        )
    
    except Exception as e:
        import traceback
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

@eeg_aliasing_bp.route('/info', methods=['GET'])
def info():
    """Service information"""
    return jsonify({
        "service": "EEG Aliasing Test Service",
        "version": "1.0.0",
        "description": "Generate synthetic EEG signals and demonstrate aliasing effects in brain recordings",
        "endpoints": {
            "/generate/8ch": "GET - Generate 8-channel synthetic EEG CSV",
            "/generate/32ch": "GET - Generate 32-channel synthetic EEG CSV",
            "/generate/64ch": "GET - Generate 64-channel synthetic EEG CSV",
            "/analyze": "POST - Analyze EEG CSV and estimate Fmax",
            "/resample": "POST - Resample EEG with safe or demo (aliasing) mode",
            "/info": "GET - Service information"
        },
        "parameters": {
            "generate": {
                "fs": "Sampling frequency (100-10000 Hz)",
                "duration": "Duration in seconds (1-60, default: 10)",
                "sources": "Number of independent sources (mixing model)",
                "seed": "Random seed for reproducibility (optional)"
            },
            "resample": {
                "target_sr": "Target sampling rate (25-10000 Hz)",
                "mode": "'safe' (anti-alias) or 'demo' (allow aliasing)"
            }
        },
        "eeg_bands": {
            "delta": "0.5-4 Hz (deep sleep, brain repair)",
            "theta": "4-8 Hz (drowsiness, meditation)",
            "alpha": "8-12 Hz (relaxed, eyes closed)",
            "beta": "12-30 Hz (active thinking, focus)",
            "gamma": "30-100+ Hz (cognitive processing, attention)"
        },
        "recommended_ranges": {
            "typical_eeg_rates": [250, 500, 1000, 2000],
            "clinical_rate": 250,
            "research_rate": 1000,
            "gamma_research": "≥1000 Hz",
            "typical_fmax": "40-200 Hz (alpha-dominated to gamma/EMG)",
            "safe_downsample_rule": "target_sr >= 2.1 * fmax"
        },
        "artifacts": {
            "eye_blinks": "Low frequency (0.5-4 Hz)",
            "muscle_emg": "High frequency (>30 Hz, aliases badly)",
            "line_noise": "50/60 Hz and harmonics"
        }
    })