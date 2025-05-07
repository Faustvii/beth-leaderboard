# This project was created using `create-beth-app`

### To run locally:

1. `bun install`
2. Do one of the these
   - get credentials for dev turso
   - just run with local sqlite.
   - create a new turso database with `turso db create <name>`
     - get the database url with `turso db show --url <name>`
     - get the auth token with `turso db tokens create <name>`
3. (optional) create a new app registration and get credentials
4. copy `.env.example` to `.env`
5. fill out all enviorment variables (refer to the config file to see schema)
6. `bun dev` (this will migrate your db)

- (optional) stop your bun dev and run `bun db:seed` (This will create some players and matches)
- run `bun dev` again after seed has finished

### To deploy to fly.io

1. Install the [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/)

2. Run `fly launch`

3. Run `fly secrets set <NAME>=<VALUE>` (probably want to set `NODE_ENV` to `"production"`)

4. Run `fly deploy`

### Generating DB migration

If you are having trouble with generated migrations just delete all tables then it seems to be a problem with Bun.
Instead you can use node and it seems to work.

Just run `npx drizzle-kit generate`.
