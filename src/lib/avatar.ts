import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";

export function getHumanAvatarSvg(seed: string) {
  return createAvatar(avataaars, {
    seed,
    backgroundColor: ["b6e3f4", "c0aede", "ffd5dc"],
    accessoriesChance: 20,
    facialHairChance: 15,
    topChance: 90,
  }).toString();
}
