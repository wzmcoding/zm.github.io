---
title: 前端工程化-vite
date: 2024-09-26
updated: 2024-09-26
categories: ZM 笔记
tags:
  - 前端工程化
top: 2
---

### 前端工程的痛点
- 模块化需求
- 兼容浏览器，编译高级语法
- 线上代码的质量
- 开发效率，项目的冷启动/二次启动时间、热更新时间

### 前端构建工具是如何解决以上问题的呢？
- 模块化方面，提供模块加载方案，并兼容不同的模块规范。
- 语法转译方面，配合 Sass、TSC、Babel 等前端工具链，完成高级语法的转译功能，同时对于静态资源也能进行处理，使之能作为一个模块正常加载。
- 产物质量方面，在生产环境中，配合 Terser等压缩工具进行代码压缩和混淆，通过 Tree Shaking 删除未使用的代码，提供对于低版本浏览器的语法降级处理等等。
- 开发效率方面，构建工具本身通过各种方式来进行性能优化，包括使用原生语言 Go/Rust、no-bundle等等思路，提高项目的启动性能和热更新的速度。

### 为什么 Vite 是当前最高效的构建工具？
#### 开发效率高
- Vite 能将项目的启动性能提升一个量级，并且达到毫秒级的瞬间热更新效果。而Webpack 项目冷启动时必须递归打包整个项目的依赖树，JavaScript 语言本身的性能限制，导致构建性能遇到瓶颈，直接影响开发效率
- Vite 在开发阶段基于浏览器原生 ESM 的支持实现了no-bundle服务
- Vite 借助 Esbuild 超快的编译速度来做第三方库构建和 TS/JSX 语法编译，从而能够有效提高开发效率。

#### 模块化
- 模块化方面，Vite 基于浏览器原生 ESM 的支持实现模块加载，并且无论是开发环境还是生产环境，都可以将其他格式的产物(如 CommonJS)转换为 ESM。

#### 语法转译
- 语法转译方面，Vite 内置了对 TypeScript、JSX、Sass 等高级语法的支持，也能够加载各种各样的静态资源，如图片、Worker 等等。

#### 产物质量
- 产物质量方面，Vite 基于成熟的打包工具 Rollup 实现生产环境打包，同时可以配合Terser、Babel等工具链，可以极大程度保证构建产物的质量。

### 前端模块化是如何演进的
- 无模块化标准阶段(文件划分、命名空间和 IIFE(立即执行函数) 私有作用域), 但是并没有真正解决另外一个问题——模块加载，如果模块间存在依赖关系，那么 script 标签的加载顺序就需要受到严格的控制，一旦顺序不对，则很有可能产生运行时 Bug。
- CommonJS 规范 使用 require 来导入一个模块，用module.exports来导出一个模块。 存在的问题：模块加载器由 Node.js 提供，依赖了 Node.js 本身的功能实现，比如文件系统，如果 CommonJS 模块直接放到浏览器中是无法执行的。CommonJS 本身约定以同步的方式进行模块加载，模块请求会造成浏览器 JS 解析过程的阻塞，导致页面加载速度缓慢。
- AMD 规范(异步模块定义规范),在浏览器环境中会被异步加载，而不会像 CommonJS 规范进行同步加载，也就不会产生同步请求导致的浏览器解析过程阻塞的问题了
- ES6 Module,在现代浏览器中，如果在 HTML 中加入含有type="module"属性的 script 标签，那么浏览器会按照 ES Module 规范来进行依赖加载和模块解析，这也是 Vite 在开发阶段实现 no-bundle 的原因，由于模块加载的任务交给了浏览器，即使不打包也可以顺利运行模块代码
- 不仅如此，一直以 CommonJS 作为模块标准的 Node.js 也紧跟 ES Module 的发展步伐，从 12.20 版本开始正式支持原生 ES Module。也就是说，如今 ES Module 能够同时在浏览器与 Node.js 环境中执行，拥有天然的跨平台能力。

> ES Module 作为 ECMAScript 官方提出的规范，经过五年多的发展，不仅得到了众多浏览器的原生支持，也在 Node.js 中得到了原生支持，是一个能够跨平台的模块规范。同时，它也是社区各种生态库的发展趋势，尤其是被如今大火的构建工具 Vite 所深度应用。可以说，ES Module 前景一片光明，成为前端大一统的模块标准指日可待。


### 使用Vite从零搭建前端项目
```bash
pnpm create vite
```

#### 项目入口加载
- HTML 文件的内容非常简洁，在 body 标签中除了 id 为 root 的根节点之外，还包含了一个声明了type="module"的 script 标签:
```javascript
<script type="module" src="/src/main.tsx"></script>
```
> 由于现代浏览器原生支持了 ES 模块规范，因此原生的 ES 语法也可以直接放到浏览器中执行，只需要在 script 标签中声明 type="module" 即可。比如上面的 script 标签就声明了 type="module"，同时 src 指向了/src/main.tsx文件，此时相当于请求了http://localhost:3000/src/main.tsx这个资源，Vite 的 Dev Server 此时会接受到这个请求，然后读取对应的文件内容，进行一定的中间处理，最后将处理的结果返回给浏览器。

- Vite 会将项目的源代码编译成浏览器可以识别的代码，与此同时，一个 import 语句即代表了一个 HTTP 请求，如下面两个 import 语句:
```js
import "/src/index.css";
import App from "/src/App.tsx";
```
- 需要注意的是，在 Vite 项目中，一个import 语句即代表一个 HTTP 请求。上述两个语句则分别代表了两个不同的请求，Vite Dev Server 会读取本地文件，返回浏览器可以解析的代码。当浏览器解析到新的 import 语句，又会发出新的请求，以此类推，直到所有的资源都加载完成。
-  Vite 所倡导的no-bundle理念的真正含义: **利用浏览器原生 ES 模块的支持，实现开发阶段的 Dev Server，进行模块的按需加载，而不是先整体打包再进行加载**

### 初识配置文件
- 可以通过两种方式来对 Vite 进行配置，一是通过命令行参数，如vite --port=8888，二是通过配置文件
- Vite 当中支持多种配置文件类型，包括.js、.ts、.mjs三种后缀的文件，实际项目中一般使用vite.config.ts作为配置文件
- 需求: 页面的入口文件index.html并不在项目根目录下，而需要放到 src 目录下，如何在访问localhost:3000的时候让 Vite 自动返回 src 目录下的index.html呢？我们可以通过root参数配置项目根目录的位置:
```typescript
import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  root: path.join(__dirname, 'src'),
  plugins: [react()],
})
```
- 当手动指定root参数之后，Vite 会自动从这个路径下寻找index.html文件,当我直接访问 localhost,Vite 从src目录下读取入口文件，这样就成功实现了刚才的需求。

### 生产环境构建
- 在开发阶段 Vite 通过 Dev Server 实现了不打包的特性，而在生产环境中，Vite 依然会基于 Rollup 进行打包，并采取一系列的打包优化手段。
```bash
pnpm run build
```


### 在 Vite 中引入现代的各种 CSS 样式方案
- 样式方案的意义:如果我们不用任何 CSS 工程方案,出现的问题： 开发体验欠佳（原生 CSS 不支持选择器的嵌套）、样式污染问题。如果出现同样的类名，很容易造成不同的样式互相覆盖和污染、浏览器兼容问题、打包后的代码体积问题。
- 原生 CSS 的痛点，社区中诞生了不少解决方案，常见的有 5 类
  - CSS 预处理器：主流的包括Sass/Scss、Less和Stylus。
  - CSS Modules：能将 CSS 类名处理成哈希值，这样就可以避免同名的情况下样式污染的问题。
  - CSS 后处理器PostCSS，用来解析和处理 CSS 代码，可以实现的功能非常丰富，比如将 px 转换为 rem、根据目标浏览器情况自动加上类似于--moz--、-o-的属性前缀等等。
  - CSS in JS 方案，主流的包括emotion、styled-components等等
  - CSS 原子化框架，如Tailwind CSS、Windi CSS，通过类名来指定样式，大大简化了样式写法，提高了样式开发的效率，主要解决了原生 CSS 开发体验的问题


### CSS 预处理器
#### vite配置自动引入scss文件
```scss
$theme-color: purple;
```
```scss
@import '../../variable.scss';

.header {
    color: $theme-color;
}
```
- 每次要使用$theme-color属性的时候我们都需要手动引入variable.scss文件，那有没有自动引入的方案呢？
```typescript
import { defineConfig, normalizePath } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 使用normalizePath解决windows路径问题
const variablePath = normalizePath(path.join(__dirname, 'src/variable.scss'))

// https://vitejs.dev/config/
export default defineConfig({
  root: path.join(__dirname, 'src'),
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "${variablePath}";`,
      },
    },
  }
})
```

### CSS Modules
- CSS Modules 在 Vite 也是一个开箱即用的能力，Vite 会对后缀带有.module的样式文件自动应用 CSS Modules。
```jsx
import styles from './index.module.scss'

export function Header() {
    return <header className={styles.header}>
        header
    </header>
}
```
- 类名会被处理成哈希值的形式
- 也可以在配置文件中的css.modules选项来配置 CSS Modules 的功能
```ts
export default defineConfig({
  root: path.join(__dirname, 'src'),
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "${variablePath}";`,
      },
    },
    modules: {
      // name是文件名，local是类名
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  }
})
```

### PostCSS
- 可以通过 postcss.config.js 来配置 postcss, 不过在 Vite 配置文件中已经提供了 PostCSS 的配置入口
- 安装一个常用的 PostCSS 插件 `pnpm i autoprefixer -D` ,这个插件主要用来自动为不同的目标浏览器添加样式前缀，解决的是浏览器兼容性的问题。
```typescript
export default defineConfig({
  root: path.join(__dirname, 'src'),
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "${variablePath}";`,
      },
    },
    modules: {
      // name是文件名，local是类名
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    // 进行 PostCSS 配置
    postcss: {
      plugins: [
        autoprefixer({
          // 指定目标浏览器
          overrideBrowserslist: ['Chrome >= 40', 'ff >= 31', 'ie 11'],
        }),
      ],
    },
  }
})
```

### CSS In JS
- styled-components和emotion。
- 对于 CSS In JS 方案，在构建侧我们需要考虑选择器命名问题、DCE(Dead Code Elimination 即无用代码删除)、代码压缩、生成 SourceMap、服务端渲染(SSR)等问题，
- 而styled-components和emotion已经提供了对应的 babel 插件来解决这些问题，我们在 Vite 中要做的就是集成这些 babel 插件


### CSS 原子化框架
- CSS 原子化框架主要包括Tailwind CSS 和 Windi CSS
- Windi CSS 作为前者的替换方案，实现了按需生成 CSS 类名的功能，开发环境下的 CSS 产物体积大大减少，速度上比Tailwind CSS v2快 20~100 倍！当然，Tailwind CSS 在 v3 版本也引入 JIT(即时编译) 的功能，解决了开发环境下 CSS 产物体积庞大的问题。

#### 1. Windi CSS 接入（可能出现样式不生效的问题，项目不要包含中文和特殊字符）
```bash
pnpm i windicss vite-plugin-windicss -D
```
```typescript
import windi from 'vite-plugin-windicss'

export default defineConfig({
  root: path.join(__dirname, 'src'),
  plugins: [react(), windi()],
})
```
- 接着要注意在src/main.tsx中引入一个必需的 import 语句
```typescript
// main.tsx
// 用来注入 Windi CSS 所需的样式，一定要加上！
import "virtual:windi.css";
```
- 这样我们就完成了 Windi CSS 在 Vite 中的接入，接下来使用并测试



### 2. Tailwind CSS
```bash
pnpm install -D tailwindcss postcss autoprefixer
```
- 然后新建两个配置文件tailwind.config.js和postcss.config.js:
```typescript
// tailwind.config.js
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}

// postcss.config.js
// 从中你可以看到，Tailwind CSS 的编译能力是通过 PostCSS 插件实现的
// 而 Vite 本身内置了 PostCSS，因此可以通过 PostCSS 配置接入 Tailwind CSS
// 注意: Vite 配置文件中如果有 PostCSS 配置的情况下会覆盖掉 post.config.js 的内容!
module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
    },
}
```

- 接着在项目的入口 CSS 中引入必要的样板代码:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
- 现在项目中就可以使用tailwind了
