---
name: video-to-gif
description: Automatically convert videos in `media/videos` to GIFs in `media/gifs` and embed them into `README.md` based on context inferred from filenames.
---

# Video to GIF Automator

## Overview
This skill automates the process of converting demo videos to GIFs and updating the project documentation. It helps in keeping the documentation up-to-date with visual demonstrations without manual conversion and editing.

## Workflow

### 1) Prepare Videos
Place your `.mp4`, `.mov`, or other video files into the `media/videos` directory.

### 2) Run Automation
Execute the provided Python script to process the videos.
```bash
python skills/video-to-gif/convert_and_update.py
```

### 3) Conversion Process
The script will:
- Scan `media/videos` for new files.
- Convert each video to a high-quality GIF using `ffmpeg`.
- Save the GIFs to `media/gifs`.

### 4) Documentation Update
The script parses `README.md` and attempts to insert the GIF in a relevant section based on the filename (e.g., `login_flow.mp4` -> `## Login Flow`). If no matching section is found, it appends the GIF to a "Gallery" section.

## Dependencies
- Python 3
- ffmpeg (must be installed and in system PATH)
