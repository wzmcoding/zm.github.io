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



#### 2. Tailwind CSS
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





### 如何利用Lint工具链来保证代码风格和质量
#### JS/TS 规范工具: ESLint
- 初始化, `pnpm i eslint -D`
- 接着执行 ESLint 的初始化命令，并进行如下的命令行交互, `npx eslint --init`
- 接着 ESLint 会帮我们自动生成`.eslintrc.js`配置文件，也可能没有，自己建一个。需要注意的是，在上述初始化流程中我们并没有用 npm 安装依赖，需要进行手动安装:
```bash
pnpm i eslint-plugin-react@latest @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest -D
```
##### 核心配置解读
- parser解析器（ESLint 底层不支持 TypeScript，社区提供了`@typescript-eslint/parser`这个解决方案，专门为了 TypeScript 的解析而诞生）
- parserOptions解析器选项，
  这个配置可以对上述的解析器进行能力定制，默认情况下 ESLint 支持 ES5 语法，你可以配置这个选项，具体内容如下:
  - ecmaVersion: 这个配置和 `Acron` 的 [ecmaVersion](https://github.com/acornjs/acorn/tree/master/acorn) 是兼容的，可以配置 `ES + 数字`(如 ES6)或者`ES + 年份`(如 ES2015)，也可以直接配置为`latest`，启用最新的 ES 语法。
  - sourceType: 默认为`script`，如果使用 ES Module 则应设置为`module`
  - ecmaFeatures: 为一个对象，表示想使用的额外语言特性，如开启 `jsx`。
```bash
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
    jsxPragma: 'React',
    ecmaFeatures: {
    jsx: true,
  },
}
```
- rules具体代码规则，`rules` 配置即代表在 ESLint 中手动调整哪些代码规则，比如`禁止在 if 语句中使用赋值语句`这条规则可以像如下的方式配置:
在 rules 对象中，`key` 一般为`规则名`，`value` 为具体的配置内容，在上述的例子中我们设置为一个数组，数组第一项为规则的 `ID`，第二项为`规则的配置`。
这里重点说一说规则的 ID，它的语法对所有规则都适用

  - `off` 或 `0`: 表示关闭规则。
  - `warn` 或 `1`: 表示开启规则，不过违背规则后只抛出 warning，而不会导致程序退出。
  - `error` 或 `2`: 表示开启规则，不过违背规则后抛出 error，程序会退出。

```ts
// .eslintrc.js
module.exports = {
  // 其它配置省略
  rules: {
    // key 为规则名，value 配置内容
    "no-cond-assign": ["error", "always"]
  }
}
```
具体的规则配置可能会不一样，有的是一个字符串，有的可以配置一个对象，可以参考 [ESLint 官方文档](https://cn.eslint.org/docs/rules/)。
也能直接将 `rules` 对象的 `value` 配置成 ID，如: `"no-cond-assign": "error"`。
- plugins
  ESLint 本身也没有内置 TypeScript 的代码规则，这个时候 ESLint 的插件系统就派上用场了。我们需要通过添加 ESLint 插件来增加一些特定的规则，比如添加`@typescript-eslint/eslint-plugin` 来拓展一些关于 TS 代码的规则，如下代码所示:
```js
// .eslintrc.js
module.exports = {
  // 添加 TS 规则，可省略`eslint-plugin`
  plugins: ['@typescript-eslint']
}
```
值得注意的是，添加插件后只是拓展了 ESLint 本身的规则集，但 ESLint 默认并**没有开启**这些规则的校验！如果要开启或者调整这些规则，你需要在 rules 中进行配置，如:
```js
// .eslintrc.js
module.exports = {
  // 开启一些 TS 规则
  rules: {
    '@typescript-eslint/ban-ts-comment': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  }
}
```
- extends继承配置
  extends 相当于`继承`另外一份 ESLint 配置，可以配置为一个字符串，也可以配置成一个字符串数组。主要分如下 3 种情况:

1. 从 ESLint 本身继承；
2. 从类似 `eslint-config-xxx` 的 npm 包继承；
3. 从 ESLint 插件继承。
```ts
// .eslintrc.js
module.exports = {
   "extends": [
     // 第1种情况
     "eslint:recommended",
     // 第2种情况，一般配置的时候可以省略 `eslint-config`
     "standard",
     // 第3种情况，可以省略包名中的 `eslint-plugin`
     // 格式一般为: `plugin:${pluginName}/${configName}`
     "plugin:react/recommended",
     "plugin:@typescript-eslint/recommended",
   ]
}
```
   有了 extends 的配置，对于之前所说的 ESLint 插件中的繁多配置，我们就**不需要手动一一开启**了，通过 extends 字段即可自动开启插件中的推荐规则:
```bash
 extends: ["plugin:@typescript-eslint/recommended"]
```
- env 和 globals
  这两个配置分别表示`运行环境`和`全局变量`，在指定的运行环境中会预设一些全局变量，比如:
```js
// .eslint.js
module.export = {
  "env": {
    "browser": "true",
    "node": "true"
  }
}
```
指定上述的 `env` 配置后便会启用浏览器和 Node.js 环境，这两个环境中的一些全局变量(如 `window`、`global` 等)会同时启用。
有些全局变量是业务代码引入的第三方库所声明，这里就需要在`globals`配置中声明全局变量了。每个全局变量的配置值有 3 种情况:

1. `"writable"`或者 `true`，表示变量可重写；
2. `"readonly"`或者`false`，表示变量不可重写；
3. `"off"`，表示禁用该全局变量。
拿`jquery`举例，我们可以在配置文件中声明如下:
```js
// .eslintrc.js
module.exports = {
  "globals": {
    // 不可重写
    "$": false,
    "jQuery": false
  }
}
```
##### 与 Prettier 强强联合
虽然 ESLint 本身具备自动格式化代码的功能(`eslint --fix`)，但术业有专攻，ESLint 的主要优势在于`代码的风格检查并给出提示`，而在代码格式化这一块 Prettier 做的更加专业，因此我们经常将 ESLint 结合 Prettier 一起使用。
```bash
pnpm i prettier -D
```
在项目根目录新建`.prettierrc.js`配置文件，填写如下的配置内容:
```ts
// .prettierrc.js
module.exports = {
  printWidth: 80, //一行的字符数，如果超过会进行换行，默认为80
  tabWidth: 2, // 一个 tab 代表几个空格数，默认为 2 个
  useTabs: false, //是否使用 tab 进行缩进，默认为false，表示用空格进行缩减
  singleQuote: true, // 字符串是否使用单引号，默认为 false，使用双引号
  semi: true, // 行尾是否使用分号，默认为true
  trailingComma: "none", // 是否使用尾逗号
  bracketSpacing: true // 对象大括号直接是否有空格，默认为 true，效果：{ a: 1 }
};
```
接下来我们将`Prettier`集成到现有的`ESLint`工具中，首先安装两个工具包:

```bash
pnpm i eslint-config-prettier eslint-plugin-prettier -D
```
其中`eslint-config-prettier`用来覆盖 ESLint 本身的规则配置，而`eslint-plugin-prettier`则是用于让 Prettier 来接管`eslint --fix`即修复代码的能力。

在 `.eslintrc.js` 配置文件中接入 prettier 的相关工具链，最终的配置代码如下所示
```js
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    // 1. 接入 prettier 的规则
    "prettier",
    "plugin:prettier/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: "latest",
    sourceType: "module"
  },
  // 2. 加入 prettier 的 eslint 插件
  plugins: ["react", "@typescript-eslint", "prettier"],
  rules: {
    // 3. 注意要加上这一句，开启 prettier 自动修复的功能
    "prettier/prettier": "error",
    quotes: ["error", "single"],
    semi: ["error", "always"],
    "react/react-in-jsx-scope": "off"
  }
};
```

#### 样式规范工具: Stylelint
> Stylelint，一个强大的现代化样式 Lint 工具，用来帮助你避免语法错误和统一代码风格。

Stylelint 主要专注于样式代码的规范检查，内置了 **170 多个 CSS 书写规则**，支持 **CSS 预处理器**(如 Sass、Less)，提供**插件化机制**以供开发者扩展规则，已经被 Google、Github 等**大型团队**投入使用。与 ESLint 类似，在规范检查方面，Stylelint 已经做的足够专业，而在代码格式化方面，我们仍然需要结合 Prettier 一起来使用。
```bash
pnpm i stylelint stylelint-prettier stylelint-config-prettier stylelint-config-recess-order stylelint-config-standard stylelint-config-standard-scss -D
```
然后，我们在 Stylelint 的配置文件`.stylelintrc.cjs`中一一使用这些工具套件:

```js
// .stylelintrc.cjs
module.exports = {
  // 注册 stylelint 的 prettier 插件
  plugins: ['stylelint-prettier'],
  // 继承一系列规则集合
  extends: [
    // standard 规则集合
    'stylelint-config-standard',
    // standard 规则集合的 scss 版本
    'stylelint-config-standard-scss',
    // 样式属性顺序规则
    'stylelint-config-recess-order',
    // 接入 Prettier 规则
    'stylelint-config-prettier',
    'stylelint-prettier/recommended'
  ],
  // 配置 rules
  rules: {
    // 开启 Prettier 自动格式化功能
    'prettier/prettier': true
  }
};
```

可以发现 Stylelint 的配置文件和 ESLint 还是非常相似的，常用的`plugins`、`extends`和`rules`属性在 ESLint 同样存在，并且与 ESLint 中这三个属性的功能也基本相同。不过需要强调的是在 Stylelint 中 rules 的配置会和 ESLint 有些区别，对于每个具体的 rule 会有三种配置方式:

- `null`，表示关闭规则。
- 一个简单值(如 true，字符串，根据不同规则有所不同)，表示开启规则，但并不做过多的定制。
- 一个数组，包含两个元素，即`[简单值，自定义配置]`，第一个元素通常为一个简单值，第二个元素用来进行更精细化的规则配置。

接下来我们将 Stylelint 集成到项目中，回到 `package.json` 中，增加如下的 `scripts` 配置:

```json
{
  "scripts": {
    // 整合 lint 命令
    "lint": "npm run lint:script && npm run lint:style",
    // stylelint 命令
    "lint:style": "stylelint --fix \"src/**/*.{css,scss}\""
  }
}
```

执行`pnpm run lint:style`即可完成样式代码的规范检查和自动格式化。



#### Husky + lint-staged 的 Git 提交工作流集成
##### 提交前的代码 Lint 检查
- 在上文中我们提到了安装 `ESLint`、`Prettier`和`Stylelint`的 VSCode 插件或者 Vite 插件，在开发阶段提前规避掉代码格式的问题，但实际上这也只是将问题提前暴露，并不能保证规范问题能完全被解决，还是可能导致线上的代码出现不符合规范的情况。那么如何来避免这类问题呢？

我们可以在代码提交的时候进行卡点检查，也就是拦截 `git commit` 命令，进行代码格式检查，只有确保通过格式检查才允许正常提交代码。社区中已经有了对应的工具——`Husky`来完成这件事情，让我们来安装一下这个工具:
```bash
pnpm i husky -D
```
- husky init
init 命令简化了项目中的 husky 设置。它会在 .husky/ 中创建 pre-commit 脚本，并更新 package.json 中的 prepare 脚本。随后可根据你的工作流进行修改。
```bash
pnpm exec husky init
```
我们直接在 Husky 的钩子中执行 `npm run lint`，这会产生一个额外的问题: Husky 中每次执行`npm run lint`都对仓库中的代码进行全量检查，也就是说，即使某些文件并没有改动，也会走一次 Lint 检查，当项目代码越来越多的时候，提交的过程会越来越慢，影响开发体验。

而`lint-staged`就是用来解决上述全量扫描问题的，可以实现只对存入`暂存区`的文件进行 Lint 检查，大大提高了提交代码的效率。首先，让我们安装一下对应的 npm 包:

```bash
pnpm i -D lint-staged
```

然后在 `package.json`中添加如下的配置:

```json
{
  "lint-staged": {
    "**/*.{js,jsx,tsx,ts}": [
      "npm run lint:script",
      "git add ."
    ],
    "**/*.{scss}": [
      "npm run lint:style",
      "git add ."
    ]
  }
}
```

接下来我们需要在 Husky 中应用`lint-stage`，回到`.husky/pre-commit`脚本中，将原来的`npm run lint`换成如下脚本:

```bash
npx --no -- lint-staged
```

如此一来，我们便实现了提交代码时的`增量 Lint 检查`。
##### 提交时的 commit 信息规范
除了代码规范检查之后，Git 提交信息的规范也是不容忽视的一个环节，规范的 commit 信息能够方便团队协作和问题定位。首先我们来安装一下需要的工具库，执行如下的命令:
```bash
pnpm i commitlint @commitlint/cli @commitlint/config-conventional -D
```

接下来新建`.commitlintrc.js`
```ts
// .commitlintrc.js
module.exports = {
  extends: ["@commitlint/config-conventional"]
};
```
一般我们直接使用`@commitlint/config-conventional`规范集就可以了，它所规定的 commit 信息一般由两个部分: `type` 和 `subject` 组成，结构如下:

```js
// type 指提交的类型
// subject 指提交的摘要信息
<type>: <subject>
```

常用的 `type` 值包括如下:

- `feat`: 添加新功能。
- `fix`: 修复 Bug。
- `chore`: 一些不影响功能的更改。
- `docs`: 专指文档的修改。
- `perf`: 性能方面的优化。
- `refactor`: 代码重构。
- `test`: 添加一些测试代码等等。

# Add commit message linting to commit-msg hook
```bash
echo "pnpm dlx commitlint --edit \$1" > .husky/commit-msg

npm pkg set scripts.commitlint="commitlint --edit"
echo "pnpm commitlint \${1}" > .husky/commit-msg
```
ok, 完成了 Git 提交信息的卡点扫描和规范检查。
