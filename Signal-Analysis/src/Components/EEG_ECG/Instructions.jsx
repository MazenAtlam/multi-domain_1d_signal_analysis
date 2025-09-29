export default function Instructions() {
  return (
    <>
      <div className="d-flex gap-3 border border-1 mx-auto col-10 col-xl-6 rounded-3 ps-3 pt-3">
        <i class="bi bi-exclamation-circle text-warning"></i>
        <div className="instructions">
          <h6>Data Requirements</h6>
          <ul>
            <li>EEG signals should be sampled at minimum 256 Hz</li>
            <li>File formats: EDF, CSV, TXT, or MAT with multi-channel data</li>
            <li>Maximum file size: 50MB per upload</li>
            <li>For best results, use 10-20 electrode system recordings</li>
            <li>Include channel labels and sampling frequency information</li>
          </ul>
        </div>
      </div>
    </>
  );
}
