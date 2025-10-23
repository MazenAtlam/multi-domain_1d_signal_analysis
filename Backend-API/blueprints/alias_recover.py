"""
Audio Alias Recovery Blueprint
Recovers high-quality audio from aliased audio using deep learning
"""

import os
import io
import torch
import torchaudio
import numpy as np
import soundfile as sf
import tempfile
from flask import Blueprint, request, jsonify, send_file
from pathlib import Path
from werkzeug.utils import secure_filename

# Import the model
from poc_alias_recover import SmallResNet

# Create blueprint
alias_recover_bp = Blueprint('alias_recover', __name__)

# Configuration (match settings in poc_alias_recover.py)
TARGET_SR = 16000          # high sample rate (target)
DECIMATION = 4             # downsample factor to create aliasing (e.g., 4 -> 16k -> 4k)
SEG_LEN = TARGET_SR        # 1s window
HOP = SEG_LEN // 2         # 50% overlap
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                         "poc_out", "poc_model.pt")

# Initialize model
MODEL = None
MODEL_LOADED = False
MODEL_INFO = {
    'name': 'Audio Alias Recovery',
    'type': 'SmallResNet',
    'description': 'Recovers high-quality audio from aliased audio using deep learning',
    'target_sr': TARGET_SR,
    'decimation': DECIMATION,
    'device': DEVICE,
    'status': 'not loaded'
}

def init_model():
    """Initialize the model if not already loaded"""
    global MODEL, MODEL_LOADED, MODEL_INFO
    
    if MODEL_LOADED:
        return True
        
    try:
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            MODEL_INFO['status'] = 'failed - model file not found'
            print(f"Model file not found at {MODEL_PATH}")
            return False
            
        # Load model
        print(f"Loading audio alias recovery model from {MODEL_PATH}...")
        MODEL = SmallResNet().to(DEVICE)
        state = torch.load(MODEL_PATH, map_location=DEVICE)
        MODEL.load_state_dict(state)
        MODEL.eval()
        
        MODEL_LOADED = True
        MODEL_INFO['status'] = 'loaded'
        print("Audio alias recovery model loaded successfully")
        return True
        
    except Exception as e:
        MODEL_INFO['status'] = f'failed - {str(e)}'
        print(f"Error loading model: {e}")
        return False

# ---- Helper Functions ----
def naive_upsample_repeat(x_low, factor):
    """Naively upsample by repeating samples"""
    return np.repeat(x_low, factor)

def load_audio_mono(path):
    """Load audio and convert to mono"""
    wav, sr = torchaudio.load(path)  # (C, T)
    wav = torch.mean(wav, dim=0).numpy()
    return wav, sr

def prepare_input(loaded_wav, sr):
    """
    Ensure input is at TARGET_SR and has the aliased characteristic the model expects.
    - If file sr == TARGET_SR: assume already in model input format
    - If file sr < TARGET_SR: upsample by repeating to TARGET_SR (to preserve aliasing)
    - If file sr > TARGET_SR: resample to TARGET_SR
    """
    wav = loaded_wav
    if sr == TARGET_SR:
        inp = wav
    elif sr < TARGET_SR:
        # convert to integer factor if possible
        factor = int(round(TARGET_SR / sr))
        if abs(factor - (TARGET_SR / sr)) > 1e-6:
            raise ValueError(f"Non-integer upsample factor {TARGET_SR/sr:.3f} - adjust DECIMATION or resample manually.")
        inp = naive_upsample_repeat(wav, factor)
    else:
        # sr > TARGET_SR -> typical case: resample to TARGET_SR (we assume this is clean original)
        inp = torchaudio.functional.resample(torch.from_numpy(wav), sr, TARGET_SR).numpy()
    return inp

def chunkify(x, seg_len=SEG_LEN, hop=HOP, pad_value=0.0):
    """Break audio into overlapping chunks"""
    T = len(x)
    chunks = []
    if T <= seg_len:
        pad = seg_len - T
        chunk = np.pad(x, (0, pad), constant_values=pad_value)
        chunks.append((0, chunk))
        return chunks
    start = 0
    while start < T:
        end = start + seg_len
        if end <= T:
            chunk = x[start:end]
        else:
            # pad last
            pad = end - T
            chunk = np.pad(x[start:T], (0, pad), constant_values=pad_value)
        chunks.append((start, chunk))
        start += hop
    return chunks

def overlap_add(chunks_out, total_len, seg_len=SEG_LEN, hop=HOP):
    """Reconstruct audio from overlapping chunks using overlap-add with hann window"""
    out = np.zeros(total_len + seg_len)  # buffer a bit larger for padding-safe sum
    weight = np.zeros_like(out)
    win = np.hanning(seg_len)
    for start, chunk in chunks_out:
        out[start:start+seg_len] += chunk * win
        weight[start:start+seg_len] += win
    # avoid division by zero
    nonzero = weight > 1e-9
    out[nonzero] /= weight[nonzero]
    return out[:total_len]

def process_audio(input_path):
    """Process audio through the model"""
    if not MODEL_LOADED and not init_model():
        raise ValueError("Model not loaded")
        
    # Load input
    x, sr = load_audio_mono(input_path)
    inp = prepare_input(x, sr)   # now at TARGET_SR
    T = len(inp)

    # Chunk + normalize
    chunks = chunkify(inp, seg_len=SEG_LEN, hop=HOP)
    outputs = []
    
    for start, chunk in chunks:
        # normalize per-chunk same as training
        maxv = np.max(np.abs(chunk)) + 1e-9
        norm = chunk / maxv
        tensor = torch.from_numpy(norm).float().unsqueeze(0).unsqueeze(0).to(DEVICE)  # (1,1,T)
        
        with torch.no_grad():
            pred = MODEL(tensor).squeeze(0).squeeze(0).cpu().numpy()
            
        # undo normalization
        pred = pred * maxv
        outputs.append((start, pred))

    # Overlap-add reconstruct
    restored = overlap_add(outputs, total_len=T, seg_len=SEG_LEN, hop=HOP)

    # Clip to [-1,1]
    restored = np.clip(restored, -1.0, 1.0)
    
    return restored, TARGET_SR

# ---- API Endpoints ----
@alias_recover_bp.route('/recover', methods=['POST'])
def recover_audio():
    """
    Recover high-quality audio from aliased audio
    
    Request:
    - file: Audio file (WAV, MP3, FLAC, OGG)
    
    Response:
    - Recovered audio file as WAV
    """
    if not MODEL_LOADED and not init_model():
        return jsonify({
            'status': 'error',
            'message': 'Model not loaded',
            'error': MODEL_INFO['status']
        }), 500
        
    if 'file' not in request.files:
        return jsonify({
            'status': 'error',
            'message': 'No file part'
        }), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({
            'status': 'error',
            'message': 'No selected file'
        }), 400
        
    # Check file extension
    allowed_extensions = ['.wav', '.mp3', '.flac', '.ogg']
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        return jsonify({
            'status': 'error',
            'message': f'Unsupported file format. Supported formats: {", ".join(allowed_extensions)}'
        }), 400
        
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            input_path = tmp.name
            file.save(input_path)
        
        # Process through model
        restored, sr = process_audio(input_path)
        
        # Clean up input file
        os.unlink(input_path)
        
        # Save to memory buffer
        output_buffer = io.BytesIO()
        sf.write(output_buffer, restored, sr, format='WAV')
        output_buffer.seek(0)
        
        # Extract original filename without extension
        filename = os.path.splitext(os.path.basename(file.filename))[0]
        
        # Return processed file
        return send_file(
            output_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name=f"{filename}_recovered.wav"
        )
        
    except Exception as e:
        import traceback
        if 'input_path' in locals() and os.path.exists(input_path):
            os.unlink(input_path)
            
        return jsonify({
            'status': 'error',
            'message': 'Error processing audio',
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@alias_recover_bp.route('/info', methods=['GET'])
def info():
    """Get information about the audio alias recovery model"""
    # Try to initialize the model if it's not loaded
    if not MODEL_LOADED:
        init_model()
        
    return jsonify(MODEL_INFO)

@alias_recover_bp.route('/health', methods=['GET'])
def health():
    """Check if the model is loaded and ready"""
    if MODEL_LOADED:
        return jsonify({
            'status': 'healthy',
            'message': 'Audio alias recovery model is loaded and ready'
        })
    else:
        # Try to initialize the model
        if init_model():
            return jsonify({
                'status': 'healthy',
                'message': 'Audio alias recovery model is now loaded and ready'
            })
        else:
            return jsonify({
                'status': 'unhealthy',
                'message': 'Audio alias recovery model is not loaded',
                'error': MODEL_INFO['status']
            }), 503