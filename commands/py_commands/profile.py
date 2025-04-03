from PIL import Image, ImageDraw, ImageFont
import sys
import numpy as np # type: ignore

def interpolate(f_co, t_co, interval):
    """
    interpolación de colores desde f_co hasta t_co en 'interval' pasos
    """
    det_co = [(t - f) / interval for f, t in zip(f_co, t_co)]
    for i in range(interval):
        yield [round(f + det * i) for f, det in zip(f_co, det_co)]

def create_gradient(width, height, start_color, end_color):
    """
    degradado diagonal de start_color a end_color lal
    """
    gradient = Image.new('RGBA', (width, height), color=0)
    draw = ImageDraw.Draw(gradient)

    for i, color in enumerate(interpolate(start_color, end_color, width * 2)):
        draw.line([(i, 0), (0, i)], tuple(color), width=1)

    return gradient

def create_profile(user_id, profile_picture, messages_count, commands_count, xp, level):
    width, height = 800, 400
    # Crear un degradado de rosado a morado
    start_color = (255, 105, 180)  # Hot pink
    end_color = (128, 0, 128)      # Purple
    img = create_gradient(width, height, start_color, end_color)
    
    bg_img = Image.open(profile_picture)
    bg_img = bg_img.convert("RGBA")
    bg_img = bg_img.resize((160, 160))

    mask = Image.new('L', bg_img.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0) + bg_img.size, fill=255)

    circular_bg_img = Image.new('RGBA', bg_img.size)
    circular_bg_img.paste(bg_img, mask=mask)
    
    img.paste(circular_bg_img, (20, 20), circular_bg_img)

    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("arial.ttf", 20)
    text_color = (255, 255, 255)
    draw.text((200, 40), f"ID: {user_id}", fill=text_color, font=font)
    draw.text((200, 70), f"Mensajes: {messages_count}", fill=text_color, font=font)
    draw.text((200, 100), f"Comandos: {commands_count}", fill=text_color, font=font)
    draw.text((200, 130), f"XP: {xp}", fill=text_color, font=font)
    draw.text((200, 160), f"Nivel: {level}", fill=text_color, font=font)

    return img

if __name__ == "__main__":
    user_id = sys.argv[1]
    profile_picture = sys.argv[2]
    messages_count = int(sys.argv[3])
    commands_count = int(sys.argv[4])
    xp = int(sys.argv[5])
    level = int(sys.argv[6])

    profile_img = create_profile(user_id, profile_picture, messages_count, commands_count, xp, level)

    profile_img_path = f"cache/temp/{user_id}_profile.png"
    profile_img.save(profile_img_path)

    print(profile_img_path)
