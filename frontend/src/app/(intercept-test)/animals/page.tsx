import { AnimalsShell } from "@/app/(intercept-test)/animals/_components/animals-shell"
import { getAnimals } from "@/app/(intercept-test)/animals/_services/animal-service"
import { z } from "zod"

const AnimalsSearchParamsSchema = z.object({
  q: z.preprocess(
    (value) => (Array.isArray(value) ? (value[0] ?? "") : value),
    z.string().trim().default("")
  ),
})

export default async function AnimalsPage({
  searchParams,
}: PageProps<"/animals">) {
  const rawSearchParams = (await searchParams) ?? {}
  const parsedSearchParams =
    AnimalsSearchParamsSchema.safeParse(rawSearchParams)
  const q = parsedSearchParams.success ? parsedSearchParams.data.q : ""
  const animals = await getAnimals(q)

  return <AnimalsShell animals={animals} query={q} />
}
