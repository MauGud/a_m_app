function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function saveImagesToDeviceGallery(
  images: { dataUrl: string; filename: string }[]
): Promise<void> {
  const files = await Promise.all(
    images.map((img) => dataUrlToFile(img.dataUrl, img.filename))
  );

  if (isIOS() && navigator.canShare && navigator.canShare({ files })) {
    try {
      await navigator.share({
        files,
        title: 'Recuerdo',
      });
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
    }
  }

  for (const file of files) {
    downloadFile(file);
    await new Promise((r) => setTimeout(r, 350));
  }
}
