import { defineSiteConfig } from "valaxy";

export default defineSiteConfig({
  url: "https://valaxy.site/",
  lang: "zh-CN",
  title: `ZM's Blog`,
  author: {
    name: "前端练习生zm",
    avatar: 'https://foruda.gitee.com/avatar/1708772741724750297/10223838_wzm_love_coding_1708772741.png!avatar200',
    status: {
      emoji: "🐔",
      message: '练习时长两年半~'
    }
  },
  subtitle: '╮(╯▽╰)╭',
  /**
   * 站点图标
   */
  favicon:
    "https://foruda.gitee.com/avatar/1708772741724750297/10223838_wzm_love_coding_1708772741.png!avatar200",
  description: "唱，跳，rap~~",
  social: [
    {
      name: "Gitee",
      link: "https://gitee.com/wzm_love_coding",
      icon: "i-ri-github-line",
      color: "#6e5494",
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
});
