import io, base64, time, traceback
import torch
import nest_asyncio
import uvicorn
from pyngrok import ngrok, conf
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from controlnet_aux import CannyDetector
from diffusers import ControlNetModel, StableDiffusionXLControlNetPipeline
from fastapi.responses import StreamingResponse
from loading import load_image_from_upload
import gc
from fastapi.responses import StreamingResponse

nest_asyncio.apply()

print("⏳ Loading models...")
t0 = time.time()

dtype = torch.float16
canny_detector = CannyDetector()

CONTROLNET_PATH = "/content/Mydrive/MyDrive/ai interior/controlnetcannysdxl/snapshots/eb115a19a10d14909256db740ed109532ab1483c"
SDXL_PATH       = "/content/Mydrive/MyDrive/ai interior/sdxlmainmodel/snapshots/462165984030d82259a11f4367a4eed129e94a7b"


controlnet = ControlNetModel.from_pretrained(
    CONTROLNET_PATH,
    local_files_only=True,
    torch_dtype=dtype,
)

pipeline = StableDiffusionXLControlNetPipeline.from_pretrained(
    SDXL_PATH,
    controlnet=controlnet,
    local_files_only=True,
    torch_dtype=dtype,
    variant="fp16",
    use_safetensors=True,
)

pipeline.enable_attention_slicing()

print(f"✅ Models loaded in {time.time()-t0:.1f}s")

pipeline.enable_attention_slicing()
pipeline.vae.enable_slicing()
pipeline.vae.enable_tiling()
pipeline = pipeline.to("cuda")

print(f"✅ Models loaded in {time.time()-t0:.1f}s")

app = FastAPI(title="AI Interior Designer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- /health ---
@app.get("/health")
def health():
    gpu = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    return {"status": "ok", "gpu": gpu, "models_loaded": True}

# --- /view-original ---
@app.post("/view-original")
async def view_original(image: UploadFile = File(...)):
    try:
        raw  = await image.read()
        room = load_image_from_upload(raw)
        buf  = io.BytesIO()
        room.save(buf, format="PNG")
        buf.seek(0)
        return StreamingResponse(buf, media_type="image/png")
    except Exception:
        raise HTTPException(status_code=500, detail=traceback.format_exc())

# --- /edges ---
@app.post("/edges")
async def get_edges(
    image: UploadFile = File(...),
    low_threshold: int = Form(100),
    high_threshold: int = Form(200),
):
    try:
        raw   = await image.read()
        room  = load_image_from_upload(raw)
        edges = canny_detector(room, low_threshold=low_threshold, high_threshold=high_threshold)
        buf   = io.BytesIO()
        edges.save(buf, format="PNG")
        buf.seek(0)

        del raw, room, edges  # add karo
        torch.cuda.empty_cache()
        gc.collect()
        return StreamingResponse(buf, media_type="image/png")
    except Exception:
        raise HTTPException(status_code=500, detail=traceback.format_exc())

# --- /redesign ---
@app.post("/redesign")
async def redesign(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    negative_prompt: str = Form("ugly, blurry, distorted, low quality, watermark"),
    num_inference_steps: int   = Form(50),
    guidance_scale:      float = Form(7.5),
    controlnet_scale:    float = Form(0.9),
    low_threshold:       int   = Form(100),
    high_threshold:      int   = Form(200),
):
    try:
        raw    = await image.read()
        room   = load_image_from_upload(raw)
        edges  = canny_detector(room, low_threshold=low_threshold, high_threshold=high_threshold)

        result = pipeline(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=edges,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            controlnet_conditioning_scale=controlnet_scale,
        ).images[0]

        # ✅ Pehle buffer mein save karo
        buf = io.BytesIO()
        result.save(buf, format="PNG")
        buf.seek(0)

        # ✅ Phir sab kuch delete karo — sahi order
        del raw, room, edges, result
        torch.cuda.empty_cache()
        gc.collect()

        return StreamingResponse(buf, media_type="image/png")

    except Exception:
        torch.cuda.empty_cache()
        gc.collect()
        raise HTTPException(status_code=500, detail=traceback.format_exc())