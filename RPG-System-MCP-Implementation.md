# RPG 游戏系统 MCP 实现方案

> 版本：1.0.0 | 日期：2025-12-16  
> 目标：通过 MCP 协议解决 LLM 在 RPG 游戏中的数据一致性问题

---

## 1. 问题分析

| 问题类型 | 具体表现 | 根本原因 |
|----------|----------|----------|
| **上下文截断** | 早期玩家数据丢失 | LLM 上下文窗口有限 |
| **数值幻觉** | HP/金币/经验值不一致 | LLM 无法可靠记忆数值 |
| **计算错误** | 伤害、奖励计算不准确 | LLM 数学能力有限 |
| **状态漂移** | 任务进度、NPC关系混乱 | 复杂状态难以追踪 |
| **存档不可靠** | 生成的存档数据不完整 | 无持久化存储 |

---

## 2. 解决方案架构

### 2.1 核心思想

**职责分离**：让 LLM 专注于叙事，将数据管理和计算交给可靠的后端服务。

```
┌─────────────────────────────────────────────────────────────┐
│                        LLM (叙事层)                          │
│   职责：故事描写、NPC对话、场景渲染、战斗叙事、剧情推进       │
│   禁止：数值计算、状态记忆、数据存储                         │
└─────────────────────────────────────────────────────────────┘
                              │
                        MCP Protocol
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (数据层)                       │
│   职责：状态查询、数值计算、状态更新、数据持久化             │
│   技术：Python/Node.js + SQLite/PostgreSQL                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据流向

```
用户输入 → LLM 解析意图 → 调用 MCP 工具获取/计算数据 → LLM 生成叙事 → 输出给用户
                ↓                      ↓
           判断需要什么操作      数据库读写 + 公式计算
```

---

## 3. 数据库设计思路

### 3.1 核心数据表

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `players` | 玩家基础数据 | id, name, level, 属性值, 资源, 位置 |
| `inventory` | 背包物品 | player_id, item_id, quantity, quality |
| `equipment` | 装备栏 | player_id, slot, item_id |
| `player_quests` | 任务进度 | player_id, quest_id, status, objectives_progress(JSON) |
| `player_skills` | 技能数据 | player_id, skill_id, level |
| `player_faction_standing` | 阵营声望 | player_id, faction_id, reputation_value |
| `player_npc_relations` | NPC关系 | player_id, npc_id, affection, loyalty, trust |
| `player_companions` | 同伴队伍 | player_id, npc_id, is_active |
| `npcs` | NPC状态 | id, name, location, is_alive, goals(JSON) |
| `factions` | 阵营数据 | id, name, resources, territory(JSON) |
| `world_state` | 世界状态 | game_time, weather, active_events(JSON) |
| `saves` | 存档 | id, player_id, snapshot(JSON), timestamp |

### 3.2 设计原则

1. **玩家数据分离**：基础属性、背包、任务、关系分表存储
2. **JSON 存储复杂结构**：目标进度、阵营目标等用 JSON 字段
3. **关系表处理多对多**：玩家-NPC、玩家-阵营、NPC-NPC 关系
4. **快照式存档**：存档时序列化完整状态为 JSON

---

## 4. MCP 工具设计

### 4.1 工具分类

| 类别 | 工具数量 | 核心原则 |
|------|----------|----------|
| **状态查询** | ~10个 | 每次对话开始必须调用，获取最新状态 |
| **数值计算** | ~8个 | 所有数学运算由代码执行，LLM不计算 |
| **状态更新** | ~15个 | 所有状态变更通过工具完成，LLM不修改 |
| **存档管理** | 3个 | 真正的持久化存储 |
| **世界演化** | ~4个 | 时间推进、事件触发 |

### 4.2 核心工具清单

#### 状态查询类
```
get_player_status      - 获取玩家完整状态（必须在对话开始时调用）
get_inventory          - 获取背包物品
get_active_quests      - 获取进行中的任务
get_faction_standings  - 获取阵营声望
get_companions         - 获取同伴列表
get_npc_info           - 获取NPC详情
get_world_state        - 获取世界状态（时间、天气、事件）
```

#### 数值计算类
```
calculate_damage       - 计算战斗伤害（返回详细分解）
calculate_exp_reward   - 计算经验奖励（含加成）
calculate_loot_drops   - 计算掉落物品
calculate_craft_result - 计算制作结果（成功率、品质）
calculate_reputation_change - 计算声望变化
```

#### 状态更新类
```
apply_damage           - 应用伤害到目标
heal_target            - 治疗目标
add_experience         - 添加经验（自动处理升级）
modify_inventory       - 添加/移除/使用物品
equip_item             - 装备/卸下物品
accept_quest           - 接受任务
update_quest_progress  - 更新任务进度
complete_quest         - 完成任务并发放奖励
update_reputation      - 更新阵营声望
update_npc_relation    - 更新NPC关系
recruit_companion      - 招募同伴
execute_craft          - 执行制作
allocate_stat_points   - 分配属性点
```

#### 存档与世界类
```
save_game              - 保存游戏
load_game              - 加载存档
list_saves             - 列出存档
advance_time           - 推进时间（触发世界演化）
```

### 4.3 工具设计原则

1. **查询与更新分离**：先 `calculate_*` 计算，再 `apply_*` 应用
2. **返回详细信息**：便于 LLM 生成丰富叙事
3. **自动处理连锁**：如 `add_experience` 自动处理升级、属性点获取
4. **错误信息友好**：返回结构化错误，便于 LLM 解释给玩家

---

## 5. 游戏逻辑实现思路

### 5.1 核心公式（代码实现）

| 公式 | 说明 | 实现要点 |
|------|------|----------|
| **派生属性** | HP = VIT×10 + Level×5 | 装备和 buff 加成需叠加 |
| **伤害计算** | 基础伤害 - 防御减免 × 暴击 × 元素 | 包含随机浮动 ±10% |
| **经验奖励** | 基础 × 等级修正 × 加成系数 | 等级差影响收益 |
| **制作成功率** | 基础率 + 工具加成 + 工作台加成 | 上下限 5%-98% |
| **制作品质** | 骰点 + 熟练度 + 材料 + 工具 | 分档判定品质等级 |
| **声望变化** | 基础值 × 行为系数 × 阵营关系修正 | 敌对阵营联动 |

### 5.2 关键游戏逻辑

#### 战斗流程
```
1. LLM 解析玩家战斗意图
2. 调用 calculate_damage() 获取伤害数值
3. 调用 apply_damage() 应用伤害
4. 如果击杀：调用 calculate_loot_drops() + calculate_exp_reward()
5. 调用 modify_inventory() 添加战利品
6. 调用 add_experience() 添加经验
7. LLM 根据返回数据生成战斗叙事
```

#### 任务完成流程
```
1. 检测任务目标是否全部完成
2. 调用 complete_quest()
   → 自动发放经验、金币、物品
   → 自动更新声望
   → 自动检查升级
3. 返回所有奖励详情
4. LLM 生成任务完成叙事
```

#### 时间推进流程
```
1. 调用 advance_time(duration)
2. 服务端处理：
   - 更新游戏时间/日期
   - 触发 NPC 自主行为
   - 演化阵营关系
   - 处理关系衰减
   - 检查时间相关事件
3. 返回世界变化摘要
4. LLM 生成时间流逝叙事
```

### 5.3 世界演化机制

| 机制 | 触发条件 | 处理内容 |
|------|----------|----------|
| **NPC 自主行为** | 时间推进 | 根据目标优先级执行行动 |
| **阵营势力变化** | 每周期计算 | 资源增减、领土变化 |
| **关系自然演化** | 时间推进 | 价值观相近+2/冲突-2 |
| **关系衰减** | 长期不互动 | 中立以上每30天-50点 |
| **随机事件** | 概率触发 | 战争、灾难、机遇等 |

---

## 6. System Prompt 修改方案

### 6.1 需要删除的内容

- ❌ 详细的 JSON Schema 定义（移至数据库）
- ❌ 复杂的计算公式（移至代码）
- ❌ 玩家数据模板（从工具获取）

### 6.2 需要保留的内容

- ✅ 系统身份定义和性格
- ✅ 交互界面模板（输出格式）
- ✅ 行为规则和触发条件
- ✅ 语言风格指南

### 6.3 需要新增的内容

```xml
<mcp_integration>
  <principle>
    所有数据操作必须通过 MCP 工具完成，禁止自行假设或记忆数值
  </principle>

  <workflow>
    <step order="1">对话开始时，必须调用 get_player_status() 获取最新状态</step>
    <step order="2">根据玩家动作，调用相应的计算工具获取结果</step>
    <step order="3">调用更新工具应用状态变化</step>
    <step order="4">基于工具返回的数据生成叙事描写</step>
    <step order="5">在回复中准确展示数值变化</step>
  </workflow>

  <tool_usage_rules>
    <rule>战斗伤害：先 calculate_damage() 再 apply_damage()</rule>
    <rule>获得物品：直接调用 modify_inventory(operation="add")</rule>
    <rule>完成任务：调用 complete_quest()，奖励自动发放</rule>
    <rule>时间流逝：调用 advance_time()，返回世界变化</rule>
    <rule>存档操作：玩家说"存档"时调用 save_game()</rule>
  </tool_usage_rules>

  <forbidden>
    <item>禁止自行计算任何数值（伤害、经验、掉落等）</item>
    <item>禁止假设玩家当前状态，必须从工具获取</item>
    <item>禁止在回复中编造未经工具确认的数据</item>
  </forbidden>
</mcp_integration>
```

---

## 7. 工作流程示例

### 7.1 战斗场景

```
用户: 我用火球术攻击哥布林

系统内部流程:
1. get_player_status() → 获取玩家MP、属性
2. calculate_damage(attacker=player, defender=goblin, skill=fireball)
   → 返回 {base_damage: 45, is_critical: true, final_damage: 68}
3. apply_damage(target=goblin, damage=68)
   → 返回 {hp_after: 0, is_dead: true}
4. calculate_loot_drops(enemy=goblin)
   → 返回 {gold: 15, items: [{id: "goblin_ear", qty: 1}]}
5. calculate_exp_reward(source=goblin)
   → 返回 {final_exp: 35, will_level_up: false}
6. modify_inventory(add, goblin_ear)
7. add_experience(35)

LLM 输出:
【战斗】你吟唱咒语，一颗炽热的火球呼啸而出！
暴击！哥布林受到 68 点火焰伤害，化为灰烬。

【战利品】
金币 +15
哥布林耳朵 ×1

【经验】+35 (125/200)
```

### 7.2 时间推进场景

```
用户: /wait 7d

系统内部流程:
1. advance_time(duration="7d", activity="wait")
   → 返回 {
       time_passed: "7天",
       world_changes: [
         {type: "faction_war", desc: "帝国与叛军爆发边境冲突"},
         {type: "npc_event", desc: "铁匠汤姆完成了他的杰作"}
       ],
       npc_events: [...],
       expired_quests: ["Q-NPC-000012"]
     }

LLM 输出:
【时间流逝】7天过去了...

【世界动态】
◆ 帝国与叛军在北境爆发激烈冲突，战火蔓延
◆ 铁匠汤姆完成了他筹备已久的杰作

【任务过期】
◆ "护送商队" 任务已过期

◇ 世界在你不知不觉中发生着变化...
```

---

## 8. 项目结构建议

```
rpg-mcp-server/
├── pyproject.toml          # 项目配置
├── src/
│   └── rpg_mcp_server/
│       ├── server.py       # MCP 服务器入口
│       ├── database.py     # 数据库操作封装
│       ├── tools/          # MCP 工具实现
│       │   ├── query.py    # 查询工具
│       │   ├── calculate.py # 计算工具
│       │   ├── update.py   # 更新工具
│       │   └── world.py    # 世界演化工具
│       ├── logic/          # 游戏逻辑
│       │   ├── combat.py   # 战斗系统
│       │   ├── crafting.py # 制作系统
│       │   └── progression.py # 成长系统
│       └── utils/
│           ├── formulas.py # 游戏公式
│           └── constants.py # 常量定义
├── data/
│   ├── schema.sql          # 数据库结构
│   └── seed_data.sql       # 种子数据
└── prompts/
    └── system_prompt.xml   # 修改后的系统提示词
```

---

## 9. 部署方案

### 9.1 本地开发

```bash
# 1. 创建项目
uv init rpg-mcp-server
cd rpg-mcp-server

# 2. 安装依赖
uv add mcp aiosqlite pydantic

# 3. 初始化数据库
sqlite3 data/game.db < data/schema.sql

# 4. 运行服务器
uv run rpg-mcp-server
```

### 9.2 Claude Desktop 配置

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "rpg-game": {
      "command": "uv",
      "args": ["--directory", "/path/to/rpg-mcp-server", "run", "rpg-mcp-server"],
      "env": {
        "DATABASE_PATH": "/path/to/game.db"
      }
    }
  }
}
```

### 9.3 生产环境

| 组件 | 推荐方案 |
|------|----------|
| 数据库 | PostgreSQL + 连接池 |
| 部署 | Docker 容器化 |
| 传输 | SSE (Server-Sent Events) |
| 多用户 | player_id 区分不同玩家 |

---

## 10. 扩展方向

| 方向 | 说明 |
|------|------|
| **多人支持** | 通过 player_id 区分，支持多玩家同时游戏 |
| **前端可视化** | 开发 Web UI 展示状态面板、地图、背包 |
| **AI NPC** | NPC 对话接入独立 LLM，增强交互深度 |
| **事件系统** | 完善随机事件、剧情触发机制 |
| **战斗系统** | 增加回合制/实时战斗详细规则 |
| **成就系统** | 行为追踪和成就解锁 |

---

## 11. 总结

### 核心价值

| 方面 | 原方案问题 | MCP 方案优势 |
|------|-----------|--------------|
| **数据一致性** | LLM 会遗忘/编造 | 数据库持久存储，100%准确 |
| **数值计算** | LLM 算错概率高 | 代码计算，完全可靠 |
| **存档功能** | 不可靠的文本存档 | 真正的数据库快照 |
| **世界演化** | 难以追踪复杂状态 | 服务端统一管理 |
| **可扩展性** | 全靠 Prompt 堆砌 | 模块化代码，易扩展 |

### 实施步骤

1. **第一阶段**：实现核心查询/更新工具 + 基础数据库
2. **第二阶段**：完善计算工具 + 游戏公式
3. **第三阶段**：实现世界演化 + 时间系统
4. **第四阶段**：优化 Prompt + 测试调优

---

**文档结束**

