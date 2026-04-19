from PIL import Image
def load_image_from_upload(file_bytes: bytes) -> Image.Image:
    return Image.open(io.BytesIO(file_bytes)).convert("RGB").resize((768, 768))
