import os
import sys
import json
import asyncio
import textwrap
import numpy as np
import edge_tts
from PIL import Image, ImageDraw, ImageFont
from moviepy import VideoFileClip, ImageClip, CompositeVideoClip, concatenate_videoclips, AudioFileClip, CompositeAudioClip, AudioClip
from moviepy.video.fx import Loop
from proglog import ProgressBarLogger

# Force UTF-8 output to avoid cp949 encode errors on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Configuration
FONT_PATH = "C:/Windows/Fonts/malgunbd.ttf"
if not os.path.exists(FONT_PATH):
    FONT_PATH = "C:/Windows/Fonts/malgun.ttf"

class NovaLogger(ProgressBarLogger):
    def callback(self, **changes):
        if 'bars' in self.state:
            for name, data in self.state['bars'].items():
                if name == 'chunk': continue
                total = data.get('total', 1)
                index = data.get('index', 0)
                if total > 0:
                    pct = (index / total) * 100
                    # We output with [PROGRESS] tag for server to parse
                    # And only if the percentage changed significantly to avoid log flood
                    if not hasattr(self, '_last_pct') or pct - self._last_pct >= 1.0 or pct >= 99.9:
                        print(f"[STATUS] [PROGRESS] {pct:.1f}%")
                        self._last_pct = pct

async def generate_voice(text, voice, path):
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(path)
        return True
    except Exception as e:
        print(f"TTS Error: {e}")
        return False

def create_caption_img(text, w, h):
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(FONT_PATH, 70)
    except:
        font = ImageFont.load_default()
    
    # Adjust wrapping width based on orientation (rough estimate)
    is_landscape = w > h
    wrap_width = 30 if is_landscape else 15
    wrapper = textwrap.TextWrapper(width=wrap_width)
    lines = wrapper.wrap(text)[:2] if not is_landscape else wrapper.wrap(text)[:3]
    
    y = int(h * 0.75)
    for line in lines:
        lw, lh = d.textbbox((0, 0), line, font=font)[2:]
        x = (w - lw) // 2
        # Outline
        d.text((x-2, y-2), line, font=font, fill='black')
        d.text((x+2, y+2), line, font=font, fill='black')
        # Main text
        d.text((x, y), line, font=font, fill='white')
        y += lh + 10
    return np.array(img)

async def main():
    job_tmp = os.environ.get("JOB_TMP_DIR", ".tmp")
    data_path = os.path.join(job_tmp, "topic_data.json")
    
    if not os.path.exists(data_path):
        print("topic_data.json missing.")
        return

    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    segments = data.get('segments', [])
    voice = data.get('voice_profile', 'ko-KR-SunHiNeural')
    orientation = data.get('orientation', 'portrait')
    target_size = (1080, 1920) if orientation == 'portrait' else (1920, 1080)
    
    clips = []
    print(f"Processing {len(segments)} segments...")

    for i, seg in enumerate(segments):
        txt = seg['text']
        v_path = os.path.join(job_tmp, f"segment_{i}.mp4")
        a_path = os.path.join(job_tmp, f"segment_{i}.mp3")
        
        await generate_voice(txt, voice, a_path)
        
        if not os.path.exists(v_path): continue
        
        try:
            audioclip = AudioFileClip(a_path)
            videoclip = VideoFileClip(v_path)
            
            # Resize/Crop
            videoclip = videoclip.resized(height=target_size[1])
            if videoclip.w > target_size[0]:
                videoclip = videoclip.cropped(x1=(videoclip.w - target_size[0])//2, width=target_size[0])
            
            # Loop/Trim
            if videoclip.duration < audioclip.duration:
                videoclip = videoclip.with_effects([Loop(duration=audioclip.duration)])
            else:
                videoclip = videoclip.with_duration(audioclip.duration)
            
            videoclip = videoclip.with_audio(audioclip)
            
            # Captions
            cap_img = create_caption_img(txt, target_size[0], target_size[1])
            cap_clip = ImageClip(cap_img).with_duration(audioclip.duration).with_position('center')
            
            clips.append(CompositeVideoClip([videoclip, cap_clip]))
        except Exception as e:
            print(f"Segment {i} Clip Error: {e}")

    if not clips:
        print("No clips generated.")
        return

    final = concatenate_videoclips(clips, method="compose")
    
    # BGM
    bgm_path = os.path.join(job_tmp, "bgm.mp3")
    if os.path.exists(bgm_path):
        bgm = AudioFileClip(bgm_path).with_duration(final.duration).with_volume_scaled(0.15)
        final_audio = CompositeAudioClip([final.audio, bgm])
        final = final.with_audio(final_audio)

    out_path = os.path.join(job_tmp, "final_video.mp4")
    final.write_videofile(out_path, fps=24, codec="libx264", audio_codec="aac", logger=NovaLogger(), preset="ultrafast")
    print(f"Production Complete: {out_path}")

if __name__ == "__main__":
    asyncio.run(main())
