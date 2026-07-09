import type { BargainOption, DoorChoice, EnemyState, ShopUpgrade } from "./types";
import { getBossDefinition } from "./progression";

export const MONSTER_REWARD = 18;
export const MONSTER_ROOMS_BEFORE_BOSS = 3;

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

export const shopUpgrades: ShopUpgrade[] = [
  { id: "heal", name: "Heal HP", description: "Restore 35 HP now.", cost: 15 },
  { id: "maxHp", name: "Increase Max HP", description: "Gain 20 max HP and heal 20.", cost: 30 },
  { id: "damageReductionArmor", name: "Damage Reduction Armor", description: "Reduce monster attacks by 1.", cost: 30 },
  { id: "temporaryArmor", name: "Armor", description: "Gain 25 temporary HP.", cost: 20 },
  { id: "barbedArmor", name: "Barbed Armor", description: "Deal 1 damage when enemies hit you.", cost: 30 },
  { id: "sword", name: "Sword Upgrade", description: "Deal 1 extra damage per correct answer.", cost: 35 },
];

export const bargainOptions: BargainOption[] = [
  {
    id: "oracleLens",
    name: "Oracle Lens",
    upside: "Sometimes the first number in an answer glows.",
    downside: "Lose 20 max HP permanently.",
  },
  {
    id: "negativeHeart",
    name: "Negative Heart",
    upside: "Gain 30 max HP and heal 30.",
    downside: "Negative numbers enter the grid.",
  },
  {
    id: "glassBlade",
    name: "Glass Blade",
    upside: "Double your sword damage.",
    downside: "Your max HP is halved.",
  },
  {
    id: "coinHex",
    name: "Coin Hex",
    upside: "Heads: gain 1 sword damage.",
    downside: "Tails: monsters deal 2 extra damage.",
  },
];

export function makeEnemy(isBoss: boolean, floor: number): EnemyState {
  if (isBoss) {
    const boss = getBossDefinition(floor);
    return { name: boss.name, hp: boss.hp, maxHp: boss.hp, damage: boss.damage, isBoss: true };
  }

  const hp = 2 + floor * 3 + Math.floor(floor ** 1.45);
  const damage = 4 + floor * 2;

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
