# aseprite-builder
Build Aseprite using Github action

# What should you do?
- fork this repo
- **enable workflow `Build and release Aseprite` in `Actions -- Workflows`**
- click `Action > Build and release Aseprite > run workflow` as the figure shows
  ![trigger the workflow](https://github.com/user-attachments/assets/5174f407-4daf-4e28-996e-5efb4f8751cb)
  
- now you should see the building process via `Actions` and you can find the product in `Release`

accroding to [Eula](https://github.com/aseprite/aseprite/blob/main/EULA.txt) :

> (b) Distribution.
> 
> You may not distribute copies of the SOFTWARE PRODUCT to third parties. Evaluation versions available for download from the Licensor's websites may be freely distributed.

we need to remove the product in `Releases` .

## Calibre 漫画前端

仓库新增了一个纯静态的前端（`web/` 目录），用于把 Calibre 里的漫画元数据（示例：`I:\Marvel comic\data` 与 `I:\Marvel comic\comics`）可视化为可搜索、可筛选的网页。页面支持：

- 根据标题 / 作者 / 系列进行搜索，并按标签、出版社过滤。
- 查看统计数据（漫画数量、系列数量、最近导入时间）。
- 打开详情抽屉，在 Calibre 中打开书目（`calibre://view-book/<id>`）或跳转到本地 `comics` 目录。

### 准备 Calibre 数据

1. 安装 calibre 命令行工具（已包含在 Calibre 安装目录）。
2. 运行以下命令，把图书目录导出为 JSON：

   ```powershell
   calibredb list \
     --library-path "I:\Marvel comic\comics" \
     --fields title,series,series_index,authors,publisher,pubdate,timestamp,tags,formats,comments,identifiers \
     --for-machine > web/data/catalog.json
   ```

   - 如果需要封面链接，可以加上 `--search "cover:true"` 然后用 [calibredb show_metadata](https://manual.calibre-ebook.com/generated/en/calibredb.html#show-metadata) 或 Calibre 内容服务器提供的 URL，填到 `cover` 字段。
   - `identifiers` 字段会作为 `calibre_id`，供网页通过 `calibre://` 协议唤起本地 Calibre 阅读。

3. 将 `catalog.json` 放在 `web/data/` 目录下，刷新网页即可看到真实数据。

### 本地预览

```bash
cd web
python -m http.server 4173
# 或使用任意静态服务器，如 `npx serve .`
```

然后访问 `http://localhost:4173`，即可看到示例 UI。若 `web/data/catalog.json` 不存在，会自动加载 `sample_catalog.json` 方便预览。

### Windows / 新手快速指引

1. **准备运行环境**
   - 如果尚未安装 Python，可以到 [python.org](https://www.python.org/downloads/windows/) 下载 Windows 版，安装时勾选 “Add python.exe to PATH”。
   - 也可以安装 Node.js，然后使用 `npx serve` 等静态服务器，效果相同。
2. **确认仓库路径在哪里**
   - 如果你是用 GitHub Desktop、Sourcetree 等工具克隆的仓库，可以在工具里右键仓库选择“在资源管理器中打开”，窗口地址栏里显示的 `D:\\...` 就是仓库路径。
   - 也可以在资源管理器中找到仓库文件夹，点击地址栏复制完整路径（如 `D:\\Projects\\aseprite-builder`）。
   - 已经打开命令行的话，输入 `pwd`（PowerShell）或 `cd`（cmd）就会打印当前路径；若看到的不是仓库目录，继续使用 `cd` 切换即可。
3. **打开命令行并切换目录**
   - 按 `Win + R`，输入 `cmd`（或 `powershell`）并回车。
   - 运行 `cd <你的仓库路径>\\web`。例如仓库在 `D:\\Projects\\aseprite-builder`，命令就是 `cd D:\\Projects\\aseprite-builder\\web`。
4. **启动本地服务器**
   - 运行 `python -m http.server 4173`（或 `npx serve -l 4173`）。
   - 终端会显示 `Serving HTTP on :: port 4173` 之类的提示，保持该窗口不要关闭。
5. **在浏览器打开页面**
   - 访问 `http://localhost:4173` 即可看到示例漫画站。
   - 如果已经根据前文导出了 `web/data/catalog.json`，刷新页面后就会加载你自己的 Calibre 书库；没有的话则继续使用 `sample_catalog.json` 里的示例数据。

> 提示：若你只想快速预览，可以直接双击 `web/index.html` 用浏览器打开。但由于浏览器的同源策略，部分功能（如从 `data/` 目录加载 JSON）会被禁用，所以还是推荐按照以上步骤启动一个本地服务器。
