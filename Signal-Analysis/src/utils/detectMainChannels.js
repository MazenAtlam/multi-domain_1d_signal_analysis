// src/utils/detectMainChannels.js
export function detectMainChannels(channels, topK = 3) {
  if (!channels || channels.length === 0) return { indices: [], scores: [] };

  const scores = channels.map((ch) => {
    let min = Infinity, max = -Infinity, sum = 0, sumsq = 0, n = 0;
    for (let v of ch) {
      if (isFinite(v)) {
        n++;
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
        sumsq += v * v;
      }
    }
    if (n === 0) return { p2p: 0, variance: 0, score: 0 };
    const p2p = max - min;
    const mean = sum / n;
    const variance = Math.max(0, sumsq / n - mean * mean);
    return { p2p, variance, score: p2p + Math.sqrt(variance) };
  });

  const indexed = scores.map((s, idx) => ({ idx, score: s.score }));
  indexed.sort((a, b) => b.score - a.score);
  const indices = indexed.slice(0, topK).map((x) => x.idx);
  const sortedScores = indexed.slice(0, topK).map((x) => x.score);
  return { indices, scores: sortedScores };
}
