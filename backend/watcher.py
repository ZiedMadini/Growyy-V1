"""Robust AI training watcher v2 — tracks PIDs, auto-restarts, updates AI.md."""
import os, sys, json, time, subprocess, psutil, logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(message)s",
    handlers=[
        logging.FileHandler(r"D:\ollama\watcher.log"),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)

BACKEND_DIR = Path(r"D:\Haykel\growy\Growyy-V1\.worktrees\backend\backend")
MODELS_DIR = BACKEND_DIR / "models"
AI_MD = Path(r"D:\Haykel\growy\Growyy-V1\AI.md")
PYTHON = str(BACKEND_DIR / ".venv" / "Scripts" / "python.exe")

HF_ENV = {
    "HF_DATASETS_CACHE": r"D:\hf_cache\datasets",
    "HF_HOME": r"D:\hf_cache",
    "HUGGINGFACE_HUB_CACHE": r"D:\hf_cache\hub",
}

disease_pid = None
patchtst_pid = None
patchtst_done = False
disease_done = False


def is_alive(pid):
    if pid is None:
        return False
    try:
        p = psutil.Process(pid)
        return p.is_running() and p.status() != psutil.STATUS_ZOMBIE
    except psutil.NoSuchProcess:
        return False


def check_patchtst_complete():
    sc = MODELS_DIR / "patchtst_scalers.json"
    if not sc.exists():
        return False
    with open(sc) as f:
        data = json.load(f)
    return all(m in data for m in ["temp", "humidity", "ph", "ec", "co2"])


def check_disease_complete():
    return (MODELS_DIR / "efficientnet_v2s_plantvillage.pth").exists()


def count_patchtst_done():
    return sum(1 for m in ["temp","humidity","ph","ec","co2"]
               if (MODELS_DIR / f"patchtst_{m}.pth").exists())


def start_disease():
    global disease_pid
    env = os.environ.copy()
    env.update(HF_ENV)
    log.info("Starting disease training (HF cache -> D:)...")
    proc = subprocess.Popen(
        [PYTHON, "-m", "ai.disease.train"],
        cwd=str(BACKEND_DIR),
        stdout=open(r"D:\Haykel\disease_out2.log", "a"),
        stderr=open(r"D:\Haykel\disease_err2.log", "a"),
        env=env,
    )
    disease_pid = proc.pid
    log.info("Disease PID=%d", disease_pid)
    return proc


def start_patchtst():
    global patchtst_pid
    log.info("Starting PatchTST training...")
    proc = subprocess.Popen(
        [PYTHON, "-m", "ai.forecast.train"],
        cwd=str(BACKEND_DIR),
        stdout=open(r"D:\Haykel\patchtst_out.log", "a"),
        stderr=open(r"D:\Haykel\patchtst_err.log", "a"),
    )
    patchtst_pid = proc.pid
    log.info("PatchTST PID=%d", patchtst_pid)
    return proc


def update_ai_md(what):
    try:
        content = AI_MD.read_text(encoding="utf-8")
        if what == "patchtst":
            content = content.replace("| Forecasting       | TRAINING |", "| Forecasting       | LIVE     |")
            content = content.replace(
                "PatchTST Phase 1 running",
                "PatchTST Phase 1 complete"
            )
        elif what == "disease":
            content = content.replace("| Disease Detection | TRAINING |", "| Disease Detection | LIVE     |")
            content = content.replace(
                "EfficientNet-V2-S — PlantVillage dataset downloading, fine-tuning in background (~2h on CPU). API functional with random weights until complete.",
                "EfficientNet-V2-S fine-tuned on PlantVillage — checkpoint at `backend/models/efficientnet_v2s_plantvillage.pth`."
            )
        elif what == "all":
            content = content.replace("Disease + PatchTST training in background_", "ALL MODELS LIVE_")
        AI_MD.write_text(content, encoding="utf-8")
        log.info("AI.md updated: %s -> LIVE", what)
    except Exception as e:
        log.error("Failed to update AI.md: %s", e)


if __name__ == "__main__":
    log.info("=== AI Watcher v2 started ===")

    # Discover currently running training processes by checking for known patterns
    # Just set initial PIDs to None — we'll detect if they die

    # PatchTST: started at 02:56:05, PID 50696
    patchtst_pid = 50696
    # Disease: started at 49776 (new process with D: cache)
    disease_pid = 49776

    log.info("Tracking PatchTST PID=%d, Disease PID=%d", patchtst_pid, disease_pid)

    check_count = 0
    while True:
        try:
            check_count += 1

            # --- PatchTST ---
            if not patchtst_done:
                if check_patchtst_complete():
                    patchtst_done = True
                    update_ai_md("patchtst")
                    log.info("PatchTST COMPLETE! All 5 metrics done.")
                elif not is_alive(patchtst_pid):
                    n = count_patchtst_done()
                    log.warning("PatchTST dead (PID=%d), %d/5 metrics done. Restarting...", patchtst_pid, n)
                    start_patchtst()

            # --- Disease ---
            if not disease_done:
                if check_disease_complete():
                    disease_done = True
                    update_ai_md("disease")
                    log.info("Disease detection COMPLETE!")
                elif not is_alive(disease_pid):
                    log.warning("Disease training dead (PID=%d). Restarting...", disease_pid)
                    start_disease()

            # --- Both done ---
            if patchtst_done and disease_done:
                update_ai_md("all")
                log.info("ALL AI MODELS TRAINED AND LIVE!")
                # Keep running to maintain Ollama server alive signal

            # --- Status every check ---
            n_pth = count_patchtst_done()
            log.info(
                "[Check #%d] PatchTST: %d/5 metrics done | Disease: %s | PID: ptst=%s dis=%s",
                check_count, n_pth,
                "DONE" if disease_done else "training",
                patchtst_pid, disease_pid
            )

        except Exception as e:
            log.error("Watcher error: %s", e, exc_info=True)

        time.sleep(300)  # check every 5 minutes
