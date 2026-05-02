# SVG Tech Graph

`svg-tech-graph` 用来把自然语言描述转换成高质量技术图，输出 SVG，并通过 `rsvg-convert` 导出高清 PNG。

这个版本只保留一套内建视觉系统。这样做的目标不是追求风格数量，而是让产出更统一、更稳、更容易维护。

![Default Visual System](assets/samples/sample-default-visual-system.png)

## 支持的图表类型

- 架构图
- 数据流图
- 流程图
- 时序图
- Agent / Memory 架构图
- 对比矩阵
- 时间线
- 思维导图
- UML 类图 / 用例图 / 状态机图
- ER 图
- 网络拓扑图

## 安装

```bash
npx skills add HW-Yue/svg-tech-graph
```

更新：

```bash
npx skills add HW-Yue/svg-tech-graph --force -g -y
```

## 视觉风格

当前只保留：

- **默认视觉系统**
- 暖奶油色背景：`#f8f6f3`
- 克制的中性色和强调色
- 左对齐标题体系
- 适合文档与演示场景

参考文件：

```text
references/default-visual-system.md
```

## 示例 Prompt

```text
画一张使用默认视觉系统的系统架构图。
```

```text
生成一张带读写路径区分的 Mem0 记忆架构图。
```

```text
可视化一个包含 planner、tools、memory 和 response 的 agent tool-calling loop。
```

## 辅助脚本

### 验证 SVG

```bash
./scripts/validate-svg.sh ./output/diagram.svg
```

### 把现有 SVG 导出为 PNG

```bash
./scripts/generate-diagram.sh -t architecture -o ./output/arch.svg
```

### 基于 JSON 结构生成 SVG

```bash
python3 ./scripts/generate-from-template.py architecture ./output/arch.svg '{
  "title": "System Architecture",
  "containers": [],
  "nodes": [],
  "arrows": []
}'
```

### 运行回归测试

```bash
./scripts/test-default-visual-system.sh
```

这个回归脚本现在只测试内建默认视觉系统的样例。

## 项目结构

```text
svg-tech-graph/
├── SKILL.md
├── README.md
├── README.zh.md
├── references/
│   ├── icons.md
│   ├── default-visual-system.md
│   └── svg-layout-best-practices.md
├── fixtures/
│   └── system-architecture-default.json
├── scripts/
│   ├── README.md
│   ├── generate-diagram.sh
│   ├── generate-from-template.py
│   ├── test-default-visual-system.sh
│   └── validate-svg.sh
├── templates/
└── assets/
    └── samples/
        └── sample-default-visual-system.png
```

## 说明

- `generate-from-template.py` 始终使用内建默认视觉系统
- `generate-diagram.sh` 不再依赖 style 选择；旧的 `-s/--style` 仅为兼容保留并会被忽略
- 多风格参考矩阵已经移除
