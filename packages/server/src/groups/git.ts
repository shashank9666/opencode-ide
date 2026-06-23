import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { LocationQuery, locationQueryOpenApi, LocationMiddleware } from "./location"

const BlameQuery = Schema.Struct({
  ...LocationQuery.fields,
  file: Schema.String,
})

const BlameEntrySchema = Schema.Struct({
  sha: Schema.String,
  line: Schema.Number,
  originalLine: Schema.Number,
  numLines: Schema.Number,
  author: Schema.String,
  email: Schema.String,
  time: Schema.Number,
  tz: Schema.String,
  summary: Schema.String,
  content: Schema.String,
})

export const GitGroup = HttpApiGroup.make("server.git")
  .add(
    HttpApiEndpoint.get("git.blame", "/api/git/blame", {
      query: BlameQuery,
      success: Schema.Struct({
        location: Schema.Struct({
          directory: Schema.String,
        }),
        data: Schema.Array(BlameEntrySchema),
      }),
    })
      .annotateMerge(locationQueryOpenApi)
      .annotateMerge(
        OpenApi.annotations({
          identifier: "v2.git.blame",
          summary: "Git Blame",
          description: "Get blame information for a file showing who wrote each line.",
        }),
      ),
  )
  .annotateMerge(
    OpenApi.annotations({
      title: "git",
      description: "Git operation routes.",
    }),
  )
  .middleware(LocationMiddleware)
