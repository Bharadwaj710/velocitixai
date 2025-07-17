import os
import json
import tempfile

# Save progress to a shared JSON file in temp directory
PROGRESS_FILE = os.path.join(tempfile.gettempdir(), "transcript_progress.json")

def set_progress(lesson_id, percent):
    try:
        if os.path.exists(PROGRESS_FILE):
            with open(PROGRESS_FILE, "r") as f:
                data = json.load(f)
        else:
            data = {}

        # ✅ Always write as an object — consistent with Node
        data[lesson_id] = {
            "progress": percent,
            "type": "transcript"
        }

        with open(PROGRESS_FILE, "w") as f:
            json.dump(data, f)

    except Exception as e:
        print(f"[PROGRESS ERROR] set_progress failed: {e}")

def get_progress(lesson_id):
    try:
        if not os.path.exists(PROGRESS_FILE):
            return 0
        with open(PROGRESS_FILE, "r") as f:
            data = json.load(f)
        val = data.get(lesson_id, 0)
        # If value is an object (from Node), extract 'progress' field
        if isinstance(val, dict) and 'progress' in val:
            return val['progress']
        # If value is a number, return as is
        if isinstance(val, int) or isinstance(val, float):
            return val
        return 0
    except Exception as e:
        print(f"[PROGRESS ERROR] get_progress failed: {e}")
        return 0
