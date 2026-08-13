import type { ReactNode } from "react";

export type DocsCodeLanguage = "bash" | "css" | "ts" | "tsx";

export type DocsCodeSample = {
  code: string;
  language: DocsCodeLanguage;
  title: string;
};

export type DocsExampleCase = {
  codeSamples: DocsCodeSample[];
  description: string;
  title: string;
};

export type DocsPage = {
  body?: ReactNode;
  category: string;
  examples: DocsExampleCase[];
  label: string;
  path: string;
  summary: string;
  title: string;
};

export type ApiPropEntry = {
  name: string;
  type: string;
  description: string;
  detail: string;
};

export type ApiMethodEntry = {
  name: string;
  params: string;
  returns: string;
  description: string;
  sample?: DocsCodeSample;
};

export type ApiEventEntry = {
  name: string;
  payload: string;
  when: string;
  description: string;
};

export type ApiFeatureSection = {
  id: string;
  title: string;
  summary: string;
  props: ApiPropEntry[];
  events?: ApiEventEntry[];
  methods?: ApiMethodEntry[];
  samples: DocsCodeSample[];
};

export type DocsSearchItem = {
  id: string;
  kind: "문서" | "예제" | "API" | "코드";
  title: string;
  description: string;
  path: string;
  hash?: string;
  keywords: string;
};
