import express from "express";
import z from "zod";
import { validate } from "../src/index";

const app = express();
app.use(express.json());

const bodySchema = z.object({
  name: z.string().min(3).max(255),
});

const paramsSchema = z.object({
  userId: z.coerce.number(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).max(100),
});

const responseSchema = z.object({
  success: z.boolean(),
});

export const zodEffects = z
  .object({ jsonString: z.string() })
  .refine(
    (incomingData) => {
      try {
        return JSON.parse(incomingData.jsonString);
      } catch (error) {
        return false;
      }
    },
    {
      message: ".jsonString should be a valid JSON string.",
    }
  )
  .transform((incomingData) => {
    return z
      .object({ bodyKey: z.number() })
      .parse(JSON.parse(incomingData.jsonString));
  });

const registerEndpoints = () => {
  app.post(
    "/info/:userId",
    validate(
      {
        body: zodEffects,
        params: paramsSchema,
        query: querySchema,
        res: responseSchema,
      },
      ({ bodyError, paramsError, queryError }, res) => {
        //This will be called if there is a validation error in the request.
        //Get the first non-null error
        const error = bodyError ?? paramsError ?? queryError;
        return res.status(400).json({ error: error?.message });
      }
    ),
    (req, res) => {
      // Do something
      const body = req.body; //body is now typed
      const params = req.params; //params is now typed
      const query = req.query; //query is now typeds

      //Because we have a response schema, we will have type checking for the response
      res.status(200).json({ success: true });
    }
  );
};

const startServer = () => {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
};

const main = async () => {
  registerEndpoints();
  startServer();
};
main();
