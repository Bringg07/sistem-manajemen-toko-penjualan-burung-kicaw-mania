import nextCore from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**"],
  },
  ...nextCore,
  ...nextCoreWebVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      // Rule eksperimental era React Compiler: pola hidrasi localStorage
      // di effect masih pola yang sah untuk komponen client.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
