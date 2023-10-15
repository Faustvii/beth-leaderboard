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
