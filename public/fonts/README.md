# PDF 中文字体

Noto Sans SC Regular / Bold，源自 Noto CJK Sans 2.004，SIL Open Font License 1.1。

源文件：
- https://github.com/notofonts/noto-cjk/blob/Sans2.004/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf
- https://github.com/notofonts/noto-cjk/blob/Sans2.004/Sans/SubsetOTF/SC/NotoSansSC-Bold.otf
- https://github.com/notofonts/noto-cjk/blob/Sans2.004/LICENSE

通过 fontTools 保留原字体全部 Unicode 映射，去除 hinting 并转为 WOFF2。仅压缩字体以减小下载体积，没有按示例报告裁剪中文字符。完整许可见同目录 OFL.txt。

字体随网站发布，通过同源路径加载；仅在用户导出 PDF 时请求，不访问第三方字体服务。PDF 内嵌实际使用的字形子集，离线阅读不依赖系统安装中文字体。
