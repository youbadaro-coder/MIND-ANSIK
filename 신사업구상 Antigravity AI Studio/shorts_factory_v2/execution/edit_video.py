import os
import json
import random
import asyncio
import textwrap
import numpy as np
import edge_tts
from PIL import Image, ImageDraw, ImageFont
from moviepy import VideoFileClip, ImageClip, CompositeVideoClip, concatenate_videoclips, AudioFileClip, CompositeAudioClip, AudioClip, concatenate_audioclips

# Korean font path
FONT_PATH = "C:/Windows/Fonts/malgunbd.ttf" # Use bold if available
if not os.path.exists(FONT_PATH):
    FONT_PATH = "C:/Windows/Fonts/malgun.ttf"
if not os.path.exists(FONT_PATH):
    FONT_PATH = "arial.ttf"

job_tmp = os.environ.get("JOB_TMP_DIR")
if job_tmp:
    TEMP_DIR = job_tmp
    VIDEO_OUT_DIR = job_tmp
    AUDIO_OUT_DIR = os.path.join(job_tmp, "audio")
else:
    TEMP_DIR = ".tmp"
    VIDEO_OUT_DIR = os.path.join(TEMP_DIR, "videos")
    AUDIO_OUT_DIR = os.path.join(TEMP_DIR, "audio")

os.makedirs(AUDIO_OUT_DIR, exist_ok=True)

from proglog import ProgressBarLogger

class CustomLogger(ProgressBarLogger):
    def __init__(self):
        super().__init__()
        self.last_pct = -1

    def callback(self, **changes):
        # MoviePy with proglog triggers callbacks
        if 'bars' in self.state:
            for bar_name, bar_data in self.state['bars'].items():
                if bar_name == 'chunk': continue 
                total = bar_data.get('total', 1)
                index = bar_data.get('index', 0)
                if total > 0:
                     pct = int((index / total) * 100)
                     if pct != self.last_pct and pct % 5 == 0: # Print every 5%
                         print(f"[PROGRESS] {pct}% rendered ({index}/{total} frames)", flush=True)
                         self.last_pct = pct

async def generate_narration(text, voice, output_path):
    """Generates TTS audio file."""
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        return True
    except Exception as e:
        print(f"Error generating narration: {e}", flush=True)
        return False

def create_text_image(text, width=1080, height=1920, fontsize=50, color='white'):
    """
    Creates a transparent PIL Image with wrapped and centered text on a transparent background with stroke.
    """
    try:
        font = ImageFont.truetype(FONT_PATH, fontsize)
    except:
        font = ImageFont.load_default()

    # Wrap text to max 2 lines (approx 25 chars for 1080px at 50px font)
    wrapper = textwrap.TextWrapper(width=25) 
    lines = wrapper.wrap(text)[:2] # Ensure max 2 lines
    
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Calculate metrics
    line_spacing = 10
    ascent, descent = font.getmetrics()
    line_h = ascent + descent + line_spacing
    total_h = len(lines) * line_h

    # Calculate widths for centering
    line_widths = []
    for line in lines:
        left, top, right, bottom = font.getbbox(line)
        w = right - left
        line_widths.append(w)

    # USER REQUEST: Position lower (around 85% down)
    padding_y = 15
    box_y1 = int(height * 0.85) - padding_y

    # Draw text with dark gray stroke
    current_y = box_y1 + padding_y
    for i, line in enumerate(lines):
        line_w = line_widths[i]
        current_x = (width - line_w) // 2
        draw.text((current_x, current_y), line, font=font, fill=color, stroke_width=3, stroke_fill='#333333')
        current_y += line_h

    return np.array(img)

async def process_segments(segments, voice_profile, orientation='portrait'):
    """Processes each segment: generates audio and creates video-audio clips."""
    final_segment_clips = []
    
    target_w, target_h = (1080, 1920) if orientation == 'portrait' else (1920, 1080)
    
    for i, seg in enumerate(segments):
        text = seg.get('text', "")
        video_path = os.path.join(VIDEO_OUT_DIR, f"segment_{i}.mp4")
        audio_path = os.path.join(AUDIO_OUT_DIR, f"segment_{i}.mp3")
        
        print(f"Processing segment {i}: {text[:20]}...", flush=True)
        
        # 1. Generate Narration
        if not await generate_narration(text, voice_profile, audio_path):
            continue
            
        # 2. Load Audio
        audio_clip = AudioFileClip(audio_path)
        duration = audio_clip.duration
        
        # 3. Load Video and Sync
        if os.path.exists(video_path):
            try:
                video_clip = VideoFileClip(video_path)
                
                # Resize and Crop to Target Dimension
                if video_clip.h != target_h:
                    video_clip = video_clip.resized(height=target_h)
                
                if video_clip.w > target_w:
                    video_clip = video_clip.cropped(x1=video_clip.w/2 - target_w/2, y1=0, width=target_w, height=target_h)
                elif video_clip.w < target_w:
                    video_clip = video_clip.resized(width=target_w)
                    video_clip = video_clip.cropped(x1=0, y1=video_clip.h/2 - target_h/2, width=target_w, height=target_h)
                
                # Loop or trim video to match audio duration
                # FIXED: Actual padding to prevent audio being cut off and OSError duration mismatch
                padding_duration = 0.5
                silence = AudioClip(frame_function=lambda t: [0, 0], duration=padding_duration, fps=44100)
                audio_clip = concatenate_audioclips([audio_clip, silence])
                duration = audio_clip.duration

                if video_clip.duration < duration:
                    # Repeat the clip to cover the duration
                    n_loops = int(np.ceil(duration / video_clip.duration))
                    video_clip = concatenate_videoclips([video_clip] * n_loops)
                    video_clip = video_clip.subclipped(0, duration)
                else:
                    video_clip = video_clip.subclipped(0, duration)
                
                # Attach Audio
                video_clip = video_clip.with_audio(audio_clip)
                
                # 4. Add Caption Overlay
                txt_img = create_text_image(text, width=target_w, height=target_h)
                txt_clip = ImageClip(txt_img).with_duration(duration).with_position('center')
                
                composite_seg = CompositeVideoClip([video_clip, txt_clip])
                final_segment_clips.append(composite_seg)
                
            except Exception as e:
                print(f"Error processing video for segment {i}: {e}")
                continue
        else:
            print(f"Video for segment {i} not found. Skipping.")

    return final_segment_clips

async def edit_video():
    input_path = os.path.join(TEMP_DIR, 'topic_data.json')
    if not os.path.exists(input_path):
        print("topic_data.json not found.")
        return

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    segments = data.get('segments', [])
    voice_profile = data.get('voice_profile', "ko-KR-SunHiNeural")
    format_type = data.get('format', 'short')
    orientation = data.get('orientation', 'portrait')
    
    if not segments:
        raise ValueError("No segments found in data. Script cannot continue.")

    print("--- Starting Superior Rendering Engine ---", flush=True)
    
    # Process Segments
    segment_clips = await process_segments(segments, voice_profile, orientation)
    
    if not segment_clips:
        raise ValueError("No clips were successfully processed. Aborting render.")

    # Concatenate all segments
    final_video = concatenate_videoclips(segment_clips, method="compose")
    
    # 5. Add Background Music (BGM)
    bgm_path = os.path.join(TEMP_DIR, 'bgm.mp3')
    if os.path.exists(bgm_path):
        try:
            bgm_clip = AudioFileClip(bgm_path)
            # Loop BGM to match video duration
            bgm_clip = bgm_clip.loop(duration=final_video.duration)
            # Lower volume for BGM (Mastering / Ducking)
            bgm_clip = bgm_clip.volumex(0.15) 
            
            # Mix with narration (which is already in final_video.audio)
            final_audio = CompositeAudioClip([final_video.audio, bgm_clip])
            final_video = final_video.with_audio(final_audio)
            print("Successfully mixed background music.", flush=True)
        except Exception as e:
            print(f"Error adding BGM: {e}", flush=True)
    
    # Limit duration based on format
    max_duration = 59 if format_type == 'short' else 180
    if final_video.duration > max_duration:
        final_video = final_video.subclipped(0, max_duration)

    # Output path
    output_path = os.path.join(TEMP_DIR, 'final_video.mp4')
    
    print(f"Exporting final video: {output_path} (Using CPU Rendering + Custom Progress Track)", flush=True)
    logger = CustomLogger()
    final_video.write_videofile(
        output_path, 
        fps=24, 
        codec="libx264", 
        audio_codec="aac",
        preset="ultrafast",
        threads=4,
        logger=logger
    )
    print("--- Video Production Complete! ---", flush=True)

if __name__ == "__main__":
    asyncio.run(edit_video())
