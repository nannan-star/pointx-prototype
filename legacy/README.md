# 启动静态原型

在**仓库根目录**（`pointx-prototype/`，与 `legacy` 文件夹同级）执行：

```bash
python3 -m http.server 8765 --directory legacy
```

若你当前终端已在 **`legacy/` 目录内**，不要用 `--directory legacy`，应直接：

```bash
python3 -m http.server 8765
```

浏览器打开：<http://localhost:8765/>

---

**若提示 `Address already in use`：** 8765 已被占用，换一个端口即可，例如：

```bash
python3 -m http.server 8877 --directory legacy
```

或在占用端口的终端里用 `Ctrl+C` 结束旧进程后再启动。

---

**备选（需在仓库根目录）：**

```bash
npx --yes serve legacy -l 8765
```
