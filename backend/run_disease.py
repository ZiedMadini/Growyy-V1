import os, subprocess, sys

env = os.environ.copy()
env['HF_DATASETS_CACHE'] = r'D:\hf_cache\datasets'
env['HF_HOME'] = r'D:\hf_cache'
env['HUGGINGFACE_HUB_CACHE'] = r'D:\hf_cache\hub'

result = subprocess.run(
    [sys.executable, '-m', 'ai.disease.train'],
    cwd=r'D:\Haykel\growy\Growyy-V1\.worktrees\backend\backend',
    env=env
)
sys.exit(result.returncode)
