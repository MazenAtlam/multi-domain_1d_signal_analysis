import os
import glob
import random
import math
import torch
import torch.nn as nn
import torchaudio
import numpy as np
import soundfile as sf
from torch.utils.data import Dataset, DataLoader

# ====== Config ======
DATA_DIR = "./data"        # put .wav files here (any sr ok)
TARGET_SR = 16000          # high sample rate (target)
DECIMATION = 4             # downsample factor to create aliasing (e.g., 4 -> 16k -> 4k)
BATCH = 8
EPOCHS = 15
LR = 1e-4
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
OUT_DIR = "./poc_out"
os.makedirs(OUT_DIR, exist_ok=True)

# ====== Utility: simple multi-scale STFT magnitude loss ======
def stft_mag(x, n_fft, hop, win_len):
    # x: (B, T)
    X = torch.stft(x, n_fft=n_fft, hop_length=hop, win_length=win_len,
                   window=torch.hann_window(win_len).to(x.device), return_complex=True)
    return X.abs()

def multi_stft_loss(y_hat, y, device):
    # y_hat, y: (B, T)
    ffts = [(2048, 512, 2048), (1024, 256, 1024), (512, 128, 512)]
    loss = 0.0
    for (nfft, hop, win) in ffts:
        mag_hat = stft_mag(y_hat, nfft, hop, win)
        mag = stft_mag(y, nfft, hop, win)
        loss = loss + torch.mean(torch.abs(mag - mag_hat))
    return loss

# ====== Dataset ======
class WaveFolderDataset(Dataset):
    def __init__(self, folder, target_sr=16000, seg_len=16000):
        self.files = glob.glob(os.path.join(folder, "*.wav"))
        assert len(self.files) > 0, "No wav files in data folder."
        self.target_sr = target_sr
        self.seg_len = seg_len

    def __len__(self):
        return 20000  # virtual length; we'll sample randomly

    def __getitem__(self, idx):
        fn = random.choice(self.files)
        wav, sr = torchaudio.load(fn)  # shape (C, T)
        wav = torch.mean(wav, dim=0, keepdim=True)  # mono (1, T)
        if sr != self.target_sr:
            wav = torchaudio.functional.resample(wav, sr, self.target_sr)
        wav = wav.squeeze(0)  # (T,)

        # random crop/segment
        if wav.shape[0] > self.seg_len:
            start = random.randint(0, wav.shape[0] - self.seg_len)
            wav = wav[start:start + self.seg_len]
        else:
            # pad
            pad = self.seg_len - wav.shape[0]
            wav = torch.nn.functional.pad(wav, (0, pad))

        # normalize
        wav = wav / (wav.abs().max() + 1e-9)

        # create aliased input:
        k = DECIMATION
        # decimate to create aliasing: take every k-th sample
        low = wav[::k]           # aliased low-rate signal
        # naive upsample by repeating samples -> aliased upsampled signal (same length as target)
        aliased = low.repeat_interleave(k)[:self.seg_len]

        return aliased.unsqueeze(0), wav.unsqueeze(0)  # shapes: (1, T), (1, T)

# ====== Model: small residual Conv1D net (keeps length) ======
class Res1DBlock(nn.Module):
    def __init__(self, ch, kernel=15, dilation=1):
        super().__init__()
        pad = (kernel - 1) // 2 * dilation
        self.conv = nn.Conv1d(ch, ch, kernel_size=kernel, padding=pad, dilation=dilation)
        self.act = nn.ReLU()
        self.norm = nn.BatchNorm1d(ch)

    def forward(self, x):
        return x + self.norm(self.act(self.conv(x)))

class SmallResNet(nn.Module):
    def __init__(self, in_ch=1, base_ch=64, nblocks=6):
        super().__init__()
        self.in_conv = nn.Conv1d(in_ch, base_ch, kernel_size=15, padding=7)
        self.blocks = nn.ModuleList()
        # increasing dilation powers
        for i in range(nblocks):
            d = 2 ** (i % 4)
            self.blocks.append(Res1DBlock(base_ch, kernel=3, dilation=d))
        self.out_conv = nn.Conv1d(base_ch, 1, kernel_size=1)

    def forward(self, x):
        x = self.in_conv(x)
        for b in self.blocks:
            x = b(x)
        x = self.out_conv(x)
        return x

# ====== Training ======
def train():
    ds = WaveFolderDataset(DATA_DIR, target_sr=TARGET_SR, seg_len=TARGET_SR)  # 1s segments
    dl = DataLoader(ds, batch_size=BATCH, num_workers=2, drop_last=True)

    model = SmallResNet().to(DEVICE)
    opt = torch.optim.Adam(model.parameters(), lr=LR)
    l1 = nn.L1Loss()

    step = 0
    for epoch in range(EPOCHS):
        for aliased, target in dl:
            aliased = aliased.to(DEVICE)  # (B,1,T)
            target = target.to(DEVICE)
            pred = model(aliased)

            # waveform L1
            loss_w = l1(pred, target)

            # optional quick STFT loss for spectral similarity
            loss_s = multi_stft_loss(pred.squeeze(1), target.squeeze(1), DEVICE)

            loss = loss_w + 0.5 * loss_s

            opt.zero_grad()
            loss.backward()
            opt.step()

            if step % 100 == 0:
                print(f"Epoch {epoch} step {step} | loss {loss.item():.6f} (w:{loss_w.item():.6f} s:{loss_s.item():.6f})")
            if step % 500 == 0:
                # save an example chunk to disk
                save_example(model, ds)
            step += 1
            # quick exit to keep POC short if you want: remove to train fully
            # if step > 2000: return
    torch.save(model.state_dict(), os.path.join(OUT_DIR, "poc_model.pt"))
    print("Training finished, model saved.")

def save_example(model, dataset, n=1):
    model.eval()
    with torch.no_grad():
        aliased, target = dataset[0]
        aliased = aliased.unsqueeze(0).to(DEVICE)  # (1,1,T)
        pred = model(aliased).squeeze(0).squeeze(0).cpu().numpy()
        ali = aliased.squeeze(0).squeeze(0).cpu().numpy()
        tgt = target.squeeze(0).squeeze(0).cpu().numpy()
        # normalize for saving
        def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
        sf.write(os.path.join(OUT_DIR, "aliased_example.wav"), norm(ali), TARGET_SR)
        sf.write(os.path.join(OUT_DIR, "pred_example.wav"), norm(pred), TARGET_SR)
        sf.write(os.path.join(OUT_DIR, "target_example.wav"), norm(tgt), TARGET_SR)
    model.train()

if __name__ == "__main__":
    train()
