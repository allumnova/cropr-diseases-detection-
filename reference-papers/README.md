# Reference Papers Archive

OpenAlex Terms Notice: Please review OpenAlex terms at https://help.openalex.org/ and verify individual paper licenses before redistribution.

---

## 1. Downloaded PDFs (Verified & Saved Locally)
- `07_Hassan_2022_Rice_PlantVillage_CNN.pdf` (2.4 MB) — S. K. M. Hassan & A. K. Maji (2022), *Plant Disease Identification Using a Novel Convolutional Neural Network*, IEEE Access (`10.1109/ACCESS.2022.3141371`). Covers PlantVillage + Rice disease dataset (`99.66%` accuracy).
- `08_Joseph_2024_Wheat_Rice_MRW-CNN.pdf` (24.9 MB) — D. S. Joseph et al. (2024), *Real-Time Plant Disease Dataset Development and Detection of Plant Disease Using Deep Learning*, IEEE Access (`10.1109/ACCESS.2024.3358333`). Covers Wheat (`98.08%`), Rice (`97.06%`), and Maize real-world datasets.

---

## 2. Remaining Key Papers (Download via Browser or Free OpenAlex API Key)
These papers are open-access on their publisher/DOAJ landing pages, or downloadable via `openalex_cli.py` once a free `OPENALEX_API_KEY` is added to `~/.env`:

| Ref | Paper | Crop / Focus | Direct DOI / Open-Access URL |
| :--- | :--- | :--- | :--- |
| **[4]** | Maurya *et al.* (2025) — *RAI-Net + Grad-CAM* | Tomato (10 classes) | https://doi.org/10.1109/ACCESS.2025.3559804 |
| **[9]** | Nigar *et al.* (2024) — *EfficientNetB0 + LIME* | 38 Plant Diseases | https://doi.org/10.1109/ACCESS.2024.3428553 |
| **[10]** | Mishra *et al.* (2023) — *IoT + Customized CNN* | Millet / IoT-CNN | https://doi.org/10.1016/j.aej.2023.10.041 |
| **[12]** | Babu *et al.* (2024) — *IoT Soil NPK + Bayesian-KNN* | Tomato (N, P, K) | https://doi.org/10.3390/s24196177 |
| **[15]** | Abdelli *et al.* (2025) — *ESP32 + ESP-NOW/LoRa* | Wheat Plot IoT | https://doi.org/10.1109/ACCESS.2025.3641487 |
| **[1]** | Patle *et al.* (2022) — *IoT Smart Sensor + LSTM* | Sensor Risk ML | https://doi.org/10.1109/JSEN.2021.3139988 *(IEEE Subscription)* |
| **[2]** | Akhter & Sofi (2024) — *IoT + XGBoost* | Rice Diseases | https://doi.org/10.1109/DASA63652.2024.10836518 *(IEEE Subscription)* |

### To Auto-Download Remaining Open-Access PDFs via CLI
1. Get a free API key from `https://openalex.org/` (Account Settings) and add `OPENALEX_API_KEY=your_key` to your home `.env` file.
2. Run:
   ```powershell
   uv run "C:\Users\Vipranshu Sachan\.gemini\config\plugins\science\skills\literature_search_openalex\scripts\openalex_cli.py" download-pdf https://doi.org/10.1109/ACCESS.2025.3559804 reference-papers\04_Maurya_2025_Tomato_RAI-Net_GradCAM.pdf
   ```
