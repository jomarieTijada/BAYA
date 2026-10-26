import numpy as np
from PIL import Image
IMG_WIDTH = IMG_HEIGHT = 96
INK_THRESHOLD = 0.08
IMAGE_PADDING_RATIO = 0.15

def load_image_array(image_path):

    img = Image.open(image_path).convert("RGBA")
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    bg.alpha_composite(img)


    gray = bg.convert("L")
    arr = np.asarray(gray, dtype=np.float32) / 255.0




    ink = 1.0 - arr


    mask = ink > INK_THRESHOLD

    if np.any(mask):
        ys, xs = np.where(mask)

        y0, y1 = int(ys.min()), int(ys.max()) + 1
        x0, x1 = int(xs.min()), int(xs.max()) + 1


        crop = ink[y0:y1, x0:x1]

        crop_h, crop_w = crop.shape
        max_dim = max(crop_h, crop_w)


        padding = max(2, int(round(max_dim * IMAGE_PADDING_RATIO)))
        square_side = max_dim + 2 * padding


        square = np.zeros((square_side, square_side), dtype=np.float32)

        top = (square_side - crop_h) // 2
        left = (square_side - crop_w) // 2

        square[top:top + crop_h, left:left + crop_w] = crop
    else:

        square = ink


    square_u8 = np.clip(square * 255.0, 0, 255).astype(np.uint8)
    standardized = Image.fromarray(square_u8, mode="L").resize(
        (IMG_WIDTH, IMG_HEIGHT),
        Image.Resampling.BILINEAR,
    )

    result = np.asarray(standardized, dtype=np.float32) / 255.0


    result = np.expand_dims(result, axis=-1)
    return result.astype(np.float32)
