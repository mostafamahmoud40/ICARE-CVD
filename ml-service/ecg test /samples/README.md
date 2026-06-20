# PTB-XL sample ECG pairs (100 Hz)

Verified WFDB pairs from [PTB-XL v1.0.3](https://physionet.org/content/ptb-xl/1.0.3/) — each `.hea` + `.dat` belong together.

| Record   | .hea  | .dat    | Notes              |
|----------|-------|---------|--------------------|
| 00001_lr | ~596 B | 24 KB | Normal baseline    |
| 00002_lr | ~599 B | 24 KB |                    |
| 01000_lr | ~607 B | 24 KB |                    |
| 05469_lr | ~604 B | 24 KB | MI class (PTB-XL)  |
| 10001_lr | ~598 B | 24 KB |                    |
| 15000_lr | ~605 B | 24 KB |                    |

**Upload rule:** always pick the `.hea` and `.dat` with the **same record name** (e.g. `05469_lr.hea` + `05469_lr.dat`).

**Wrong:** `.dat` ~1–2 MB with a 100 Hz `.hea` — that is not a valid PTB-XL lr pair.

Source path on PhysioNet: `records100/<folder>/<id>_lr.{hea,dat}`
