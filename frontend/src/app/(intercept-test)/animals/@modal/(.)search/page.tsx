import { SearchSheet } from "@/app/(intercept-test)/animals/_components/search-panel"
import { z } from "zod"

const AnimalsSearchParamsSchema = z.object({
  q: z.preprocess(
    (value) => (Array.isArray(value) ? (value[0] ?? "") : value),
    z.string().trim().default("")
  ),
})

export default async function AnimalSearchModalPage({
  searchParams,
}: PageProps<"/animals/search">) {
  const rawSearchParams = (await searchParams) ?? {}
  const parsedSearchParams =
    AnimalsSearchParamsSchema.safeParse(rawSearchParams)
  const q = parsedSearchParams.success ? parsedSearchParams.data.q : ""

  return <SearchSheet initialQuery={q} />
}
