import Parallel from "parallel-web";
import type { Source } from "./types";

type ParallelResult = { title?: string; url?: string; excerpts?: string[] };
type ParallelSearchResponse = { results?: ParallelResult[] };

export interface ResearchResult {
  summary: string;
  sources: Source[];
}

/** Live Partner integration: the official Parallel SDK calls Search at request time. */
export async function searchProductionContext(objective: string): Promise<ResearchResult> {
  const apiKey = process.env.PARALLEL_API_KEY;
  if (!apiKey) throw new Error("PARALLEL_API_KEY is not configured");

  const client = new Parallel({ apiKey });
  const response = await client.beta.search({
    objective,
    search_queries: [objective],
    max_results: 8
  }) as ParallelSearchResponse;

  const sources = (response.results ?? [])
    .filter((item): item is ParallelResult & { url: string } => Boolean(item.url))
    .map((item) => ({
      title: item.title || new URL(item.url).hostname,
      url: item.url,
      excerpt: item.excerpts?.join(" ").slice(0, 600)
    }));

  if (!sources.length) return { summary: "Parallel returned no relevant public-web results.", sources: [] };
  return {
    summary: sources.map((source, index) => "[" + (index + 1) + "] " + source.title + ": " + (source.excerpt ?? "")).join("\n"),
    sources
  };
}
