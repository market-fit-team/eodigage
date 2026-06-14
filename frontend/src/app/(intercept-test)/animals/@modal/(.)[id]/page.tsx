import { notFound } from "next/navigation"
import { AnimalDetailDialog } from "@/app/(intercept-test)/animals/_components/animal-detail"
import { getAnimalById } from "@/app/(intercept-test)/animals/_services/animal-service"

export default async function AnimalDetailModalPage({
  params,
}: PageProps<"/animals/[id]">) {
  const { id } = await params
  const animal = await getAnimalById(id)

  if (!animal) notFound()

  return <AnimalDetailDialog animal={animal} />
}
