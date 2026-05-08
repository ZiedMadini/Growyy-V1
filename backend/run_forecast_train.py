import subprocess, sys
metrics = ['temp','humidity','ph','ec']
for m in metrics:
    print(f'Starting PatchTST for {m}...', flush=True)
    r = subprocess.run([sys.executable, '-m', 'ai.forecast.train', '--metric', m], 
                       capture_output=False, cwd=r'D:\Haykel\growy\Growyy-V1\.worktrees\backend\backend')
    print(f'Done {m}: returncode={r.returncode}', flush=True)
