import type { LocalizedText } from "../i18n/types";

export type PlaygroundExampleId = "advanced" | "layout" | "widget";
export type DocsSearchKind = "api" | "code" | "document" | "example";
export type DocsCodeLanguage = "bash" | "css" | "ts" | "tsx";

export type DocsCodeSample = {
  code: string;
  language: DocsCodeLanguage;
  title: string;
};

export type LocalizedDocsCodeSample = Omit<DocsCodeSample, "title"> & {
  title: LocalizedText;
};

export type DocsExampleCase = {
  codeSamples: DocsCodeSample[];
  description: string;
  liveExampleId?: PlaygroundExampleId;
  title: string;
};

export type LocalizedDocsExampleCase = {
  codeSamples: LocalizedDocsCodeSample[];
  description: LocalizedText;
  liveExampleId?: PlaygroundExampleId;
  title: LocalizedText;
};

export type DocsPage = {
  apiFeatures?: ApiFeatureSection[];
  body?: string[];
  category: string;
  examples: DocsExampleCase[];
  label: string;
  navParent?: string;
  path: string;
  summary: string;
  title: string;
};

export type LocalizedDocsPage = {
  body?: LocalizedText[];
  category: LocalizedText;
  examples: LocalizedDocsExampleCase[];
  label: LocalizedText;
  navParent?: LocalizedText;
  path: string;
  summary: LocalizedText;
  title: LocalizedText;
};

export type DocsNavSection = {
  label?: string;
  pages: DocsPage[];
};

export type DocsNavGroup = {
  category: string;
  sections: DocsNavSection[];
};

export type ApiPropEntry = {
  name: string;
  type: string;
  description: string;
  detail: string;
};

export type LocalizedApiPropEntry = Omit<ApiPropEntry, "description" | "detail"> & {
  description: LocalizedText;
  detail: LocalizedText;
};

export type ApiMethodEntry = {
  name: string;
  params: string;
  returns: string;
  description: string;
  sample?: DocsCodeSample;
};

export type LocalizedApiMethodEntry = Omit<ApiMethodEntry, "description" | "sample"> & {
  description: LocalizedText;
  sample?: LocalizedDocsCodeSample;
};

export type ApiEventEntry = {
  name: string;
  payload: string;
  when: string;
  description: string;
};

export type LocalizedApiEventEntry = Omit<ApiEventEntry, "description" | "when"> & {
  description: LocalizedText;
  when: LocalizedText;
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

export type LocalizedApiFeatureSection = Omit<ApiFeatureSection, "events" | "methods" | "props" | "samples" | "summary" | "title"> & {
  events?: LocalizedApiEventEntry[];
  methods?: LocalizedApiMethodEntry[];
  props: LocalizedApiPropEntry[];
  samples: LocalizedDocsCodeSample[];
  summary: LocalizedText;
  title: LocalizedText;
};

export type DocsSearchItem = {
  id: string;
  kind: DocsSearchKind;
  title: string;
  description: string;
  path: string;
  hash?: string;
  keywords: string;
};
