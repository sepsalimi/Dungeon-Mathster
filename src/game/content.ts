import type { DoorChoice, EnemyState, ShopUpgrade } from "./types";

export const MONSTER_REWARD = 18;
export const BOSS_REWARD = 50;
export const MONSTER_ROOMS_BEFORE_BOSS = 3;

const monsterNames = ["Moss Gnawer", "Cinder Imp", "Bone Wisp", "Slime Knight"];

export const shopUpgrades: ShopUpgrade[] = [
  {
    id: "heal",
    name: "Heal HP",
    description: "Restore 35 HP now.",
    cost: 15,
  },
  {
    id: "maxHp",
    name: "Increase Max HP",
    description: "Gain 20 max HP and heal 20.",
    cost: 30,
  },
  {
    id: "armor",
    name: "Armor",
    description: "Reduce monster attacks by 1.",
    cost: 25,
  },
  {
    id: "freeze",
    name: "Freeze",
    description: "Stop attacks for 10 seconds next room.",
    cost: 20,
  },
  {
    id: "sword",
    name: "Sword Upgrade",
    description: "Deal 1 extra damage per correct answer.",
    cost: 35,
  },
];

export function makeEnemy(isBoss: boolean): EnemyState {
  if (isBoss) {
    return {
      name: "Count Calculus",
      hp: 6,
      maxHp: 6,
      damage: 5,
      isBoss: true,
    };
  }

  return {
    name: monsterNames[Math.floor(Math.random() * monsterNames.length)],
    hp: 3,
    maxHp: 3,
    damage: 5,
    isBoss: false,
  };
}

export function makeDoorChoices(roomsCleared: number): DoorChoice[] {
  if (roomsCleared >= MONSTER_ROOMS_BEFORE_BOSS) {
    return [
      {
        id: "left-boss",
        kind: "boss",
        label: "Boss Gate",
        icon: "skull",
        tone: "danger",
      },
      {
        id: "right-boss",
        kind: "boss",
        label: "Boss Gate",
        icon: "crown",
        tone: "danger",
      },
    ];
  }

  const usefulDoor: DoorChoice =
    roomsCleared < 2 || Math.random() > 0.35
      ? {
          id: "useful-shop",
          kind: "shop",
          label: "Torch Shop",
          icon: "shop",
          tone: "safe",
        }
      : {
          id: "useful-mystery",
          kind: "mystery",
          label: "Mystery",
          icon: "spark",
          tone: "rare",
        };

  const fightDoor: DoorChoice = {
    id: "fight-monster",
    kind: "monster",
    label: "Monster",
    icon: "claw",
    tone: "danger",
  };

  return Math.random() > 0.5 ? [usefulDoor, fightDoor] : [fightDoor, usefulDoor];
}
