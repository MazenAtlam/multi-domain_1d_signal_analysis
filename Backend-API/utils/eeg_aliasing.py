"""
EEG Aliasing Test Utilities
Generates synthetic EEG signals and provides resampling with aliasing demonstrations
"""

import numpy as np
import pandas as pd
from scipy import signal
from fractions import Fraction
import math

try:
    import samplerate
    HAS_SAMPLERATE = True
except Exception:
    HAS_SAMPLERATE = False

# ---------------------------
# Utilities for EEG synthesis
# ---------------------------
def _pink_noise(n, exponent=1.0):
    """Generate 1/f^exponent noise using frequency domain filtering."""
    freqs = np.fft.rfftfreq(n, d=1.0)
    freqs[0] = freqs[1] if len(freqs) > 1 else 1.0
    mag = 1.0 / (freqs ** (exponent / 2.0))
    rnd = np.random.normal(size=n)
    X = np.fft.rfft(rnd) * mag
    y = np.fft.irfft(X, n=n)
    # normalize
    y = y / (np.std(y) + 1e-12)
    return y

def generate_single_channel_eeg(fs=500, duration_s=10.0,
                                band_amps=None,
                                noise_std=0.5,
                                spikes_prob=0.02):
    """
    Build a single EEG channel as sum of band-limited oscillations + 1/f noise + occasional spikes.
    band_amps: dict: {'delta':amp, 'theta':..., 'alpha':..., 'beta':..., 'gamma':...}
    Returns: signal (n,), fs
    """
    n = int(round(duration_s * fs))
    t = np.arange(n) / fs
    if band_amps is None:
        band_amps = {'delta':0.5, 'theta':0.3, 'alpha':1.0, 'beta':0.2, 'gamma':0.05}

    # center frequencies for bands (choose random within band)
    def band_signal(low, high, amp):
        f = np.random.uniform(low, high)
        phase = np.random.uniform(0, 2*np.pi)
        return amp * np.sin(2*np.pi*f*t + phase)

    sig = np.zeros(n)
    sig += band_signal(0.5, 4.0, band_amps.get('delta', 0.0))
    sig += band_signal(4.0, 8.0, band_amps.get('theta', 0.0))
    sig += band_signal(8.0, 12.0, band_amps.get('alpha', 0.0))
    sig += band_signal(12.0, 30.0, band_amps.get('beta', 0.0))
    sig += band_signal(30.0, 80.0, band_amps.get('gamma', 0.0))

    # add 1/f background noise
    pink = _pink_noise(n, exponent=1.0) * noise_std
    sig += pink

    # add occasional broadband "muscle" spikes (high-frequency transient)
    num_spikes = max(0, int(spikes_prob * duration_s))
    for _ in range(num_spikes):
        center = np.random.randint(0, n)
        width = int(0.01 * fs)  # 10 ms-ish transient
        start = max(0, center - width//2)
        end = min(n, center + width//2)
        # high freq burst
        burst = np.random.normal(scale=2.0, size=(end-start,)) * signal.windows.tukey(end-start, alpha=0.5)
        sig[start:end] += burst

    # baseline drift (low freq)
    sig += 0.1 * np.sin(2*np.pi*0.3*t)

    # normalize to unit variance-ish
    sig = sig / (np.std(sig) + 1e-12)

    return sig, fs

def generate_multichannel_eeg(fs=500, duration_s=10.0, nchannels=8, sources=5, seed=None):
    """
    Create multichannel EEG by generating a few independent 'sources' and mixing them.
    sources: number of latent sources (<= nchannels)
    Returns: data (n_samples, nchannels), fs
    """
    if seed is not None:
        np.random.seed(seed)

    # generate sources
    srcs = []
    for _ in range(sources):
        s, _ = generate_single_channel_eeg(fs=fs, duration_s=duration_s)
        srcs.append(s)
    srcs = np.vstack(srcs).T  # shape (n, sources)

    # random mixing matrix (mixing to scalp channels)
    mix = np.random.normal(scale=1.0, size=(sources, nchannels))
    data = srcs.dot(mix)  # (n, nchannels)

    # add small channel-specific noise
    data += 0.05 * np.random.randn(*data.shape)

    # scale to reasonable amplitude
    data = data / (np.std(data) + 1e-12)

    return data, fs

# ---------------------------
# CSV IO
# ---------------------------
def save_eeg_to_csv(path, data, fs, time_col=True, header_comment=True):
    """
    Save EEG (n,channels) to CSV with optional time column and header comment '# SAMPLING_RATE=...'
    """
    n = data.shape[0]
    channels = data.shape[1]
    df = pd.DataFrame(data, columns=[f"ch{i+1}" for i in range(channels)])
    if time_col:
        df.insert(0, "time", np.arange(n) / fs)
    
    import io as builtin_io
    output = builtin_io.StringIO()
    if header_comment:
        output.write(f"# SAMPLING_RATE={fs}\n")
    df.to_csv(output, index=False)
    return output.getvalue()

def load_eeg_from_csv(csv_content):
    """Load CSV, parse sampling rate from header or infer from time column."""
    lines = csv_content.strip().split('\n')
    fs = None
    
    if lines[0].startswith("#") and "SAMPLING_RATE=" in lines[0]:
        try:
            fs = float(lines[0].split("SAMPLING_RATE=")[1].strip())
        except Exception:
            fs = None
    
    import io as builtin_io
    df = pd.read_csv(builtin_io.StringIO(csv_content), comment='#')
    
    if 'time' in df.columns:
        time = df['time'].values
        diffs = np.diff(time)
        if len(diffs):
            fs_est = 1.0 / np.median(diffs)
            if fs is None:
                fs = fs_est
    
    chcols = [c for c in df.columns if c != 'time']
    data = df[chcols].values.astype(float)
    return data, int(round(fs)) if fs is not None else None, {"columns": chcols}

# ---------------------------
# Fmax estimation
# ---------------------------
def estimate_fmax(audio, fs, energy_frac=0.995, max_fft_len=131072):
    """Estimate highest significant frequency using cumulative energy of FFT on a center segment."""
    if audio.ndim > 1:
        mono = audio.mean(axis=1)
    else:
        mono = audio
    N = len(mono)
    if N == 0:
        return 0.0
    L = min(N, max_fft_len)
    start = max(0, (N - L)//2)
    seg = mono[start:start+L] * np.hanning(L)
    X = np.fft.rfft(seg)
    power = np.abs(X)**2
    freqs = np.fft.rfftfreq(L, 1.0/fs)
    total = power.sum()
    if total <= 0:
        return 0.0
    cum = np.cumsum(power)
    idx = np.searchsorted(cum, energy_frac * total)
    idx = min(idx, len(freqs)-1)
    fmax = float(freqs[idx])
    fmax = min(fmax, 0.95 * (fs / 2.0))
    return fmax

# ---------------------------
# Resampling (safe/demo)
# ---------------------------
def _fix_length(arr, target_len):
    if arr.ndim == 1:
        if len(arr) > target_len:
            return arr[:target_len]
        if len(arr) < target_len:
            return np.concatenate([arr, np.zeros(target_len - len(arr), dtype=arr.dtype)])
        return arr
    else:
        if arr.shape[0] > target_len:
            return arr[:target_len, :]
        if arr.shape[0] < target_len:
            pad = np.zeros((target_len - arr.shape[0], arr.shape[1]), dtype=arr.dtype)
            return np.vstack([arr, pad])
        return arr

def resample_eeg(audio, orig_fs, target_fs, mode='safe', max_den=2000):
    """
    Resample EEG array (n,channels) or (n,) to target_fs.
    mode: 'safe' (anti-alias) or 'demo' (allow aliasing)
    """
    if orig_fs == target_fs:
        return audio, orig_fs
    ratio = float(target_fs) / float(orig_fs)
    out_len = int(round(audio.shape[0] * ratio))

    # DEMO: try to produce visible aliasing
    if mode == 'demo':
        approx = orig_fs / target_fs
        nearest = int(round(approx))
        if abs(approx - nearest) < 1e-8 and nearest >= 1:
            # integer decimation
            if audio.ndim == 1:
                out = audio[::nearest]
            else:
                out = audio[::nearest, :]
            return _fix_length(out, out_len), target_fs
        else:
            # weaken filter with small kaiser beta
            frac = Fraction(target_fs, orig_fs).limit_denominator(max_den)
            up, down = frac.numerator, frac.denominator
            if audio.ndim == 1:
                out = signal.resample_poly(audio, up, down, window=('kaiser', 0.1))
            else:
                out = np.vstack([signal.resample_poly(audio[:,ch], up, down, window=('kaiser',0.1))
                                 for ch in range(audio.shape[1])]).T
            return _fix_length(out, out_len), target_fs

    # SAFE mode
    if HAS_SAMPLERATE:
        try:
            conv = samplerate.Converter('sinc_best')
            out = conv.process(audio, ratio)
            return _fix_length(out, out_len), target_fs
        except Exception as e:
            print("samplerate conversion failed, falling back:", e)

    # fallback: resample_poly with rational approx
    frac = Fraction(target_fs, orig_fs).limit_denominator(max_den)
    up, down = frac.numerator, frac.denominator
    if audio.ndim == 1:
        out = signal.resample_poly(audio, up, down)
    else:
        out = np.vstack([signal.resample_poly(audio[:,ch], up, down) for ch in range(audio.shape[1])]).T
    return _fix_length(out, out_len), target_fs

# ---------------------------
# Diagnostic helpers
# ---------------------------
def psd_welch(audio, fs, nperseg=2048):
    """Return freqs and PSD (mono mix) using Welch."""
    if audio.ndim > 1:
        mono = audio.mean(axis=1)
    else:
        mono = audio
    freqs, Pxx = signal.welch(mono, fs=fs, nperseg=nperseg)
    return freqs, Pxx

def energy_above_cutoff(audio, fs, cutoff_hz, max_fft_len=131072):
    if audio.ndim > 1:
        mono = audio.mean(axis=1)
    else:
        mono = audio
    N = min(len(mono), max_fft_len)
    seg = mono[:N] * np.hanning(N)
    X = np.fft.rfft(seg)
    freqs = np.fft.rfftfreq(N, 1.0/fs)
    mask = freqs > cutoff_hz
    if not mask.any():
        return 0.0
    return np.sum(np.abs(X[mask])**2)

def get_band_powers(audio, fs):
    """Calculate power in standard EEG bands."""
    if audio.ndim > 1:
        mono = audio.mean(axis=1)
    else:
        mono = audio
    
    freqs, psd = signal.welch(mono, fs=fs, nperseg=min(len(mono), 2048))
    
    bands = {
        'delta': (0.5, 4),
        'theta': (4, 8),
        'alpha': (8, 12),
        'beta': (12, 30),
        'gamma': (30, 100)
    }
    
    band_powers = {}
    for band_name, (low, high) in bands.items():
        idx = np.logical_and(freqs >= low, freqs <= high)
        band_powers[band_name] = np.trapz(psd[idx], freqs[idx])
    
    return band_powers