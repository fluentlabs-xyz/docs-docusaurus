import React from "react";
import styles from "./styles.module.scss";

export default function Admonition(props) {
  const { type, title, children, icon } = props;

  const getAdmonitionConfig = (type) => {
    const configs = {
      tip: {
        icon: "💡",
        secondaryColor: "#4100F5",
        color: "#CEF564",
        defaultTitle: "Tip",
      },
      summary: {
        icon: "🎨",
        color: "#FF8FDA",
        secondaryColor: "#3700FF",
        defaultTitle: "Summary",
      },
      warning: {
        icon: "⚠️",
        secondaryColor: "#FE6901",
        color: "#FECD07",
        defaultTitle: "Warning",
      },
      info: {
        icon: "🔍 ",
        color: "#5011FF",
        secondaryColor: "#32FE6B",
        defaultTitle: "Info",
      },
      danger: {
        icon: "🚨",
        color: "#8D0042",
        secondaryColor: "#FF8FDA",
        defaultTitle: "Danger",
      },
      "best-practice": {
        icon: "🏆",
        color: "#32FE6B",
        secondaryColor: "#064400",
        defaultTitle: "Best Practice",
      },
      prerequisite: {
        icon: "🧱",
        secondaryColor: "#4F11FA",
        color: "#FF7B69",
        defaultTitle: "Prerequisite",
      },
    };
    return configs[type] || configs.tip;
  };

  const config = getAdmonitionConfig(type);
  const displayTitle = title || config.defaultTitle;
  const displayIcon = icon || config.icon;

  return (
    <div
      className={styles.customAdmonition}
      data-type={type}
      style={{
        "--admonition-color": config.color,
        "--admonition-color-secondary": config.secondaryColor,
      }}
    >
      <div className={styles.admonitionHeader} data-type={type}>
        <span className={styles.admonitionIcon}>{displayIcon}</span>
        <span className={styles.admonitionTitle}>{displayTitle}</span>
      </div>
      <div className={styles.admonitionContent}>{children}</div>
    </div>
  );
}
