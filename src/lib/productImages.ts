export function parseProductImageUrls(value: string): string[] {
  return [...new Set(value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean))];
}

export function getProductImages(imageUrl: string | null, imageUrls: string[] | null | undefined) {
  return [...new Set([imageUrl?.trim(), ...(imageUrls ?? []).map((url) => url.trim())]
    .filter((url): url is string => Boolean(url)))];
}

export function validateProductImageUrls(urls: string[]): boolean {
  return urls.every((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  });
}
