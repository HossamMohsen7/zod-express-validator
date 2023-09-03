# zod-express-validator

A package to validate [Express](https://www.npmjs.com/package/express) request and response payloads using [Zod](https://www.npmjs.com/package/zod).

Inspired by [zod-express-middleware](https://www.npmjs.com/package/zod-express-middleware)

## Prerequisites

This package requires your project to have [Express](https://www.npmjs.com/package/express) and [Zod](https://www.npmjs.com/package/zod) installed.  
To add this package to your project you can use one of the following commands:

```bash
npm install zod-express-validator
yarn add zod-express-validator
pnpm add zod-express-validator
```

## Usage

This package has a single function that you use as an Express middleware in your handlers, you need to import it as the following:

```typescript
import { validate } from "zod-express-validator";
```

Then, in your handler you can use it as the following:

```typescript
const app = express();

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

app.post(
  "/info/:userId",
  validate(
    {
      body: bodySchema,
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
    return res.status(200).json({ success: true });
  }
);
```

Note: You can skip any of the schemas if you don't want to validate it.  
**Important Note: For validation of `params` and `query` your must always use `z.coerce` to convert the values to the correct type**

### Usage with Controllers

```typescript
const app = express();

const bodySchema = z.object({
  name: z.string().min(3).max(255),
});

const paramsSchema = z.object({
  userId: z.coerce.string().min(3).max(255),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).max(100),
});

const responseSchema = z.object({
  success: z.boolean(),
});

const validator = validate(
  {
    body: bodySchema,
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
);

type ValidatorType = typeof validator;

const controller: ValidatorType = (req, res) => {
  // Do something
  const body = req.body; //body is now typed
  const params = req.params; //params is now typed
  const query = req.query; //query is now typeds

  //Because we have a response schema, we will have type checking for the response
  return res.status(200).json({ success: true });
};

app.post("/info/:userId", validator, controller);
```

## Typescript Support

This package fully supports Typescript, and will infer the types of your request and response payloads.

## Versioning

This package uses [SemVer](https://semver.org/) for versioning.

## Contributing & Issues

Feel free to open an issue or a pull request if you have any suggestions or if you found a bug.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
