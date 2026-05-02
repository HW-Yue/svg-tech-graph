# SVG Tech Graph - Scripts

这些脚本用于稳定生成、验证并导出使用内建默认视觉系统的技术图。

## 脚本列表

### 1. `validate-svg.sh`

验证 SVG 语法并输出详细错误信息。

```bash
./validate-svg.sh <svg-file>
```

### 2. `generate-diagram.sh`

对现有 SVG 执行验证，并导出 PNG。

```bash
./generate-diagram.sh -t architecture -o ./output/arch.svg
```

说明：

- 内建默认视觉系统始终生效
- 旧的 `-s/--style` 参数仅为兼容保留并会被忽略
- 这个脚本不负责生成 SVG 内容，只负责验证和导出

### 3. `generate-from-template.py`

基于 JSON 结构和内建默认视觉系统生成 SVG。

```bash
python3 ./generate-from-template.py architecture ./output/arch.svg '{
  "title": "My Diagram",
  "containers": [],
  "nodes": [],
  "arrows": []
}'
```

支持的一些关键字段：

- `containers`
- `containers[].header_prefix`
- `containers[].header_text`
- `containers[].side_label`
- `nodes[].kind`
- `arrows[].flow`
- `source_port` / `target_port`
- `route_points`
- `style_overrides`

### 4. `test-default-visual-system.sh`

运行 Claude 风格回归测试。

```bash
./test-default-visual-system.sh
```

说明：

- 实际只测试内建默认视觉系统
- 会渲染 `fixtures/system-architecture-default.json`
- 会验证 SVG 并尝试导出 PNG 到 `test-output/`

## 依赖

- `rsvg-convert`
- `grep`
- `sed`
- `awk`
- `python3`

安装 `rsvg-convert`：

```bash
brew install librsvg
```

## 目录结构

```text
scripts/
├── README.md
├── generate-diagram.sh
├── generate-from-template.py
├── test-default-visual-system.sh
└── validate-svg.sh
```
