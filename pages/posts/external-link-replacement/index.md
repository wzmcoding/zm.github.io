---
title:
date: 2025-06-18
updated: 2025-06-18
categories: work-summary
tags:
  - work-summary
top: 1
---

#### 替换有道图片外链
- 项目现在使用了有道的图片外链，后面可能导致图片无法显示，需要换成自己系统的
- 在新增和编辑接口，将有道图片链接替换成自己的图片链接
- 通过正则表达式匹配有道图片链接， 将图片上传到自己的图片服务器，然后替换链接

```ts
/**
 * 保存或者更新
 * @param params
 */
export const save = async (params, isUpdate) => {
  const url = isUpdate ? Api.edit : Api.add;
  // 处理外链
  const content = pick(params, ['content', 'inputDesc', 'outputDesc', 'tips']);
  for (const key in content) {
    if (!content[key]) {
      // 如果没有内容，则不处理
      continue;
    }
    if (hasExternalImageLinks(content[key])) {
      // 如果有外链，则替换
      content[key] = await replaceExternalImageLinks(content[key]);
    }
  }
  params = {...params, ...content}
  return defHttp.post({ url: url, params });
};

/**
 * 检查 Markdown 文本中是否包含外链图片
 * @param content 文本内容
 * @param allowedDomain 允许的域名（默认 practix.oss-cn-hangzhou.aliyuncs.com）
 * @returns 是否存在外链图片
 */
export function hasExternalImageLinks(content: string, allowedDomain = 'practix.oss-cn-hangzhou.aliyuncs.com'): boolean {
  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/([^\/]+)\/[^\)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(content)) !== null) {
    const domain = match[3]; // 提取域名部分
    if (domain !== allowedDomain) {
      return true;
    }
  }

  return false;
}

/**
 * 替换 Markdown 中的外链图片
 * @param content 文本内容
 * @param allowedDomain 允许的域名（默认 practix.oss-cn-hangzhou.aliyuncs.com）
 * @returns 替换后的内容
 */
export async function replaceExternalImageLinks(
  content: string,
  allowedDomain = 'practix.oss-cn-hangzhou.aliyuncs.com'
): Promise<string> {
  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/([^\/]+)\/([^\)]+))\)/g;
  const matches = [...content.matchAll(imageRegex)];

  const replacements = await Promise.all(
    matches.map(async (match) => {
      const [fullMatch, altText, fullUrl, domain, path] = match;

      if (domain !== allowedDomain) {
        const file = await urlToFile(fullUrl);
        let resUrl = fullUrl;

        await uploadFile(
          {
            data: {
              biz: 'jeditor',
              jeditor: 1,
            },
            file,
          },
          (res) => {
            resUrl = res?.message ?? fullUrl;
          }
        );

        return {
          original: fullMatch,
          replacement: `![${altText}](${resUrl})`,
        };
      } else {
        return {
          original: fullMatch,
          replacement: fullMatch,
        };
      }
    })
  );

  let newContent = content;
  for (const { original, replacement } of replacements) {
    newContent = newContent.replace(original, replacement);
  }

  return newContent;
}


/**
 * 将远程图片转换为 File 对象
 * @param url 图片 URL  https://ydschool-video.nosdn.127.net/1628234400645image.png
 * @param filename 文件名（可选）
 * @returns Promise<File>
 */
export async function urlToFile(url: string, filename?: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  const name = filename || url.split('/').pop() || `${new Date().getTime()}image.png`;
  return new File([blob], name, { type: blob.type });
}
```
