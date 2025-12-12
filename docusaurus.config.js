// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

const baseUrl = process.env.BASE_URL || "/";
console.log(`Using baseUrl: ${baseUrl}`);

/** @type {import('@docusaurus/types').Config} */
module.exports = {
  title: "Fluent Docs",
  tagline: "Explore Fluent Docs",
  url: "https://docs.fluent.org",
  baseUrl,
  onBrokenLinks: "throw",
  onBrokenAnchors: "warn",
  onBrokenMarkdownLinks: "warn",
  // favicon: 'img/logos/faviconDark.png',
  favicon: "img/logos/faviconPurple.png",
  organizationName: "Fluent", // Usually your GitHub org/user name.
  projectName: "Fluent-docs", // Usually your repo name.

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",

          // // Custom sidebars file logic defined here.
          // sidebarPath: require.resolve('./sidebars.js'),

          // Sidebar plugins documentation:
          // https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs

          // "sidebarCollapsible: false" forces all sidebars to be open at all times.
          // sidebarCollapsible: true,
          // "sidebarCollapsed: false" sets all sidebars to open by default. Might be over written in CSS.
          sidebarCollapsed: false,

          // "Edit this page" will redirect to this defined full GitHub repository with the branch defined as well.
          editUrl:
            "https://github.com/fluentlabs-xyz/docs-docusaurus/blob/main/",

          // Custom admonition types
          admonitions: {
            keywords: [
              "tip",
              "prerequisite",
              "warning",
              "info",
              "danger",
              "best-practice",
              "summary",
            ],
            extendDefaults: true,
          },
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.scss"),
        },
        gtag: {
          trackingID: process.env.GTM_ID || "GTM-XXXXXXX",
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      algolia: {
        appId: "M4JGWXQJP4",
        apiKey: "5681f211df732bda5a2631e5d29b8efd",
        indexName: "Fluent",
      },
      docs: {
        sidebar: {
          hideable: true,
          // // autoCollapseCategories option would collapse all sibling categories when expanding one category.
          // // This saves the user from having too many categories open and helps them focus on the selected section.
        },
      },
      imageZoom: {
        // CSS selector to apply the plugin to, defaults to '.markdown img'
        // selector: '.markdown img',
        // Optional medium-zoom options
        // see: https://www.npmjs.com/package/medium-zoom#options
        options: {
          margin: 40,
          background: "#000",
          scrollOffset: 60,
          // container: 'main',
          // template: '#zoom-template',
        },
      },
      navbar: {
        title: "",
        hideOnScroll: true,
        logo: {
          alt: "Fluent Docs Logo",
          // Note: these raw images are scaled down with CSS
          // with class .navbar__logo img inside file custom.scss
          src: "/img/logos/rectangle.png",
          srcDark: "/img/logos/rectangle.png",
        },

        items: [
          {
            href: "https://chainlist.org/?search=fluent&testnets=true",
            label: "Connect",
            position: "left",
            // className: 'navbar_item_button',
          },
          {
            href: "https://testnet.fluent.xyz/dev-portal",
            label: "Faucet",
            position: "left",
            // className: 'navbar_item_button',
          },
          {
            href: "https://testnet.fluentscan.xyz/",
            label: "Blockscout",
            position: "left",
            // className: 'navbar_item_button',
          },
          // {
          //   href: "https://defillama.com/chain/Ethereum",
          //   label: "Ecosystem",
          //   position: "left",
          //   // className: 'navbar_item_1',
          // },
          {
            href: "https://discord.com/invite/fluentxyz",
            label: "Discord",
            position: "left",
            // className: 'navbar_item_2',
          },
          {
            href: "https://github.com/fluentlabs-xyz/",
            label: "GitHub",
            position: "right",
          },
        ],
      },

      footer: {
        links: [
          {
            title: "General",
            items: [
              {
                label: "Home",
                to: "https://fluent.xyz",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                to: "https://discord.com/invite/fluentxyz",
              },
            ],
          },
          {
            title: "Resources",
            items: [
              {
                label: "GitHub",
                to: "https://github.com/fluentlabs-xyz/",
              },
            ],
          },
        ],
        logo: {
          alt: "Fluent Logo",
          src: "img/logos/square.png",
          href: "https://github.com/fluentlabs-xyz/",
          height: 100,
          width: 100,
        },
      },
      prism: {
        theme: darkCodeTheme,
        additionalLanguages: ["solidity", "python", "rust", "bash", "toml"],
      },
      colorMode: {
        defaultMode: "dark",
        // Turn light and dark mode theme button on (false) or off (true).
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
    }),
  plugins: [
    "docusaurus-plugin-sass",
    "plugin-image-zoom",
    "docusaurus-lunr-search", // Local backup search bar once website is deployed.
  ],

  // Add custom scripts
  scripts: [
    {
      src: "/js/sidebar-highlight.js",
      async: true,
    },
  ],
};
