Google Analytics 平台会从您的网站和应用中收集数据，生成可为您的业务提供数据洞见的报告。

以下是有关如何在 Google Analytics 中手动添加 Google 代码的说明。如果您使用的是 WordPress、Shopify 或 Wix 等网站开发工具或 CMS，请了解如何[使用网站开发工具或 CMS 添加 Google 代码](https://support.google.com/tagmanager/topic/9578449)。

**注意**：如果您同时使用 Google Ads 和 Google Analytics，则只需在一个平台中设置 Google 代码。您可以在配置 Google 代码设置时将其他产品添加为目标账号。

___

#### 本页内容

-   [开始前须知](https://support.google.com/analytics/answer/15756615?sjid=11487394319505182251-NC#100)
-   [我的 Google 代码 ID 在 Google Analytics 中位于何处？](https://support.google.com/analytics/answer/15756615?sjid=11487394319505182251-NC#101)
-   [在 Google Analytics 中设置 Google 代码的步骤](https://support.google.com/analytics/answer/15756615?sjid=11487394319505182251-NC#102)
-   [后续步骤](https://support.google.com/analytics/answer/15756615?sjid=11487394319505182251-NC#103)

___

## 开始前须知

您必须有权访问网站代码和 Google Analytics 媒体资源。

___

### 我的 Google 代码 ID 在 Google Analytics 中位于何处？

<iframe href="//www.youtube.com/watch?v=pmENn6rrDPs" data-videoid="pmENn6rrDPs" frameborder="0" allowfullscreen="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" title="How to find your Google tag ID and use it for website tracking" width="400" height="230" src="https://www.youtube.com/embed/pmENn6rrDPs?autoplay=0&amp;cc_lang_pref=zh-Hans&amp;cc_load_policy=1&amp;controls=2&amp;rel=0&amp;hl=zh-Hans&amp;enablejsapi=1&amp;origin=https%3A%2F%2Fsupport.google.com&amp;widgetid=1&amp;forigin=https%3A%2F%2Fsupport.google.com%2Fanalytics%2Fanswer%2F15756615%3Fsjid%3D11487394319505182251-NC&amp;aoriginsup=0&amp;vf=1" id="widget2"></iframe>

如需显示您所用语言的字幕，请开启 YouTube 字幕。请选择视频播放器底部的“设置”图标 ![YouTube 设置图标的图片](https://storage.googleapis.com/support-kms-prod/UrHzzlx74G5ig5vYXo9Nk43r7NM5fj72Tbu1)，然后选择“字幕”和您所用的语言。

___

1.  前往 [Google Analytics](https://analytics.google.com/analytics/web/)。
2.  登录您的 [Google 账号](https://support.google.com/accounts/answer/27441)。
3.  在[**管理**](https://support.google.com/analytics/answer/6132368)界面中，选择“数据收集和修改”下方的[**数据流**](https://analytics.google.com/analytics/web/#/?pagename=admin-streams&utm_source=gahc&utm_medium=dlinks)。
    -   **注意**：上一个链接会打开您上次访问的 Google Analytics 媒体资源。您可以使用媒体资源选择器来[更改媒体资源](https://support.google.com/analytics/answer/12813202)。您必须在媒体资源一级具有[编辑者或更高级别的角色](https://support.google.com/analytics/answer/9305587)，才能打开 Google 代码设置。
4.  选择要修改的[数据流](https://support.google.com/analytics/answer/9355659)。
5.  在“Google 代码”下，点击**配置代码设置**。
6.  在“您的 Google 代码”下，点击相应的 Google 代码。
7.  在“代码详情”下，复制该 Google 代码 ID。

___

## 在 Google Analytics 中设置 Google 代码的步骤

1.  登录 [Google Analytics 账号](https://analytics.google.com/analytics/web/)。
2.  在[**管理**](https://support.google.com/analytics/answer/6132368)界面中，选择“数据收集和修改”下方的[**数据流**](https://analytics.google.com/analytics/web/#/?pagename=admin-streams&utm_source=gahc&utm_medium=dlinks)。
    -   **注意**：上一个链接会打开您上次访问的 Google Analytics 媒体资源。您必须登录 Google 账号才能打开媒体资源。您可以使用媒体资源选择器来更改媒体资源。您必须在账号一级具有编辑者或更高级别的角色，才能修改数据流。
3.  选择要修改的数据流。
4.  在“Google 代码”下
5.  前往“Google 代码”标签页，然后选择**配置代码设置**。
6.  在“配置”标签页下，点击“您的 Google 代码”部分中的**代码添加说明**。
7.  点击**手动添加**，在您的网站代码中使用 gtag.js 添加 Google 代码。
    -   如果您使用的是 WordPress、Shopify 或 Wix 等网站开发工具或 CMS，请参阅[使用网站开发工具或 CMS 添加 Google 代码](https://support.google.com/tagmanager/answer/12403447)。
8.  点击代码段旁边的 ![Copy](https://storage.googleapis.com/support-kms-prod/XLSaVWxrWPh5wIsNefMRJK33I8sHizqt6GXn) 将代码复制到剪贴板。
9.  将整个代码段粘贴到您网站上每个网页的代码中，紧跟在 `<head>` 元素之后。每个网页只能添加一个 Google 代码。
10.  在“测试您的网站”部分，输入您的网站网址，然后点击**测试**。

___

## 后续步骤

最多可能需要 30 分钟才会开始收集数据。数据收集开始后，请[验证 Google 代码](https://support.google.com/analytics/answer/15756111)。

___

### 相关链接

-   [Google 代码简介](https://support.google.com/analytics/answer/11994839)
-   [设置 Google 代码](https://support.google.com/analytics/answer/12002338)
-   [Google 代码管理](https://support.google.com/analytics/answer/12329709)
-   [验证 Google 代码](https://support.google.com/analytics/answer/15756111)
-   [\[GA4\] 查找 Google 代码 ID](https://support.google.com/analytics/answer/9539598)
-   [使用 gtag.js 设置 Google 代码](https://developers.google.com/tag-platform/gtagjs)