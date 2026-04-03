const MAX_DIAGNOSIS_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DIAGNOSIS_IMAGE_DIMENSION = 1024;
const MIN_DIAGNOSIS_IMAGE_DIMENSION = 512;
const MAX_DIAGNOSIS_IMAGE_BYTES = 550 * 1024;
const INITIAL_DIAGNOSIS_IMAGE_QUALITY = 0.72;
const MIN_DIAGNOSIS_IMAGE_QUALITY = 0.42;
const QUALITY_STEP = 0.08;
const RESIZE_STEP = 0.85;
const BASE64_CHUNK_SIZE = 0x8000;
const OUTPUT_MIME_TYPE = "image/jpeg";
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

export type OptimizedDiagnosisImage = {
  blob: Blob;
  previewUrl: string;
};

export function validateDiagnosisImageFile(file: File) {
  const fileName = file.name.toLowerCase();
  const isAcceptedType = file.type.startsWith("image/") || ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension));

  if (!isAcceptedType) {
    throw new Error("Selecione uma imagem válida.");
  }

  if (file.size > MAX_DIAGNOSIS_FILE_SIZE) {
    throw new Error("A imagem deve ter no máximo 10MB.");
  }
}

export async function optimizeImageForDiagnosis(file: File): Promise<OptimizedDiagnosisImage> {
  validateDiagnosisImageFile(file);

  const { source, width, height, cleanup } = await loadImageSource(file);

  try {
    const { targetWidth, targetHeight } = getTargetDimensions(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Não consegui preparar a foto para análise. Tente outra imagem.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.drawImage(source, 0, 0, targetWidth, targetHeight);

    const blob = await createOptimizedBlob(canvas);

    return {
      blob,
      previewUrl: URL.createObjectURL(blob),
    };
  } finally {
    cleanup();
  }
}

export function revokePreviewUrl(previewUrl: string | null) {
  if (previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }
}

export async function encodeDiagnosisImageToBase64(blob: Blob) {
  try {
    if (typeof FileReader !== "undefined") {
      return await blobToBase64WithFileReader(blob);
    }
  } catch (error) {
    console.warn("Diagnosis FileReader base64 conversion failed, using fallback.", error);
  }

  try {
    const buffer = await blob.arrayBuffer();
    const base64 = cleanBase64(uint8ArrayToBase64(new Uint8Array(buffer)));

    if (!base64) {
      throw new Error("Não consegui preparar a foto para análise. Tente outra imagem.");
    }

    return base64;
  } catch {
    throw new Error("Não consegui preparar a foto para análise. Tente outra imagem.");
  }
}

function getTargetDimensions(width: number, height: number) {
  if (width <= MAX_DIAGNOSIS_IMAGE_DIMENSION && height <= MAX_DIAGNOSIS_IMAGE_DIMENSION) {
    return { targetWidth: width, targetHeight: height };
  }

  if (width >= height) {
    return {
      targetWidth: MAX_DIAGNOSIS_IMAGE_DIMENSION,
      targetHeight: Math.max(1, Math.round(height * (MAX_DIAGNOSIS_IMAGE_DIMENSION / width))),
    };
  }

  return {
    targetWidth: Math.max(1, Math.round(width * (MAX_DIAGNOSIS_IMAGE_DIMENSION / height))),
    targetHeight: MAX_DIAGNOSIS_IMAGE_DIMENSION,
  };
}

async function createOptimizedBlob(canvas: HTMLCanvasElement) {
  let workingCanvas = canvas;

  while (true) {
    const compressedBlob = await compressCanvas(workingCanvas);

    if (!compressedBlob) {
      throw new Error("Não consegui preparar a foto para análise. Tente outra imagem.");
    }

    const reachedMinSize = workingCanvas.width <= MIN_DIAGNOSIS_IMAGE_DIMENSION || workingCanvas.height <= MIN_DIAGNOSIS_IMAGE_DIMENSION;
    if (compressedBlob.size <= MAX_DIAGNOSIS_IMAGE_BYTES || reachedMinSize) {
      return compressedBlob;
    }

    workingCanvas = resizeCanvas(workingCanvas, RESIZE_STEP);
  }
}

async function compressCanvas(canvas: HTMLCanvasElement) {
  let smallestBlob: Blob | null = null;

  for (let quality = INITIAL_DIAGNOSIS_IMAGE_QUALITY; quality >= MIN_DIAGNOSIS_IMAGE_QUALITY; quality -= QUALITY_STEP) {
    const normalizedQuality = Number(quality.toFixed(2));
    const blob = await canvasToBlob(canvas, OUTPUT_MIME_TYPE, normalizedQuality);

    if (!blob || blob.size === 0) {
      continue;
    }

    smallestBlob = blob;

    if (blob.size <= MAX_DIAGNOSIS_IMAGE_BYTES) {
      return blob;
    }
  }

  return smallestBlob;
}

function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

async function loadImageSource(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  // On mobile, always use HTMLImageElement — createImageBitmap has intermittent
  // failures on iOS Safari (especially with imageOrientation) that crash the page.
  if (!isMobileDevice() && typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fallback for browsers with partial support.
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Não consegui preparar a foto para análise. Tente outra imagem."));
      element.src = objectUrl;
    });

    return {
      source: image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function blobToBase64WithFileReader(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      try {
        const result = typeof reader.result === "string" ? cleanBase64(reader.result) : "";

        if (!result) {
          reject(new Error("Não consegui preparar a foto para análise. Tente outra imagem."));
          return;
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Não consegui preparar a foto para análise. Tente outra imagem."));
    reader.readAsDataURL(blob);
  });
}

function resizeCanvas(canvas: HTMLCanvasElement, scale: number) {
  const resizedCanvas = document.createElement("canvas");
  resizedCanvas.width = Math.max(MIN_DIAGNOSIS_IMAGE_DIMENSION, Math.round(canvas.width * scale));
  resizedCanvas.height = Math.max(MIN_DIAGNOSIS_IMAGE_DIMENSION, Math.round(canvas.height * scale));

  const context = resizedCanvas.getContext("2d", { alpha: false });
  if (!context) {
    return canvas;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, resizedCanvas.width, resizedCanvas.height);
  context.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);

  return resizedCanvas;
}

function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = "";

  for (let index = 0; index < bytes.length; index += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(index, index + BASE64_CHUNK_SIZE);

    for (const byte of chunk) {
      binary += String.fromCharCode(byte);
    }
  }

  return btoa(binary);
}

function cleanBase64(value: string) {
  let cleaned = value.trim();

  if (cleaned.startsWith("data:") && cleaned.includes(",")) {
    cleaned = cleaned.split(",", 2)[1] ?? "";
  }

  cleaned = cleaned.replace(/\s/g, "");

  if (!cleaned || !/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    throw new Error("Não consegui preparar a foto para análise. Tente outra imagem.");
  }

  return cleaned;
}