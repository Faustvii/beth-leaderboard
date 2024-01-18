import { mkdir } from "node:fs/promises";
import cron from "@elysiajs/cron";
import { and, eq, inArray, like, or } from "drizzle-orm";
import Elysia from "elysia";
import { config } from "../config";
import { readDb, writeDb } from "../db";
import { SeedPreprod } from "../db/preprod";
import { getUsers, getUserWithPicture } from "../db/queries/userQueries";
import { job_queue, userTbl } from "../db/schema";
import { type JobQueue } from "../db/schema/jobQueue";
import { syncIfLocal } from "../lib/dbHelpers";
import { isBase64, resizeImage } from "../lib/userImages";

type newJob = typeof job_queue.$inferInsert;

export const cronJobs = new Elysia()
  .use(
    cron({
      name: "seed-database",
      pattern: "0 0 31 2 *",
      async run() {
        await SeedPreprod(writeDb);
      },
    }),
  )
  .use(
    cron({
      name: "generate-image-assets",
      pattern: "0 0 31 2 *",
      async run() {
        const users = await getUsers();
        console.log("Generating image assets for users", users.length);
        await mkdir("public/user", { recursive: true });
        for (const user of users) {
          await generateImageAssetForUser(user.id, user.name);
        }
      },
    }),
  )
  .use(
    cron({
      name: "imageGen-queue",
      pattern:
        config.env.NODE_ENV !== "production" ? "0 0 31 2 *" : "*/5 * * * * *",
      async run() {
        const usersMissingPictures = await readDb.query.userTbl.findMany({
          columns: {
            id: true,
          },
          where: or(
            eq(userTbl.picture, "/public/crokinole-c.min.svg"),
            like(userTbl.picture, "http%"),
          ),
        });
        if (usersMissingPictures.length <= 0) return;

        for (const userMissingPicture of usersMissingPictures) {
          const usersAlreadyInQueueForPicture =
            await readDb.query.job_queue.findFirst({
              where: and(
                inArray(job_queue.status, ["pending", "processing"]),
                like(job_queue.data, `%${userMissingPicture.id}%`),
              ),
            });
          if (usersAlreadyInQueueForPicture) continue;
          console.log(
            `Adding user ${userMissingPicture.id} to image generation queue`,
          );
          const newJob: newJob = {
            type: "image",
            data: {
              userId: userMissingPicture.id,
            },
            createdAt: new Date(),
            status: "pending",
          };
          await writeDb.insert(job_queue).values(newJob);
        }
        await syncIfLocal();
      },
    }),
  )
  .use(
    cron({
      name: "imageGen-worker",
      pattern:
        config.env.NODE_ENV !== "production" ? "0 0 31 2 *" : "*/5 * * * * *",
      async run() {
        const usersMissingPictures = await readDb.query.job_queue.findMany({
          where: and(
            eq(job_queue.type, "image"),
            eq(job_queue.status, "pending"),
          ),
        });

        for (const missingPictureJob of usersMissingPictures) {
          await writeDb
            .update(job_queue)
            .set({ status: "processing" })
            .where(eq(job_queue.id, missingPictureJob.id));
          void generateImageForUser(
            missingPictureJob.data.userId,
            missingPictureJob,
          );
        }
      },
    }),
  )
  .use(
    cron({
      name: "imageGen-cleanup",
      pattern:
        config.env.NODE_ENV !== "production" ? "0 0 31 2 *" : "0 0 23 * * *",
      async run() {
        await writeDb
          .delete(job_queue)
          .where(
            and(eq(job_queue.type, "image"), eq(job_queue.status, "complete")),
          );
      },
    }),
  );

const generateImageForUser = async (userId: string, job: JobQueue) => {
  try {
    if (config.env.NODE_ENV !== "production") return;
    console.log("Generating image for user", userId);
    const controller = new AbortController();
    const timeoutSeconds = 1000 * 600;
    const signal = controller.signal;
    const model = "Deliberate";
    const prompt = `Funny image with a software engineer playing crokinole. The person is either happy, mad or excited`;
    setTimeout(() => controller.abort(), timeoutSeconds);
    const result = await fetch(
      `https://crokinole.teamsams.dk/profile-image/create?model=${model}&prompt=${prompt}`,
      { signal },
    );
    const base64Image = await result.text();
    if (!isBase64(base64Image)) throw new Error("Not a base64 image");
    await writeDb.transaction(async (trx) => {
      await trx
        .update(userTbl)
        .set({ picture: base64Image })
        .where(eq(userTbl.id, userId));
      await trx
        .update(job_queue)
        .set({ status: "complete" })
        .where(eq(job_queue.id, job.id));
    });
    console.log("Image generated for user", userId);
    await generateImageAssetForUser(userId, userId);
  } catch (error) {
    console.error(`error during image generation`, error);
    await writeDb
      .update(job_queue)
      .set({ status: "error" })
      .where(eq(job_queue.id, job.id));
  }
};

const generateImageAssetForUser = async (userId: string, name: string) => {
  const fileName = `public/user/${userId}-32x32.webp`;
  const fullSizeFileName = `public/user/${userId}.webp`;
  await userPicture(name, userId, fileName, {
    width: 32,
    height: 32,
  });
  await userPicture(name, userId, fullSizeFileName);
};

async function userPicture(
  userName: string,
  id: string,
  fileName: string,
  resize?: { width: number; height: number },
) {
  const file = Bun.file(fileName);
  const exists = await file.exists();
  const dbUser = await getUserWithPicture(id);
  if (!dbUser) {
    return new Response(null, { status: 404 });
  }
  if (!exists) {
    console.log("Generating image asset for user", userName);
    if (!isBase64(dbUser.picture)) {
      const crokPic = Bun.file("public/favicon-512x512.png");
      await Bun.write(fileName, crokPic);
      return;
    }
    const picture = resize
      ? await resizeImage(dbUser.picture, { ...resize })
      : dbUser.picture;
    const pictureBuffer = Buffer.from(picture, "base64");
    await Bun.write(fileName, pictureBuffer);
  } else {
    // check if image is the same as the base64 image on the user
    // if resize is set, we need to compare the original image
    let fileBuffer = await file.arrayBuffer();
    if (resize) {
      const fullSizeFile = Bun.file(`public/user/${id}.webp`);
      fileBuffer = await fullSizeFile.arrayBuffer();
    }
    const fileBase64 = Buffer.from(fileBuffer).toString("base64");
    if (fileBase64 !== dbUser.picture && isBase64(dbUser.picture)) {
      console.log("Generating image asset for user", userName);
      const picture = resize
        ? await resizeImage(dbUser.picture, { ...resize })
        : dbUser.picture;
      const pictureBuffer = Buffer.from(picture, "base64");
      await Bun.write(fileName, pictureBuffer);
    }
  }
}
