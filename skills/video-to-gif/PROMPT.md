# Video to GIF Automation Prompt

When the user provides video demos (e.g., `.mp4`, `.mov`) and wants to update the documentation with GIFs, follow these steps:

1.  **Place Files**: Ensure the video files are located in `media/videos`. If the user provides a path to a video elsewhere, copy it to `media/videos`.
2.  **Run Automation**: Execute the conversion script:
    ```bash
    python skills/video-to-gif/convert_and_update.py
    ```
3.  **Verify**: Check `media/gifs` for the generated GIFs and inspect `README.md` to ensure they were inserted correctly (either under a matching header or at the end).
