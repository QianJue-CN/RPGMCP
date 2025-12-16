// RPG游戏核心公式

/**
 * 计算派生属性：最大HP
 */
export function calculateMaxHP(vitality: number, level: number, bonuses: number = 0): number {
  return vitality * 10 + level * 5 + bonuses;
}

/**
 * 计算派生属性：最大MP
 */
export function calculateMaxMP(intelligence: number, level: number, bonuses: number = 0): number {
  return intelligence * 5 + level * 3 + bonuses;
}

/**
 * 计算物理攻击力
 */
export function calculatePhysicalAttack(strength: number, weaponDamage: number = 0): number {
  return Math.floor(strength * 1.5 + weaponDamage);
}

/**
 * 计算魔法攻击力
 */
export function calculateMagicAttack(intelligence: number, weaponDamage: number = 0): number {
  return Math.floor(intelligence * 2 + weaponDamage);
}

/**
 * 计算物理防御
 */
export function calculatePhysicalDefense(vitality: number, armorDefense: number = 0): number {
  return Math.floor(vitality * 0.8 + armorDefense);
}

/**
 * 计算魔法防御
 */
export function calculateMagicDefense(intelligence: number, armorDefense: number = 0): number {
  return Math.floor(intelligence * 0.6 + armorDefense);
}

/**
 * 计算暴击率
 */
export function calculateCriticalRate(luck: number, bonuses: number = 0): number {
  const baseRate = 5; // 基础5%
  const luckBonus = luck * 0.5; // 每点幸运+0.5%
  return Math.min(baseRate + luckBonus + bonuses, 100); // 最高100%
}

/**
 * 计算闪避率
 */
export function calculateEvasionRate(agility: number, bonuses: number = 0): number {
  const baseRate = 5; // 基础5%
  const agilityBonus = agility * 0.4; // 每点敏捷+0.4%
  return Math.min(baseRate + agilityBonus + bonuses, 75); // 最高75%
}

/**
 * 计算伤害
 * @param baseDamage 基础伤害
 * @param defense 防御力
 * @param isCritical 是否暴击
 * @param elementalMultiplier 元素倍率（默认1.0）
 * @returns 最终伤害
 */
export function calculateDamage(
  baseDamage: number,
  defense: number,
  isCritical: boolean = false,
  elementalMultiplier: number = 1.0
): number {
  // 防御减免：防御力减少伤害，但至少造成10%伤害
  const defenseReduction = Math.min(defense * 0.5, baseDamage * 0.9);
  let damage = baseDamage - defenseReduction;
  
  // 暴击：2倍伤害
  if (isCritical) {
    damage *= 2;
  }
  
  // 元素倍率
  damage *= elementalMultiplier;
  
  // 随机浮动 ±10%
  const randomFactor = 0.9 + Math.random() * 0.2;
  damage *= randomFactor;
  
  // 至少造成1点伤害
  return Math.max(1, Math.floor(damage));
}

/**
 * 计算经验奖励
 * @param baseExp 基础经验
 * @param playerLevel 玩家等级
 * @param enemyLevel 敌人等级
 * @param bonusMultiplier 加成倍率
 * @returns 最终经验
 */
export function calculateExpReward(
  baseExp: number,
  playerLevel: number,
  enemyLevel: number,
  bonusMultiplier: number = 1.0
): number {
  // 等级差修正
  const levelDiff = enemyLevel - playerLevel;
  let levelModifier = 1.0;
  
  if (levelDiff > 0) {
    // 敌人等级高，额外奖励
    levelModifier = 1.0 + (levelDiff * 0.1);
  } else if (levelDiff < -5) {
    // 敌人等级太低，经验惩罚
    levelModifier = Math.max(0.1, 1.0 + (levelDiff + 5) * 0.1);
  }
  
  return Math.floor(baseExp * levelModifier * bonusMultiplier);
}

/**
 * 计算升级所需经验
 */
export function calculateExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * 计算制作成功率
 * @param baseRate 基础成功率
 * @param skillLevel 技能等级
 * @param toolBonus 工具加成
 * @param workbenchBonus 工作台加成
 * @returns 成功率（5%-98%）
 */
export function calculateCraftSuccessRate(
  baseRate: number,
  skillLevel: number,
  toolBonus: number = 0,
  workbenchBonus: number = 0
): number {
  const skillBonus = skillLevel * 2; // 每级+2%
  const totalRate = baseRate + skillBonus + toolBonus + workbenchBonus;
  return Math.max(5, Math.min(98, totalRate));
}

/**
 * 计算制作品质
 * @param proficiency 熟练度
 * @param materialQuality 材料品质加成
 * @param toolBonus 工具加成
 * @returns 品质等级 (normal, fine, excellent, masterwork, legendary)
 */
export function calculateCraftQuality(
  proficiency: number,
  materialQuality: number = 0,
  toolBonus: number = 0
): string {
  const roll = Math.random() * 100;
  const totalBonus = proficiency + materialQuality + toolBonus;
  
  if (roll + totalBonus >= 95) return 'legendary';
  if (roll + totalBonus >= 80) return 'masterwork';
  if (roll + totalBonus >= 60) return 'excellent';
  if (roll + totalBonus >= 35) return 'fine';
  return 'normal';
}

/**
 * 计算声望变化
 * @param baseValue 基础值
 * @param actionMultiplier 行为系数
 * @param relationshipModifier 关系修正
 * @returns 最终声望变化
 */
export function calculateReputationChange(
  baseValue: number,
  actionMultiplier: number,
  relationshipModifier: number = 1.0
): number {
  return Math.floor(baseValue * actionMultiplier * relationshipModifier);
}

