import os
import subprocess
import sys

# Configuration
VIDEO_DIR = 'media/videos'
GIF_DIR = 'media/gifs'
README_PATH = 'README.md'

def ensure_dirs():
    """Ensure media directories exist."""
    if not os.path.exists(VIDEO_DIR):
        print(f"Creating {VIDEO_DIR}...")
        os.makedirs(VIDEO_DIR)
    if not os.path.exists(GIF_DIR):
        print(f"Creating {GIF_DIR}...")
        os.makedirs(GIF_DIR)

def convert_video_to_gif(video_path, gif_path):
    """Convert a video file to GIF using ffmpeg."""
    # Command: ffmpeg -y -i input.mp4 -vf "fps=10,scale=640:-1:flags=lanczos" -c:v gif output.gif
    cmd = [
        'ffmpeg', '-y', '-i', video_path,
        '-vf', 'fps=10,scale=640:-1:flags=lanczos',
        '-c:v', 'gif',
        gif_path
    ]
    
    print(f"Converting {video_path} to {gif_path}...")
    try:
        # Capture output to avoid cluttering console unless error
        subprocess.run(cmd, check=True, capture_output=True)
        print("Conversion successful.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error converting video: {e.stderr.decode()}")
        return False
    except FileNotFoundError:
        print("Error: ffmpeg not found. Please ensure ffmpeg is installed and in your PATH.")
        sys.exit(1)

def get_title_from_filename(filename):
    """Convert filename (snake_case/kebab-case) to Title Case string."""
    base = os.path.splitext(filename)[0]
    # Replace separators with spaces and title case
    return base.replace('_', ' ').replace('-', ' ').title()

def update_readme(gifs):
    """Update README.md with new GIFs in appropriate sections."""
    if not os.path.exists(README_PATH):
        print(f"{README_PATH} not found. Creating a basic one.")
        with open(README_PATH, 'w') as f:
            f.write("# Project Documentation\n\n")
            
    with open(README_PATH, 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    # Work on a copy of lines or reconstructed list? 
    # To handle insertions safely, we can reconstruct the content.
    # But checking for existence in 'content' string is safer first.
    
    new_gifs_to_add = []
    for gif_name, title in gifs:
        gif_rel_path = f"{GIF_DIR}/{gif_name}"
        # Check if this exact image link is already in the file
        if f"({gif_rel_path})" in content:
            print(f"Skipping {gif_name}, already in README.")
            continue
        new_gifs_to_add.append((gif_name, title, gif_rel_path))
    
    if not new_gifs_to_add:
        print("No new GIFs to add to README.")
        return

    # Process additions
    # We iterate through the lines to find insertion points
    final_lines = lines[:]
    
    for gif_name, title, gif_rel_path in new_gifs_to_add:
        md_image = f"![{title}]({gif_rel_path})"
        inserted = False
        
        # Heuristic: Find a header that contains words from the title
        # Normalize title for matching
        search_terms = title.lower().split()
        
        best_match_idx = -1
        best_match_score = 0
        
        for i, line in enumerate(final_lines):
            if line.strip().startswith('#'):
                header_text = line.lstrip('#').strip().lower()
                # Count matching words
                score = sum(1 for term in search_terms if term in header_text)
                if score > best_match_score:
                    best_match_score = score
                    best_match_idx = i
        
        if best_match_score > 0:
            # Insert after the header section
            # We look for the next header to insert before it, or end of section
            target_idx = best_match_idx + 1
            # Skip empty lines immediately after header
            while target_idx < len(final_lines) and not final_lines[target_idx].strip():
                target_idx += 1
                
            # Insert here
            final_lines.insert(target_idx, f"\n{md_image}\n")
            print(f"Inserted {gif_name} under header at line {best_match_idx+1}.")
            inserted = True
        
        if not inserted:
            # Append to end
            print(f"Appending {gif_name} to end of README.")
            final_lines.append(f"\n### {title}\n{md_image}\n")

    with open(README_PATH, 'w') as f:
        f.write('\n'.join(final_lines))
    print(f"Updated {README_PATH}.")

def main():
    print("Starting Video to GIF automation...")
    ensure_dirs()
    
    if not os.path.exists(VIDEO_DIR):
        print(f"Directory {VIDEO_DIR} does not exist.")
        return

    videos = [f for f in os.listdir(VIDEO_DIR) if f.lower().endswith(('.mp4', '.mov', '.avi', '.mkv'))]
    
    if not videos:
        print(f"No videos found in {VIDEO_DIR}. Please add some video files.")
        return

    processed_gifs = []

    for video in videos:
        video_path = os.path.join(VIDEO_DIR, video)
        gif_name = os.path.splitext(video)[0] + '.gif'
        gif_path = os.path.join(GIF_DIR, gif_name)
        
        # Check if GIF exists and is newer than video?
        # For now, just check existence.
        if not os.path.exists(gif_path):
            if convert_video_to_gif(video_path, gif_path):
                processed_gifs.append((gif_name, get_title_from_filename(video)))
        else:
            print(f"GIF already exists: {gif_name}")
            processed_gifs.append((gif_name, get_title_from_filename(video)))
            
    if processed_gifs:
        update_readme(processed_gifs)

if __name__ == "__main__":
    main()
