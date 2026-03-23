## My Yenta D1

#### Basic

Hosted on Cloudflare D1. Uses the Sqlite relationship language.

*OLD* Doc link: https://developers.cloudflare.com/d1/tutorials/d1-and-prisma-orm/

https://www.prisma.io/docs/guides/deployment/cloudflare-d1

DB name: `qrs-db`

Preview DB name: ``

> Note currently there is no staging db set up

#### Steps for making changes to the DB

2) Then calc the diff between the states, note that `--from-empty` is only used in a inital migration (freash start). Otherwise `--from-local-d1` should be used
    > *OLD* `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --output migrations/0001_init.sql`

    > 
```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema prisma/schema.prisma \
  --script > prisma/migrations/0001_init.sql
```

    > `npx prisma migrate diff --from-local-d1 --to-schema-datamodel ./prisma/schema.prisma --script --output ./prisma/migrations/000`

3) Exacute the migration locally
    > `npx wrangler d1 migrations apply qrs-db --local`

4) Apply to the staging d1
    > `npx wrangler d1 migrations apply my-yenta-sd1 --remote`
    or actually?
    > `npx wrangler d1 migrations apply eros-db --remote --preview`

5) Apply to the production d1
    > `npx wrangler d1 migrations apply eros-db --remote`


---

### As of 5/11 (when I read the doc)

With this guide:
`https://www.prisma.io/docs/guides/cloudflare-d1#7-set-the-database_url-environment-variable-and-deploy-the-worker`

There is a potential to use prisma migrate to do the full mi

---

#### Some common utility commands

Clearing out all data in a table
`npx wrangler d1 execute eros-db --command="DELETE FROM <TABLE_NAME>;"`

Clearing out all data in a column of a table
`npx wrangler d1 execute eros-db --command="UPDATE <TABLE_NAME> SET <COLUMN_NAME> = '';"`

Checking the Prisma schema against the local D1 store
`npx prisma migrate diff --from-local-d1 --to-schema-datamodel ./prisma/schema.prisma --script`


#### Some Cool things to leaverage in the future

https://www.prisma.io/docs/orm/prisma-schema/data-model/table-inheritance