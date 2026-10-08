# GrievanceGrid: Dataset Catalog & Manifest Documentation

This document records the official dataset inventory, licenses, access statuses, and domain boundaries tracked in `datasets/manifests/dataset_manifest.csv`.

---

## 1. Truthfulness Policy & Academic Integrity

- **Zero Fabricated Data**: No placeholder or synthetic records are ever disguised as real municipal downloads.
- **Explicit Access Classification**: All external datasets requiring institutional permissions are categorized as `ACCESS_REQUIRED`.
- **Validation Report**: The automated dataset validation audit is available at `datasets/reports/dataset_validation_report.md`.

---

## 2. Tracked Dataset Inventory

| ID | Dataset Name | Domain / Task | Official Source | Status | License |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `nyc311` | NYC 311 Service Requests | Municipal text categorization | NYC Open Data | `ACCESS_REQUIRED` | Public Domain |
| `cpgrams` | CPGRAMS Public Grievance Data | Indian municipal grievance text | Ministry of Personnel (India) | `ACCESS_REQUIRED` | Restricted Govt |
| `rdd2022` | Road Damage Detection 2022 | Road infrastructure surface defects | Sekilab / IEEE BigData | `ACCESS_REQUIRED` | CC BY 4.0 |
| `taco` | TACO (Trash Annotations in Context) | Litter & waste object detection | TACO Project | `ACCESS_REQUIRED` | CC BY 4.0 |
| `uw_bench` | UW-Bench (Urban Waterlogging) | Flooding & waterlogging scenes | CityBenchmarks | `ACCESS_REQUIRED` | Agreement Req. |
| `floodnet` | FloodNet Dataset | Aerial post-flood scene analysis | BinaLab / IEEE IGARSS | `ACCESS_REQUIRED` | CC BY-NC-SA 4.0 |
| `culvert_blockage` | Culvert Visual Blockage Datasets | Stormwater drain obstructions | FHWA / Academic Papers | `ACCESS_REQUIRED` | Mixed |
| `sewer_ml` | Sewer-ML Dataset | Underground pipe defect inspection | DTU / IEEE Transactions | `ACCESS_REQUIRED` | CC BY 4.0 |
| `streetlight` | Streetlight Monitoring Dataset | Streetlight operational state | Smart City Initiatives | `ACCESS_REQUIRED` | Mixed |
| `mapillary` | Mapillary Training Datasets | Street-level urban scenes | Meta AI / Mapillary | `ACCESS_REQUIRED` | CC BY-NC-SA 4.0 |
| `open_images` | Open Images V7 (Selected Classes) | Contextual civic objects | Google AI | `ACCESS_REQUIRED` | CC BY 4.0 |
| `urban_community_issues` | Urban Community Issues | Urban infrastructure defects | Roboflow Community | `ACCESS_REQUIRED` | CC BY 4.0 |

---

## 3. Domain Differences & Research Limitations

- **Geographic & Linguistic Disparity**: Western 311 datasets (e.g. NYC 311) feature distinct infrastructure terminology, English phrasing, and municipal organizational hierarchies that differ fundamentally from Indian urban local bodies.
- **Sensor Perspective Gap**: Datasets like FloodNet (aerial/drone) or Sewer-ML (underground CCTV) have significant domain gaps when applied to ground-level smartphone photos submitted by citizens. They are strictly designated as supplementary feature learning sources, not citizen ground truth.
