import filetype
from io import BytesIO
from PIL import Image
from fastapi import UploadFile
# validate image


async def validate_image(file: UploadFile):
    contents = await file.read()
    if not file:
        raise ValueError("File is required")
    if not file.content_type.startswith("image/"):
        raise ValueError("File is not an image")
    if not file.filename.endswith((".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp")):
        raise ValueError("File is not an image")
    if not filetype.is_image(contents):
        raise ValueError("File is not an image")
    return True


async def compress_image(file: UploadFile):
    contents = await file.read()
    image = Image.open(BytesIO(contents))
    width, height = image.size
    target_width = 384
    target_height = 384
    if width > height:
        target_height = int(height * (target_width / width))
    else:
        target_width = int(width * (target_height / height))
    image = image.resize((target_width, target_height),
                         Image.Resampling.LANCZOS)
    buffer = BytesIO()
    image.save(buffer, format="JPEG", optimize=True, quality=30)
    return buffer.getvalue()
