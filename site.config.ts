import { defineSiteConfig } from "valaxy";

export default defineSiteConfig({
  url: "https://zm-github-io.vercel.app",
  lang: "zh-CN",
  title: `练习时长两年半~`,
  author: {
    name: "前端练习生zm",
    avatar: 'https://avatars.githubusercontent.com/u/99781695?v=4',
    status: {
      emoji: "🐔",
      message: '练习时长两年半~'
    }
  },
  subtitle: 'cpdd~',
  /**
   * 站点图标
   */
  favicon:
    "https://avatars.githubusercontent.com/u/99781695?v=4",
  description: "唱，跳，rap，篮球~",
  social: [
    {
      name: "GitHub",
      link: "https://github.com/wzmcoding",
      icon: "i-ri-github-line",
      color: "#6e5494",
    },
    {
      name: "wechat zm_15526070595",
      link: "https://github.com/wzmcoding",
      icon: "i-ri-wechat-fill",
      color: "#78c93d",
    }
  ],

  search: {
    enable: true,
  },

  sponsor: {
    enable: false,
  },

  /**
   * 开启阅读统计
   */
  statistics: {
    enable: true,
    readTime: {
      /**
       * 阅读速度
       */
      speed: {
        cn: 300,
        en: 200,
      },
    },
  },

  /**
   * 开启图片预览
   */
  mediumZoom: { enable: true }
});
