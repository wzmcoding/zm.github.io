---
title: 实现图片预加载 vite 插件
date: 2025-10-14
updated: 2025-10-14
categories: vite 插件
tags:
  - vite 插件
top: 1
---


## 实现图片预加载 vite 插件
```ts
export default definConfig({
  // base: '/dist/', // 如果项目部署在二级目录，需要指定 base 路径
  plugins: [vue(), vueJsx(), preloadImages()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  }
})
```

`preloadImages` 函数里指定一个图片目录，然后把目录下的所有图片都放到 head 里预加载
```ts
preloadImages({
  dir: 'images/*.{jpg,png,gif,webp,svg}'
  attrs: {
    rel: 'preload'
  }
})
```

```ts
import type { Plugin } from 'vite'
import fg from 'fast-glob'

interface PreloadImagesOptions {
  dir: string // 图片目录
  attrs: {
    rel: 'prefetch | preload' // 预加载类型
  }
}

export const preloadImages = (options: PreloadImagesOptions): Plugin => {
  const { dir, attrs = {} } = options

  return {
    name: 'vite-plugin-image-prefetch', // 插件名字，必须要有
    transformIndexHtml(html, ctx) {
      // return html.replace('<title>Vite App</title>', '<title>Hello World</title>')

      // 这样可以把图片放到 head 里预加载，但是写死了，能不能加载某个目录下的所有图片呢？
      // return [
      //    {
      //      tag: 'link',
      //       attrs: {
      //          rel: 'prefetch',
      //          href: 'https://example.com/image1.png',
      //          as: 'image'
      //       }
      //    }
      // ]

      // 获取图片目录下的所有图片
      const files = fg.sync(dir, {
        cwd: ctx.server?.config.publicDir,
      })
      console.log('files', files) // [ 'images/logo.png' ]

      const images = files.map(file => ctx.server?.config.base + file) // 加上 base 路径, 用户如果指定base 路径，也能正确加载
      console.log('images', images) // [ '/images/logo.png' ]
      return images.map((href) => {
        return {
          tag: 'link',
          attrs: {
            // prefetch 和 preload 的区别是什么？
            // 加载时机不一样，
            // perfetch 是在浏览器空闲时加载，优先级低，下次用还是要发一个请求，之前请求过了，直接用缓存就行了，
            // preload 是存到浏览器内存里，不是http缓存,优先级高，不会再发送请求了
            rel: 'prefetch',
            href,
            as: 'image',
            ...attrs, // 用户可以自定义 rel 属性
          }
        }
      })
    }
  }
}
```
