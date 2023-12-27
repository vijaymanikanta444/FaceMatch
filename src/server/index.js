import { uuid } from "@/utils/uuid";
import { publicProcedure, router } from "./trpc";
import * as AWS from "aws-sdk";
import Rekognition from "aws-sdk/clients/rekognition";
import S3 from "aws-sdk/clients/s3";
import { TRPCError } from "@trpc/server";

import { z } from "zod";

if (process.env.ACCESS_KEY_ID) {
  AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION,
  });
}

const rekog = new Rekognition();
const s3 = new S3();

export const appRouter = router({
  getTodos: publicProcedure.query(async () => {
    return [1, 2, 3];
  }),

  hello: publicProcedure
    .input(
      z
        .object({
          text: z.string().nullish(),
        })
        .nullish()
    )
    .query(async ({ input }) => {
      const res = await rekog
        .listFaces({ CollectionId: "face-match" })
        .promise();
      return {
        data: res,
        greeting: `hello ${input?.text ?? "world"}`,
      };
    }),

  indexFace: publicProcedure
    .input(
      z.object({
        image: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const base64Img = input.image.replace("data:image/jpeg;base64,", "");
        const imgBuffer = Buffer.from(base64Img, "base64");
        // create a unique id for the image

        // Detect faces in the image
        const faceDetectionResult = await rekog
          .detectFaces({
            Image: {
              Bytes: imgBuffer,
            },
          })
          .promise();

        // Check if any faces are detected
        const detectedFaces = faceDetectionResult.FaceDetails;

        if (detectedFaces.length === 0) {
          // No face detected, handle this scenario (e.g., return an error)
          throw new TRPCError({
            code: "NO_FACE_DETECTED",
            message: "No face detected in the uploaded image",
          });
        }

        const imageId = uuid();
        // Add face to rekognition collection
        await rekog
          .indexFaces({
            CollectionId: "face-match",
            ExternalImageId: imageId,
            Image: {
              Bytes: imgBuffer,
            },
          })
          .promise();
        // Add face to s3 bucket
        await s3
          .putObject({
            Bucket: "face-match-data",
            Key: "faces/" + imageId + ".jpg",
            Body: imgBuffer,
          })
          .promise();
        return {
          error: null,
          eMessage: "",
          sMessage: "image is updated to the database successfully",
        };
      } catch (e) {
        return { error: true, eMessage: e.message, sMessage: "" };
      }
    }),

  searchFaceByImage: publicProcedure
    .input(
      z.object({
        image: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const base64Img = input.image.replace("data:image/jpeg;base64,", "");
        const imgBuffer = Buffer.from(base64Img, "base64");
        const res = await rekog
          .searchFacesByImage({
            CollectionId: "face-match",
            Image: {
              Bytes: imgBuffer,
            },
          })
          .promise();

        const images = [];
        // loop faces
        for (const face of res.FaceMatches ?? []) {
          // get the image from s3
          const s3Res = await s3
            .getObject({
              Bucket: "face-match-data",
              Key: "faces/" + face.Face?.ExternalImageId + ".jpg",
            })
            .promise();
          // convert to base64
          console.log(face);
          const base64 = s3Res.Body?.toString("base64");
          images.push({
            imageSrc: base64,
            similarity: face.Similarity,
            imageId: face.Face?.ExternalImageId,
          });
        }
        return {
          images,
          error: false,
          sMessage: "hey...!, here are the results",
          eMessage: "",
        };
      } catch (e) {
        console.log({ e });
        return { error: true, eMessage: e.message, sMessage: "", images: null };
      }
    }),
});

// export type Approuter = typeof appRouter;
