import re
import os

def recover():
    log_path = r'c:\Users\laksh\.gemini\antigravity\brain\c1426e56-5190-4762-87ab-787219cfb30c\.system_generated\logs\overview.txt'
    if not os.path.exists(log_path):
        return

    with open(log_path, 'r', encoding='utf8') as f:
        log = f.read()

    # Find all canvas tags
    starts = [m.start() for m in re.finditer(r'<canvas id=', log)]
    
    for start_idx in starts:
        # Find the next tool call argument key to find the end of ReplacementContent
        # e.g. ","StartLine" or ","TargetContent"
        end_idx = log.find('\",\"StartLine', start_idx)
        if end_idx == -1:
            end_idx = log.find('\",\"TargetContent', start_idx)
        
        if end_idx != -1:
            content_raw = log[start_idx : end_idx]
            print(f"Found snippet at {start_idx} with length {len(content_raw)}")
            
            if len(content_raw) > 3000:
                content = content_raw.replace('\\\\n', '\n').replace('\\\\\\"', '"').replace('\\\\t', '\t').replace('\\\\/', '/')
                target_path = r'c:\Users\laksh\OneDrive\Desktop\myApp\assets\images\paper_plane_journey.html'
                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                with open(target_path, 'w', encoding='utf8') as f:
                    f.write(content)
                print(f"Successfully recovered {len(content)} bytes to {target_path}")
                return

    print("No valid long block found")

if __name__ == "__main__":
    recover()
