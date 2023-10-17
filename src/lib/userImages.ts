import sharp from "sharp";

export async function resizeImage(
  base64: string,
  size: { width: number; height: number },
) {
  const pictureBuf = Buffer.from(base64, "base64");

  return await sharp(pictureBuf)
    .resize({ ...size })
    .toBuffer()
    .then((buf) => {
      return buf.toString("base64");
    });
}

export function isBase64(input: string) {
  if (input.length % 4 !== 0) return false;
  const invalidChars = /[^0-9a-zA-Z+/=]/g;
  return !invalidChars.test(input);
}
