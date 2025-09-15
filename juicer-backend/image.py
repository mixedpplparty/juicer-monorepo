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
    # Reset pointer so subsequent readers can read from the start
    try:
        file.file.seek(0)
    except Exception:
        pass
    return True


async def compress_image(file: UploadFile):
    # Ensure we read from the beginning in case validate_image consumed the stream
    try:
        file.file.seek(0)
    except Exception:
        pass
    contents = await file.read()
    if not contents:
        raise ValueError("Empty or unreadable image data")
    try:
        image = Image.open(BytesIO(contents))
    except Exception as exc:
        raise ValueError("Invalid image data") from exc
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
    image.save(buffer, format="WEBP", optimize=True, quality=30)
    return buffer.getvalue()
