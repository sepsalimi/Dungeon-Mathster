// Enemy stat curves, room rewards, and door choice generation.
import type { DoorChoice, EnemyState } from "./types";
import { getBossDefinition } from "./progression";

export const MONSTER_REWARD = 18;
export const MONSTER_ROOMS_BEFORE_BOSS = 3;
export const MYSTERY_HEAL = 25;
export const MYSTERY_GOLD = 10;

const monsterNames = [
  "Moss Gnawer",
  "Cinder Imp",
  "Bone Wisp",
  "Slime Knight",
  "Minus Mite",
  "Product Bat",
  "Order Imp",
  "Royal Remainder",
];

export function makeEnemy(isBoss: boolean, floor: number): EnemyState {
  if (isBoss) {
    const boss = getBossDefinition(floor);
    return { name: boss.name, hp: boss.hp, maxHp: boss.hp, damage: boss.damage, isBoss: true };
  }

  // Tuned so a fresh sword (2 damage) kills a floor 1 monster in 3 solves.
  // Damage stays gentle early; the shrinking attack timer does the late scaling.
  const hp = 4 + floor * 2;
  const damage = 2 + floor;

  return {
    name: monsterNames[Math.floor(Math.random() * monsterNames.length)],
    hp,
    maxHp: hp,
    damage,
    isBoss: false,
  };
}

export function makeDoorChoices(roomsCleared: number): DoorChoice[] {
  if (roomsCleared >= MONSTER_ROOMS_BEFORE_BOSS) {
    return [{ id: "boss-gate", kind: "boss", label: "Boss Gate", icon: "crown", tone: "danger" }];
  }

  const usefulDoor: DoorChoice = pickUsefulDoor(roomsCleared);
  const fightDoor: DoorChoice = {
    id: "fight-monster",
    kind: "monster",
    label: "Monster",
    icon: "claw",
    tone: "danger",
  };

  return Math.random() > 0.5 ? [usefulDoor, fightDoor] : [fightDoor, usefulDoor];
}

function pickUsefulDoor(roomsCleared: number): DoorChoice {
  if (roomsCleared >= 1 && Math.random() < 0.45) {
    return {
      id: "cursed-bargain",
      kind: "bargain",
      label: "Bargain",
      icon: "curse",
      tone: "rare",
    };
  }

  if (roomsCleared < 2 || Math.random() > 0.35) {
    return {
      id: "useful-shop",
      kind: "shop",
      label: "Torch Shop",
      icon: "shop",
      tone: "safe",
    };
  }

  return {
    id: "useful-mystery",
    kind: "mystery",
    label: "Mystery",
    icon: "spark",
    tone: "rare",
  };
}
