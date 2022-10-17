
![logo](http://pic.otterdaily.cn:1126/pic/logo.jpg)

> 该插件已经暂停维护。您可以通过Fork代码进行修改。
> 偶尔我也会怀念当年从枝江吹来的夜风。
> 晚安，枝江。

## 1.0 简介

🎉**ASoul_CodeHelper**，一款以提效为主题的VSCode插件，为字节跳动旗下稀土掘金社区2022年春季Hackathon浏览器插件赛道参赛作品，同样是作者本人作为ASoul粉丝的粉丝向作品。

目前包括两块功能：🎈**报错快速搜索（Problem Searcher）**与⏰**代码时长统计（Coding Statistic）**。

- 🎈报错快速搜索提供了一键快捷搜索报错的方式。可自定义配置的搜索方案以及通过附加tag的搜索将使大大减少不必要的查错时间开销。

![gif1](http://pic.otterdaily.cn:1126/pic/example_problemsearcher.gif)

- ⏰代码时长统计将记录你每一日的代码时长，包括语言使用时长统计与开发项目的时长统计。插件同样提供了一个内置的仿Github Calendar的可视化页面，它将与ASoul成员一起记录你过去努力的点滴，并且支持导出统计记录为png、svg等格式的图片与用户自定义视图。

![](http://pic.otterdaily.cn:1126/pic/example_codingstatistic.gif)

目前插件还在缓慢开发中......暂时发布的是preview版本，计划在插件更加稳健时才发布正式版本。如果您有遇到什么问题或有什么好的意见，务必在[Issue](https://github.com/WendaoLee/vscode-asoul_codehelper/issues)（如果可以尽量发Issue提😭我也想过一把项目有人发issue的瘾）或发邮件至leewendao@outlook.com反馈。

> 如果有人用这个插件的话......如果您愿意，务必跟我反馈一下😭不然没动力维护了。

## 2.0 如何使用

安装插件后，默认会启用所有模块。

🎈**报错快速搜索（Problem Searcher）**：当出现报错时，在问题的旁边会出现一个小灯泡（通常是黄色，偶尔会因为其他插件的缘故便为蓝色），点击灯泡即可弹出报错快速搜索的列表。点击即可自动打开浏览器搜索报错。

![](http://pic.otterdaily.cn:1126/pic/1.jpg)

⏰**代码时长统计（Coding Statistic）**：在该模块启用时，它会自动进行数据的统计。其中，左下角的状态栏会出现一个显示你今日代码时长的可点击的条框，默认情况下它十分钟更新一次：

![](http://pic.otterdaily.cn:1126/pic/2.jpg)

点击它即会在VSCode内打开一个可视化界面。

**所有统计数据**存放在本地插件文件夹下的`./data`文件夹。您可以通过`Crtl + Shift + P`（Windows）`Command + Shift + P`(Mac) 快捷键呼出VSCode的命令面板，输入`ASoul_CodeHelper:打开本地数据存储目录` 命令打开插件文件夹:

![](http://pic.otterdaily.cn:1126/pic/3.jpg)

统计数据按照这样的格式存放：

```
data 本地数据存储目录
└── year               名称为某年的文件夹，例如'2022'
	└──xxmonth.json    名称为某月的JSON文件，储存当月记录的数据
```

**数据保存格式**上，出于易于读解与二次使用的目的，插件采用了JSON格式进行保存。一个JSON数据的结构如下：

```
month_file 某月的数据文件
└── date                具体日期，
	├── statistic       总体统计时间。包括当日时间总计与使用语言时间总计。
	|   ├── hours       当日小时数。
	|   ├── minutes     当日分钟数。
	|   ├── seconds     当日秒数。
	|   └── language    语言使用时间总计。
	|       └── languagename    使用语言名称。
	|           ├── hours       该语言在当日的总使用小时数。
	|           ├── minutes     该语言在当日的总使用分钟数。
	|           ├── seconds     该语言在当日的总使用秒数。
	|           └── timeperiod  该语言使用的时间段。它是一个储存时间段的数组。
	└── details          使用的具体细节。
	    └── projectname  使用项目名称。
	        ├── timeperiod 该项目使用的时间段。它是一个储存时间段的数组。
	        └── 与上面statistic段同......
```

即：您可以把单个月份的文件看作一个对象，而每个月份对象中包含着许多个具体日期的对象。

值得一提的是，可视化界面的代码是与插件本身解耦的。如果您对前端有所熟悉，您可以在本地插件文件夹下的`./resources`文件夹中自己修改可视化界面的样式。

## 3.0 TODO

接下来一段时间的计划有：

- [ ] 优化代码。
- [ ] 添加一个公共API，供其他插件使用。
- [ ] 优化报错快速搜索模块，使交互更加友好。

## 4.0 Contribution

任何形式的贡献都是受欢迎的，欢迎提交PR或在issue中给出您的宝贵意见，包括但不限于功能的添加与Bug的反馈。

## 5.0 鸣谢

- Apache Echarts，它的可视化库为不擅前端的我减轻了很多负担。
- A-Soul，她们的直播间是我每回为自己的愚驽与无知痛苦不已时的休息站。

## 6.0 文档

这一部分内容详情见Wiki。

- [本地储存文件说明](https://github.com/WendaoLee/vscode-asoul_codehelper/wiki/%E6%9C%AC%E5%9C%B0%E5%AD%98%E5%82%A8%E6%96%87%E4%BB%B6%E8%AF%B4%E6%98%8E)
- [部分程序设计细节说明](https://github.com/WendaoLee/vscode-asoul_codehelper/wiki/%E9%83%A8%E5%88%86%E8%AE%BE%E8%AE%A1%E8%AF%B4%E6%98%8E)

***

欢迎在Bilibili或抖音上关注@向晚大魔王@贝拉Kira@珈乐Carol@嘉然今天吃什么@乃琳Eileen

关注了她们后，欢迎关注企划官号@A-Soul-Official
