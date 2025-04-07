import { Dependency } from "../types";

export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  license?: string;
  readme?: string;
  readmeFilename?: string;
  _id: string;
  dist: {
    shasum: string;
    tarball: string;
    integrity?: string;
    signatures?: Array<{
      keyid: string;
      sig: string;
    }>;
  };
  _npmVersion?: string;
  _npmUser?: {
    name: string;
    email: string;
  };
  maintainers?: Array<{
    name: string;
    email: string;
    url?: string;
  }>;
  bugs?: {
    url: string;
  };
  gitHead?: string;
  _shasum?: string;
  _from?: string;
  _nodeVersion?: string;
  _npmOperationalInternal?: {
    host: string;
    tmp: string;
  };
  directories?: Record<string, unknown>;
}

export async function getPackageInfo(dep: Dependency): Promise<PackageInfo> {
  if (!dep.name || !dep.version) {
    throw new Error("Invalid dependency object");
  }
  const absoluteVersion = (
    dep.version.startsWith("^") ? dep.version.slice(1) : dep.version
  ).split(" ")[0];
  const resp = await fetch(
    `https://registry.npmjs.org/${dep.name}/${absoluteVersion}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );
  const data = await resp.json();
  return data;
}
