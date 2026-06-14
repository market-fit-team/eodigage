import type { Animal } from "@/app/(intercept-test)/animals/_types/animal"
import { ANIMALS } from "@/app/(intercept-test)/animals/animals.data"

const normalize = (value: string) => value.trim().toLowerCase()

export const getAnimals = async (query = ""): Promise<Animal[]> => {
  const keyword = normalize(query)

  if (!keyword) return ANIMALS

  return ANIMALS.filter((animal) => {
    const haystack = [
      animal.name,
      animal.species,
      animal.habitat,
      animal.diet,
      animal.summary,
      ...animal.traits,
    ]
      .join(" ")
      .toLowerCase()

    return haystack.includes(keyword)
  })
}

export const getAnimalById = async (id: string): Promise<Animal | null> => {
  return ANIMALS.find((animal) => animal.id === id) ?? null
}
