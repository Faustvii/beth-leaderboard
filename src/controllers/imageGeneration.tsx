import cron from "@elysiajs/cron";
import { and, eq, inArray, like, or } from "drizzle-orm";
import Elysia from "elysia";
import { readDb, writeDb } from "../db";
import { job_queue, user } from "../db/schema";
import { type JobQueue } from "../db/schema/jobQueue";
import { syncIfLocal } from "../lib/dbHelpers";
import { isBase64 } from "../lib/userImages";

type newJob = typeof job_queue.$inferInsert;
export const imageGen = new Elysia()
  .use(
    cron({
      name: "imageGen-queue",
      pattern: "*/5 * * * * *",
      async run() {
        const usersMissingPictures = await readDb.query.user.findMany({
          columns: {
            id: true,
          },
          where: or(
            eq(user.picture, "/static/crokinole.svg"),
            like(user.picture, "http%"),
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
      pattern: "*/5 * * * * *",
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
      pattern: "0 0 23 * * *",
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
        .update(user)
        .set({ picture: base64Image })
        .where(eq(user.id, userId));
      await trx
        .update(job_queue)
        .set({ status: "complete" })
        .where(eq(job_queue.id, job.id));
    });
    console.log("Image generated for user", userId);
  } catch (error) {
    console.error(`error during image generation`, error);
    await writeDb
      .update(job_queue)
      .set({ status: "error" })
      .where(eq(job_queue.id, job.id));
  }
};
