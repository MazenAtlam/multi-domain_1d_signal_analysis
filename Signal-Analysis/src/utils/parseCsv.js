// src/utils/parseCsv.js
import Papa from "papaparse";

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        if (!rows || rows.length === 0) {
          reject(new Error("Empty CSV"));
          return;
        }

        // detect header
        const firstRow = rows[0];
        const hasHeader = firstRow.some((c) => typeof c === "string");
        let headers = null;
        let start = 0;
        if (hasHeader) {
          headers = firstRow.map((h) => String(h).trim());
          start = 1;
        }

        const nCols = rows[start].length;
        const cols = Array.from({ length: nCols }, () => []);

        for (let r = start; r < rows.length; r++) {
          const row = rows[r];
          if (!row) continue;
          for (let c = 0; c < nCols; c++) {
            const v = row[c];
            cols[c].push(typeof v === "number" ? v : Number(v));
          }
        }

        // If first column is time-like (monotonic), treat it as times
        let times = null;
        const firstCol = cols[0];
        let monotonic = true;
        for (let i = 1; i < Math.min(firstCol.length, 50); i++) {
          if (!(firstCol[i] >= firstCol[i - 1])) {
            monotonic = false;
            break;
          }
        }
        if (monotonic && firstCol.length > 1 && Math.abs(firstCol[1] - firstCol[0]) > 0) {
          times = firstCol;
          const channels = cols.slice(1);
          const channelHeaders = headers ? headers.slice(1) : null;
          resolve({ channels, headers: channelHeaders, times });
          return;
        }

        // Otherwise treat all columns as channels
        resolve({ channels: cols, headers, times: null });
      },
      error: (err) => reject(err),
    });
  });
}
