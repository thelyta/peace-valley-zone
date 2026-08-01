export async function downloadResponse(response: Response, fallbackName: string) {
  if (!response.ok) {
    throw new Error("Download failed.");
  }
  const contentDisposition = response.headers.get("content-disposition");
  const filename = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
