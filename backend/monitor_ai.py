import time, json, os
from pathlib import Path

models_dir = Path(r"D:\Haykel\growy\Growyy-V1\.worktrees\backend\backend\models")
status_file = Path(r"D:\ollama\ai_status.json")

while True:
    status = {}
    
    # Check PatchTST
    patchtst_done = []
    for m in ["temp", "humidity", "ph", "ec", "co2"]:
        if (models_dir / f"patchtst_{m}.pth").exists():
            patchtst_done.append(m)
    status["patchtst_done"] = patchtst_done
    status["patchtst_scalers"] = (models_dir / "patchtst_scalers.json").exists()
    
    # Check Disease
    status["disease_checkpoint"] = (models_dir / "efficientnet_v2s_plantvillage.pth").exists()
    
    # Check LightGBM
    lgbm_done = []
    for sp in ["temp", "humidity", "ph", "ec"]:
        if (models_dir / f"lgbm_recommend_{sp}.txt").exists():
            lgbm_done.append(sp)
    status["lgbm_done"] = lgbm_done
    
    status["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
    
    with open(status_file, "w") as f:
        json.dump(status, f, indent=2)
    
    time.sleep(120)  # check every 2 minutes
